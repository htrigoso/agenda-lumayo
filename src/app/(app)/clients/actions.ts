"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Client } from "@/components/client-form";
import { NEW_TAG, fetchClientsPage, sanitizeTerm } from "@/lib/clients-query";
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
  const supabase = await createClient();
  const values = parse(formData);
  const isNew = formData.get("is_new") === "on";
  let error;
  if (id) {
    const current = await supabase.from("clients").select("tags").eq("id", id).single();
    if (current.error) throw new Error(current.error.message);
    const tags = withNewTag((current.data.tags as string[] | null) ?? [], isNew);
    ({ error } = await supabase
      .from("clients")
      .update({ ...values, tags, updated_at: new Date().toISOString() })
      .eq("id", id));
  } else {
    ({ error } = await supabase.from("clients").insert({ ...values, tags: isNew ? [NEW_TAG] : [] }));
  }
  if (error) throw new Error(error.message);
  revalidatePath("/");
  redirect("/");
}

export async function deleteClient(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  // The membership link is ON DELETE RESTRICT: a card holder or member cannot be deleted.
  if (error?.code === "23503") throw new Error("Este paciente pertenece a una membresía. Quítalo de la membresía antes de eliminarlo.");
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function loadMoreClients(page: number, q: string, onlyPriority: boolean, onlyNew: boolean) {
  const supabase = await createClient();
  const { data, error } = await fetchClientsPage(supabase, {
    page,
    term: sanitizeTerm(q),
    onlyPriority,
    onlyNew,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as Client[];
}
