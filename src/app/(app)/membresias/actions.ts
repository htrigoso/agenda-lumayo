"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PLANS, type PlanKey, type MemberRole, type PersonInput, personError, validityEnd, DNI_PATTERN } from "@/lib/membership";

export type MemberRow = {
  id: string;
  client_id: string | null;
  role: MemberRole;
  relationship: string;
  member_code: string | null;
  first_name: string | null;
  last_name: string | null;
  dni: string | null;
  birth_date: string | null;
  mobile: string | null;
  email: string | null;
  client: { first_name: string; last_name: string; dni: string | null; mobile: string | null; record_number: number | null } | null;
};

export type PeriodRow = { id: string; kind: "affiliation" | "reaffiliation"; starts_on: string; ends_on: string; fee: number; paid_at: string; method: string | null };

export type MembershipRow = {
  id: string;
  code: string;
  plan: PlanKey;
  notes: string | null;
  cancelled_at: string | null;
  created_at: string;
  members: MemberRow[];
  periods: PeriodRow[];
};

export type PatientOption = {
  id: string;
  first_name: string;
  last_name: string;
  dni: string | null;
  mobile: string | null;
  record_number: number | null;
  /** Code of the active membership this patient already belongs to, if any. */
  membership_code: string | null;
};

/** An additional member: an existing patient, or a person registered with their own data. */
export type AdditionalInput = { relationship: string } & ({ client_id: string } | { person: PersonInput });

const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));

const SELECT =
  "id, code, plan, notes, cancelled_at, created_at, members:membership_members(id, client_id, role, relationship, member_code, first_name, last_name, dni, birth_date, mobile, email, client:clients(first_name, last_name, dni, mobile, record_number)), periods:membership_periods(id, kind, starts_on, ends_on, fee, paid_at, method)";

const PATIENT_COLUMNS = "id, first_name, last_name, dni, mobile, record_number";

function normalize(row: Record<string, unknown>): MembershipRow {
  const members = (row.members as (Omit<MemberRow, "client"> & { client: MemberRow["client"] | MemberRow["client"][] })[]).map((m) => ({
    ...m,
    client: one(m.client),
  }));
  const periods = (row.periods as PeriodRow[]).slice().sort((a, b) => b.ends_on.localeCompare(a.ends_on));
  return { ...(row as unknown as MembershipRow), members, periods };
}

/** Turns raw constraint errors into messages the front desk understands. */
function friendly(message: string) {
  if (message.includes("membership_members_dni_format")) return "El DNI debe tener 8 dígitos (o hasta 12 caracteres si es CE o pasaporte).";
  if (message.includes("membership_members_identity")) return "Completa nombres, apellidos y DNI del adicional.";
  if (message.includes("membership_members_membership_id_client_id_key")) return "Ese paciente ya está en esta membresía.";
  return message;
}

export async function listMemberships(): Promise<MembershipRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("memberships").select(SELECT).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => normalize(r as Record<string, unknown>));
}

export async function getMembership(id: string): Promise<MembershipRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("memberships").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalize(data as Record<string, unknown>) : null;
}

type ActiveMember = { client_id: string | null; dni: string | null; membership: { code: string; cancelled_at: string | null } | { code: string; cancelled_at: string | null }[] | null };

/** Adds the code of the active membership each patient already belongs to (by patient or by DNI). */
async function withMembership(patients: Omit<PatientOption, "membership_code">[]): Promise<PatientOption[]> {
  if (patients.length === 0) return [];
  const supabase = await createClient();
  const ids = patients.map((p) => p.id);
  const dnis = patients.map((p) => p.dni?.trim()).filter((d): d is string => !!d && DNI_PATTERN.test(d));
  const filter = dnis.length ? `client_id.in.(${ids.join(",")}),dni.in.(${dnis.join(",")})` : `client_id.in.(${ids.join(",")})`;
  const { data } = await supabase.from("membership_members").select("client_id, dni, membership:memberships(code, cancelled_at)").or(filter);
  const active = ((data ?? []) as ActiveMember[]).map((m) => ({ ...m, membership: one(m.membership) })).filter((m) => m.membership && !m.membership.cancelled_at);
  return patients.map((p) => {
    const hit = active.find((m) => m.client_id === p.id || (p.dni?.trim() && m.dni === p.dni.trim()));
    return { ...p, membership_code: hit?.membership?.code ?? null };
  });
}

export async function searchPatients(term: string): Promise<PatientOption[]> {
  const supabase = await createClient();
  const t = term.trim().replace(/[,()%]/g, "");
  let query = supabase.from("clients").select(PATIENT_COLUMNS).order("first_name").limit(20);
  if (t) query = query.or(`first_name.ilike.%${t}%,last_name.ilike.%${t}%,dni.ilike.%${t}%,mobile.ilike.%${t}%`);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return withMembership(data ?? []);
}

