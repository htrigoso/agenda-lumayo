"use server";

import { createClient } from "@/lib/supabase/server";
import type { ItemStatus, TreatmentPlan } from "@/lib/budget";

type Result = { error?: string };

export async function getBudget(clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("treatment_plans")
    .select("*, items:treatment_items(*, attendances(id)), payments(*)")
    .eq("client_id", clientId)
    .order("created_at");
  if (error) throw new Error(error.message);
  const plans = (data ?? []) as unknown as TreatmentPlan[];
  for (const plan of plans) {
    plan.items.sort((a, b) => a.description.localeCompare(b.description));
    plan.payments.sort((a, b) => a.paid_at.localeCompare(b.paid_at));
  }
  return plans;
}

export async function savePlan(input: {
  id?: string;
  client_id: string;
  title: string;
  diagnosis: string;
}): Promise<Result> {
  const supabase = await createClient();
  const values = { title: input.title.trim() || "Plan de tratamiento", diagnosis: input.diagnosis.trim() || null };
  const { error } = input.id
    ? await supabase.from("treatment_plans").update(values).eq("id", input.id)
    : await supabase.from("treatment_plans").insert({ ...values, client_id: input.client_id });
  return error ? { error: error.message } : {};
}

export async function deletePlan(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("treatment_plans").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function saveItem(input: {
  id?: string;
  plan_id: string;
  service_id: string | null;
  description: string;
  teeth: string;
  quantity: number;
  unit_price: number;
  status: ItemStatus;
}): Promise<Result> {
  const description = input.description.trim();
  if (!description) return { error: "La descripción es obligatoria." };
  if (!Number.isInteger(input.quantity) || input.quantity < 1) return { error: "La cantidad no es válida." };
  if (!Number.isFinite(input.unit_price) || input.unit_price < 0) return { error: "El precio no es válido." };
  const supabase = await createClient();
  const values = {
    service_id: input.service_id,
    description,
    teeth: input.teeth.trim() || null,
    quantity: input.quantity,
    unit_price: input.unit_price,
    status: input.status,
  };
  const { error } = input.id
    ? await supabase.from("treatment_items").update(values).eq("id", input.id)
    : await supabase.from("treatment_items").insert({ ...values, plan_id: input.plan_id });
  return error ? { error: error.message } : {};
}

export async function setItemStatus(id: string, status: ItemStatus) {
  const supabase = await createClient();
  const { error } = await supabase.from("treatment_items").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("treatment_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function savePayment(input: {
  id?: string;
  plan_id: string;
  amount: number;
  paid_at: string;
  method: string;
  note: string;
}): Promise<Result> {
  if (!Number.isFinite(input.amount) || input.amount <= 0) return { error: "El monto debe ser mayor que cero." };
  if (!input.paid_at) return { error: "La fecha es obligatoria." };
  const supabase = await createClient();
  const values = {
    amount: input.amount,
    paid_at: input.paid_at,
    method: input.method.trim() || null,
    note: input.note.trim() || null,
  };
  const { error } = input.id
    ? await supabase.from("payments").update(values).eq("id", input.id)
    : await supabase.from("payments").insert({ ...values, plan_id: input.plan_id });
  return error ? { error: error.message } : {};
}

export async function deletePayment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
