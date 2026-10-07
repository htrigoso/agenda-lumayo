"use server";

import { createClient } from "@/lib/supabase/server";
import { normalizeOdontogram, type OdontogramData } from "@/lib/odontogram";

type Result = { error?: string };
export type OdontogramKind = "initial" | "current";

export type Attendance = {
  id: string;
  item_id: string | null;
  attended_at: string;
  teeth: string | null;
  procedure: string;
  notes: string | null;
  created_at: string;
  /** Plan the linked treatment belongs to (null for attendances outside the budget). */
  plan_id: string | null;
  plan_title: string | null;
};

export type OpenItem = { id: string; description: string; teeth: string | null; plan_title: string };

export async function getOdontograms(clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("odontograms")
    .select("kind, data, updated_at")
    .eq("client_id", clientId);
  if (error) throw new Error(error.message);
  const result: Partial<Record<OdontogramKind, { data: OdontogramData; updated_at: string }>> = {};
  for (const row of data ?? []) {
    result[row.kind as OdontogramKind] = { data: normalizeOdontogram(row.data), updated_at: row.updated_at };
  }
  return result;
}

export async function saveOdontogram(clientId: string, kind: OdontogramKind, data: OdontogramData): Promise<Result> {
  const clean = normalizeOdontogram(data);
  if (JSON.stringify(clean).length > 200_000) return { error: "El odontograma es demasiado grande." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("odontograms")
    .upsert(
      { client_id: clientId, kind, data: clean, updated_at: new Date().toISOString() },
      { onConflict: "client_id,kind" },
    );
  return error ? { error: error.message } : {};
}

export async function getAttendances(clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendances")
    .select("id, item_id, attended_at, teeth, procedure, notes, created_at, item:treatment_items(plan:treatment_plans(id, title))")
    .eq("client_id", clientId)
    .order("attended_at", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  type Embedded = { plan: { id: string; title: string } | { id: string; title: string }[] | null };
  const one = <T,>(v: T | T[] | null | undefined) => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));
  return (data ?? []).map(({ item, ...row }) => {
    const plan = one(one(item as Embedded | Embedded[] | null)?.plan);
    return { ...row, plan_id: plan?.id ?? null, plan_title: plan?.title ?? null } as Attendance;
  });
}

export async function getOpenItems(clientId: string) {
  const supabase = await createClient();
  const { data: plans, error: plansError } = await supabase
    .from("treatment_plans")
    .select("id, title")
    .eq("client_id", clientId);
  if (plansError) throw new Error(plansError.message);
  if (!plans?.length) return [] as OpenItem[];

  const titles = new Map(plans.map((p) => [p.id, p.title as string]));
  const { data, error } = await supabase
    .from("treatment_items")
    .select("id, plan_id, description, teeth")
    .in("plan_id", [...titles.keys()])
    .neq("status", "done")
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []).map((i) => ({
    id: i.id as string,
    description: i.description as string,
    teeth: i.teeth as string | null,
    plan_title: titles.get(i.plan_id as string) ?? "",
  }));
}

export async function saveAttendance(input: {
  id?: string;
  client_id: string;
  item_id: string | null;
  attended_at: string;
  teeth: string;
  procedure: string;
  notes: string;
  markItemDone: boolean;
}): Promise<Result> {
  const procedure = input.procedure.trim();
  if (!procedure) return { error: "El procedimiento es obligatorio." };
  if (!input.attended_at) return { error: "La fecha es obligatoria." };

  const supabase = await createClient();
  const values = {
    item_id: input.item_id,
    attended_at: input.attended_at,
    teeth: input.teeth.trim() || null,
    procedure,
    notes: input.notes.trim() || null,
  };
  const { error } = input.id
    ? await supabase.from("attendances").update(values).eq("id", input.id)
    : await supabase.from("attendances").insert({ ...values, client_id: input.client_id });
  if (error) return { error: error.message };

  if (input.item_id && input.markItemDone) {
    const { error: itemError } = await supabase
      .from("treatment_items")
      .update({ status: "done" })
      .eq("id", input.item_id);
    if (itemError) return { error: `Atención guardada, pero no se pudo marcar el tratamiento: ${itemError.message}` };
  }
  return {};
}

export async function deleteAttendance(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("attendances").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Registers one attendance per treatment (same date and notes) and optionally marks them done. */
export async function saveAttendanceBatch(input: {
  client_id: string;
  attended_at: string;
  notes: string;
  items: { item_id: string; procedure: string; teeth: string | null }[];
  markItemsDone: boolean;
}): Promise<Result> {
  if (!input.items.length) return { error: "Selecciona al menos un tratamiento." };
  if (!input.attended_at) return { error: "La fecha es obligatoria." };

  const supabase = await createClient();
  const { error } = await supabase.from("attendances").insert(
    input.items.map((i) => ({
      client_id: input.client_id,
      item_id: i.item_id,
      attended_at: input.attended_at,
      teeth: i.teeth?.trim() || null,
      procedure: i.procedure.trim(),
      notes: input.notes.trim() || null,
    })),
  );
  if (error) return { error: error.message };

  if (input.markItemsDone) {
    const { error: itemsError } = await supabase
      .from("treatment_items")
      .update({ status: "done" })
      .in("id", input.items.map((i) => i.item_id));
    if (itemsError) return { error: `Atenciones guardadas, pero no se pudieron marcar los tratamientos: ${itemsError.message}` };
  }
  return {};
}
