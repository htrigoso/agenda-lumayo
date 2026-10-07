"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  AppointmentRow,
  BalanceRow,
  DateRange,
  IncomeRow,
  NewPatientRow,
  TreatmentRow,
} from "@/lib/reports";
import { isoBounds } from "@/lib/reports";

const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));
const fullName = (c: { first_name: string; last_name: string } | null) => (c ? `${c.first_name} ${c.last_name}` : "Paciente eliminado");

/** PostgREST caps a response at 1000 rows, so page through until a short page comes back. */
async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
) {
  const size = 1000;
  const out: T[] = [];
  for (let from = 0; ; from += size) {
    const { data, error } = await page(from, from + size - 1);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
    if ((data?.length ?? 0) < size) break;
  }
  return out;
}

type Patient = { id?: string; first_name: string; last_name: string; record_number?: number };

export async function reportIncome(range: DateRange): Promise<IncomeRow[]> {
  const supabase = await createClient();
  const rows = await fetchAll<{
    amount: number;
    paid_at: string;
    method: string | null;
    plan: { title: string; client: Patient | Patient[] | null } | { title: string; client: Patient | Patient[] | null }[] | null;
  }>((from, to) =>
    supabase
      .from("payments")
      .select("amount, paid_at, method, plan:treatment_plans(title, client:clients(first_name, last_name))")
      .gte("paid_at", range.from)
      .lte("paid_at", range.to)
      .order("paid_at")
      .order("created_at")
      .range(from, to) as never,
  );
  return rows.map((r) => {
    const plan = one(r.plan);
    return {
      date: r.paid_at,
      amount: Number(r.amount),
      method: r.method ?? "Sin método",
      patient: fullName(one(plan?.client)),
      plan: plan?.title ?? "",
    };
  });
}

/** Current snapshot (not date-filtered): every active plan that still has a balance. */
export async function reportBalances(): Promise<BalanceRow[]> {
  const supabase = await createClient();
  const plans = await fetchAll<{
    id: string;
    title: string;
    created_at: string;
    client_id: string;
    client: Patient | Patient[] | null;
    items: { quantity: number; unit_price: number }[];
    payments: { amount: number; paid_at: string }[];
  }>((from, to) =>
    supabase
      .from("treatment_plans")
      .select(
        "id, title, created_at, client_id, client:clients(first_name, last_name, record_number), items:treatment_items(quantity, unit_price), payments(amount, paid_at)",
      )
      .neq("status", "cancelled")
      .order("created_at")
      .range(from, to) as never,
  );
  return plans
    .map((p) => {
      const total = p.items.reduce((s, i) => s + i.quantity * Number(i.unit_price), 0);
      const paid = p.payments.reduce((s, x) => s + Number(x.amount), 0);
      const client = one(p.client);
      const lastPayment = p.payments.map((x) => x.paid_at).sort().pop() ?? null;
      return {
        patient_id: p.client_id,
        patient: fullName(client),
        record: client?.record_number ?? null,
        plan: p.title,
        total,
        paid,
        balance: total - paid,
        since: p.created_at.slice(0, 10),
        last_payment: lastPayment,
      };
    })
    .filter((r) => r.balance > 0.004);
}

export async function reportAppointments(range: DateRange): Promise<AppointmentRow[]> {
  const supabase = await createClient();
  const { fromISO, toISO } = isoBounds(range);
  const rows = await fetchAll<{
    starts_at: string;
    status: string;
    reason: string | null;
    client: Patient | Patient[] | null;
  }>((from, to) =>
    supabase
      .from("appointments")
      .select("starts_at, status, reason, client:clients(first_name, last_name)")
      .gte("starts_at", fromISO)
      .lt("starts_at", toISO)
      .order("starts_at")
      .range(from, to) as never,
  );
  return rows.map((r) => ({ starts_at: r.starts_at, status: r.status, reason: r.reason, patient: fullName(one(r.client)) }));
}

export async function reportTreatments(range: DateRange): Promise<TreatmentRow[]> {
  const supabase = await createClient();
  type Item = {
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    service: { name: string } | { name: string }[] | null;
  };
  const rows = await fetchAll<{
    attended_at: string;
    procedure: string;
    item_id: string | null;
    item: Item | Item[] | null;
  }>((from, to) =>
    supabase
      .from("attendances")
      .select("attended_at, procedure, item_id, item:treatment_items(id, description, quantity, unit_price, service:services(name))")
      .gte("attended_at", range.from)
      .lte("attended_at", range.to)
      .order("attended_at")
      .range(from, to) as never,
  );
  return rows.map((r) => {
    const item = one(r.item);
    return {
      attended_at: r.attended_at,
      name: one(item?.service)?.name ?? item?.description ?? r.procedure,
      item_id: r.item_id,
      value: item ? item.quantity * Number(item.unit_price) : 0,
    };
  });
}

export async function reportNewPatients(range: DateRange): Promise<NewPatientRow[]> {
  const supabase = await createClient();
  const { fromISO, toISO } = isoBounds(range);
  const rows = await fetchAll<{
    id: string;
    created_at: string;
    first_name: string;
    last_name: string;
    record_number: number;
  }>((from, to) =>
    supabase
      .from("clients")
      .select("id, created_at, first_name, last_name, record_number")
      .gte("created_at", fromISO)
      .lt("created_at", toISO)
      .order("created_at")
      .range(from, to) as never,
  );
  return rows.map((r) => ({ id: r.id, created_at: r.created_at, patient: fullName(r), record: r.record_number }));
}
