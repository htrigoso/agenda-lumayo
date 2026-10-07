"use server";

import { createClient } from "@/lib/supabase/server";
import type { Service } from "@/lib/budget";

export async function listServices() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, name, category, default_price, active")
    .order("category", { nullsFirst: false })
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as Service[];
}

export async function saveService(input: {
  id?: string;
  name: string;
  category: string;
  default_price: number;
  active: boolean;
}): Promise<{ error?: string }> {
  const name = input.name.trim();
  if (!name) return { error: "El nombre es obligatorio." };
  if (!Number.isFinite(input.default_price) || input.default_price < 0) {
    return { error: "El precio no es válido." };
  }
  const supabase = await createClient();
  const values = {
    name,
    category: input.category.trim() || null,
    default_price: input.default_price,
    active: input.active,
  };
  const { error } = input.id
    ? await supabase.from("services").update(values).eq("id", input.id)
    : await supabase.from("services").insert(values);
  return error ? { error: error.message } : {};
}

export async function deleteService(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
