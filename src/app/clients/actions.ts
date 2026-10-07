"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