export async function createPatient(input: { first_name: string; last_name: string; dni: string; mobile: string }) {
  const first = input.first_name.trim();
  const last = input.last_name.trim();
  if (!first || !last) return { error: "Nombres y apellidos son obligatorios." as const };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({ first_name: first, last_name: last, dni: input.dni.trim() || null, mobile: input.mobile.trim() || null, whatsapp: input.mobile.trim() || null })
    .select(PATIENT_COLUMNS)
    .single();
  if (error) return { error: error.message };
  return { patient: { ...data, membership_code: null } as PatientOption };
}

/** Validates a person without a patient file, and points to the patient when the DNI already has a file. */
async function checkPerson(person: PersonInput): Promise<string | null> {
  const invalid = personError(person);
  if (invalid) return invalid;
  const supabase = await createClient();
  const { data } = await supabase.from("clients").select("first_name, last_name").eq("dni", person.dni.trim()).limit(1).maybeSingle();
  if (data) return `Ya existe el paciente ${data.first_name} ${data.last_name} con DNI ${person.dni.trim()}. Agrégalo como paciente.`;
  return null;
}

function toRow(a: AdditionalInput) {
  if ("client_id" in a) return { client_id: a.client_id, relationship: a.relationship };
  const p = a.person;
  return {
    relationship: a.relationship,
    first_name: p.first_name.trim(),
    last_name: p.last_name.trim(),
    dni: p.dni.trim().toUpperCase(),
    birth_date: p.birth_date || null,
    mobile: p.mobile.trim() || null,
    email: p.email.trim() || null,
  };
}

export type CreateInput = {
  plan: PlanKey;
  holder: string;
  additional: AdditionalInput[];
  starts_on: string;
  fee: number;
  method: string;
  notes: string;
};

export async function createMembership(input: CreateInput): Promise<{ id?: string; error?: string }> {
  const plan = PLANS[input.plan];
  if (!plan) return { error: "Tarjeta no válida." };
  if (!input.holder) return { error: "Elige el titular." };
  if (input.additional.length > plan.maxAdditional) return { error: `La ${plan.label} admite máximo ${plan.maxAdditional} adicionales.` };
  const patientIds = [input.holder, ...input.additional.flatMap((a) => ("client_id" in a ? [a.client_id] : []))];
  const dnis = input.additional.flatMap((a) => ("person" in a ? [a.person.dni.trim().toUpperCase()] : []));
  if (new Set(patientIds).size !== patientIds.length || new Set(dnis).size !== dnis.length) {
    return { error: "Una misma persona no puede estar dos veces en la membresía." };
  }
  for (const a of input.additional) {
    if ("person" in a) {
      const problem = await checkPerson(a.person);
      if (problem) return { error: problem };
    }
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_membership", {
    p_plan: input.plan,
    p_holder: input.holder,
    p_additional: input.additional.map(toRow),
    p_starts_on: input.starts_on,
    p_fee: input.fee,
    p_method: input.method,
    p_notes: input.notes,
  });
  if (error) return { error: friendly(error.message) };
  revalidatePath("/membresias");
  return { id: data as string };
}

export async function addAdditional(membershipId: string, input: AdditionalInput) {
  if ("person" in input) {
    const problem = await checkPerson(input.person);
    if (problem) return { error: problem };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("membership_members")
    .insert({ membership_id: membershipId, role: "additional", ...toRow({ ...input, relationship: input.relationship || "Otro" }) });
  if (error) return { error: friendly(error.message) };
  revalidatePath(`/membresias/${membershipId}`);
  return {};
}

export async function removeAdditional(membershipId: string, memberId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("membership_members").delete().eq("id", memberId).eq("role", "additional");
  if (error) return { error: error.message };
  revalidatePath(`/membresias/${membershipId}`);
  return {};
}

export async function renewMembership(membershipId: string, startsOn: string, fee: number, method: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("membership_periods").insert({
    membership_id: membershipId,
    kind: "reaffiliation",
    starts_on: startsOn,
    ends_on: validityEnd(startsOn),
    fee,
    method: method || null,
  });
  if (error) return { error: error.message };
  revalidatePath(`/membresias/${membershipId}`);
  revalidatePath("/membresias");
  return {};
}

export async function cancelMembership(membershipId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("memberships").update({ cancelled_at: new Date().toISOString() }).eq("id", membershipId);
  if (error) return { error: error.message };
  revalidatePath(`/membresias/${membershipId}`);
  revalidatePath("/membresias");
  return {};
}
