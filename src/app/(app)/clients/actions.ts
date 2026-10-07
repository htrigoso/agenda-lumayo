"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Client } from "@/components/client-form";
import { fetchClientsPage, sanitizeTerm } from "@/lib/clients-query";
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

export async function saveClient(id: string | null, formData: FormData) {
  const supabase = await createClient();
  const values = parse(formData);
  const { error } = id
    ? await supabase.from("clients").update({ ...values, updated_at: new Date().toISOString() }).eq("id", id)
    : await supabase.from("clients").insert(values);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  redirect("/");
}

export async function deleteClient(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function loadMoreClients(page: number, q: string, onlyPriority: boolean) {
  const supabase = await createClient();
  const { data, error } = await fetchClientsPage(supabase, {
    page,
    term: sanitizeTerm(q),
    onlyPriority,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as Client[];
}
