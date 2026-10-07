"use server";

import { createClient } from "@/lib/supabase/server";
import { sanitizeTerm } from "@/lib/clients-query";
import type { Appointment, AppointmentInput } from "@/lib/appointments";

const SELECT =
  "id, client_id, starts_at, duration_minutes, reason, notes, status, client:clients(first_name, last_name, mobile, whatsapp)";

export async function listAppointments(fromISO: string, toISO: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(SELECT)
    .gte("starts_at", fromISO)
    .lt("starts_at", toISO)
    .order("starts_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Appointment[];
}

export async function saveAppointment(input: AppointmentInput): Promise<{ error?: string }> {
  if (!input.client_id) return { error: "Selecciona un paciente." };
  if (Number.isNaN(Date.parse(input.starts_at))) return { error: "La fecha y hora no son válidas." };

  const supabase = await createClient();
  const values = {
    client_id: input.client_id,
    starts_at: input.starts_at,
    duration_minutes: input.duration_minutes,
    reason: input.reason?.trim() || null,
    notes: input.notes?.trim() || null,
    status: input.status,
  };
  const { error } = input.id
    ? await supabase
        .from("appointments")
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq("id", input.id)
    : await supabase.from("appointments").insert(values);
  return error ? { error: error.message } : {};
}

export async function moveAppointment(id: string, startsAtISO: string, durationMinutes?: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({
      starts_at: startsAtISO,
      ...(durationMinutes ? { duration_minutes: durationMinutes } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteAppointment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function searchClients(term: string) {
  const supabase = await createClient();
  const t = sanitizeTerm(term);
  let query = supabase.from("clients").select("id, first_name, last_name, mobile").order("first_name").limit(20);
  if (t) {
    query = query.or(`first_name.ilike.%${t}%,last_name.ilike.%${t}%,mobile.ilike.%${t}%`);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as { id: string; first_name: string; last_name: string; mobile: string | null }[];
}
