"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Client } from "@/components/client-form";
import { type CallInput, type CallSummary, validateCall } from "@/lib/calls";
import { NEW_TAG, fetchClientsPage, sanitizeTerm } from "@/lib/clients-query";
import { assertAdmin } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";

function parse(formData: FormData) {
  const get = (k: string) => String(formData.get(k) ?? "").trim() || null;
  return {
    first_name: String(formData.get("first_name")).trim(),
    last_name: String(formData.get("last_name")).trim(),
    mobile: get("mobile"),
    whatsapp: get("whatsapp"),
    email: get("email"),
    description: get("description"),
    is_priority: formData.get("is_priority") === "on",
    dni: get("dni"),
    birth_date: get("birth_date"),
    sex: get("sex"),
    address: get("address"),
    occupation: get("occupation"),
    emergency_contact: get("emergency_contact"),
    legacy_record_number: get("legacy_record_number"),
  };
}

/** Adds or removes NEW_TAG while preserving any other tags. */
function withNewTag(tags: string[], isNew: boolean) {
  const rest = tags.filter((t) => t !== NEW_TAG);
  return isNew ? [...rest, NEW_TAG] : rest;
}

export async function saveClient(id: string | null, formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const values = parse(formData);
  const isNew = formData.get("is_new") === "on";
  const contactSaved = formData.get("contact_saved") === "on";
  const now = new Date().toISOString();
  let error;
  if (id) {
    const current = await supabase.from("clients").select("tags, contact_saved_at").eq("id", id).single();
    if (current.error) throw new Error(current.error.message);
    const tags = withNewTag((current.data.tags as string[] | null) ?? [], isNew);
    // Keep the original download date when the switch stays on; clear it when staff unmark it.
    const contact_saved_at = contactSaved ? ((current.data.contact_saved_at as string | null) ?? now) : null;
    ({ error } = await supabase
      .from("clients")
      .update({ ...values, tags, contact_saved_at, updated_at: now })
      .eq("id", id));
  } else {
    ({ error } = await supabase
      .from("clients")
      .insert({ ...values, tags: isNew ? [NEW_TAG] : [], contact_saved_at: contactSaved ? now : null }));
  }
  if (error) throw new Error(error.message);
  revalidatePath("/");
  redirect("/");
}

export async function deleteClient(id: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  // The membership link is ON DELETE RESTRICT: a card holder or member cannot be deleted.
  if (error?.code === "23503") throw new Error("Este paciente pertenece a una membresía. Quítalo de la membresía antes de eliminarlo.");
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

/**
 * Records that staff saved this patient on the phone (a tap on the contact button counts).
 * No revalidatePath: the button updates optimistically and a refresh would interrupt the native form.
 */
export async function markContactSaved(id: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("mark_contact_saved", { p_id: id });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function loadMoreClients(page: number, q: string, onlyPriority: boolean, onlyNew: boolean, onlyDue: boolean) {
  const supabase = await createClient();
  const { data, error } = await fetchClientsPage(supabase, {
    page,
    term: sanitizeTerm(q),
    onlyPriority,
    onlyNew,
    onlyDue,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as Client[];
}

export type CallLog = {
  id: string;
  outcome: string;
  notes: string | null;
  follow_up_on: string | null;
  created_at: string;
  staff_name: string | null;
};

/**
 * Records a phone call with this patient. The call_logs trigger refreshes the patient's
 * "last call" columns, which are returned so the caller can update its row in place.
 */
export async function logCall(clientId: string, input: CallInput): Promise<CallSummary> {
  const invalid = validateCall(input);
  if (invalid) throw new Error(invalid);
  const supabase = await createClient();
  const { error } = await supabase.from("call_logs").insert({
    client_id: clientId,
    outcome: input.outcome,
    notes: input.notes.trim() || null,
    follow_up_on: input.followUpOn.trim() || null,
  });
  if (error) throw new Error(error.message);
  const { data, error: readError } = await supabase
    .from("clients")
    .select("last_call_at, last_call_outcome, last_call_by, next_call_on")
    .eq("id", clientId)
    .single();
  if (readError) throw new Error(readError.message);
  return data as CallSummary;
}

/** Call history of a patient, newest first, with the name of who called. */
export async function listCalls(clientId: string): Promise<CallLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("call_logs")
    .select("id, outcome, notes, follow_up_on, created_at, staff:staff_id(full_name)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const staff = row.staff as unknown as { full_name: string } | { full_name: string }[] | null;
    const name = Array.isArray(staff) ? staff[0]?.full_name : staff?.full_name;
    return {
      id: row.id as string,
      outcome: row.outcome as string,
      notes: row.notes as string | null,
      follow_up_on: row.follow_up_on as string | null,
      created_at: row.created_at as string,
      staff_name: name ?? null,
    };
  });
}

/** Deletes one call from a patient's history (admin only). The trigger recomputes the patient's last call. */
export async function deleteCall(callId: string) {
  await assertAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.from("call_logs").delete().eq("id", callId).select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("No se pudo eliminar la llamada.");
}
