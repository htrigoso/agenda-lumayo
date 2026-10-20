// Membership (Lumayo Card) rules. Mirrors landing/src/lib/site.ts (`plans`); keep both in sync when fees change.
export type PlanKey = "classic" | "gold";
export type MemberRole = "holder" | "additional";

export const PLANS: Record<PlanKey, { label: string; annualFee: number; reaffiliationFee: number; maxAdditional: number }> = {
  classic: { label: "Clásica", annualFee: 125, reaffiliationFee: 100, maxAdditional: 3 },
  gold: { label: "Dorada", annualFee: 150, reaffiliationFee: 50, maxAdditional: 6 },
};

export const RELATIONSHIPS = ["Cónyuge", "Hijo/a", "Padre/Madre", "Hermano/a", "Otro"];
export const PAYMENT_METHODS = ["Efectivo", "Yape", "Plin", "Transferencia", "Tarjeta", "Otro"];

export type MembershipStatus = "active" | "expiring" | "expired" | "cancelled";

export const STATUS_LABEL: Record<MembershipStatus, string> = {
  active: "Vigente",
  expiring: "Por vencer",
  expired: "Vencida",
  cancelled: "Anulada",
};

// Text/foreground color per status, on the brand palette (aqua for healthy, warm tones for attention).
export const STATUS_COLOR: Record<MembershipStatus, string> = {
  active: "#268b94",
  expiring: "#c26a12",
  expired: "#c2453d",
  cancelled: "#7a8a99",
};

// Soft background used by chips and progress tracks.
export const STATUS_SOFT: Record<MembershipStatus, string> = {
  active: "#d7f6f5",
  expiring: "#fdebd3",
  expired: "#fbe1df",
  cancelled: "#eef2f6",
};

/** How many days before expiry a membership counts as "por vencer". */
export const EXPIRING_DAYS = 30;

const DAY = 86_400_000;
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const midnight = (s: string) => new Date(`${s}T00:00`).getTime();

/** Whole days from today until `endsOn` (negative once it has expired). */
export function daysLeft(endsOn: string, today = new Date()) {
  return Math.floor((midnight(endsOn) - midnight(ymd(today))) / DAY);
}

/** Status from the card's current validity (latest `ends_on`) and cancellation. */
export function statusOf(endsOn: string | null, cancelled: boolean, today = new Date()): MembershipStatus {
  if (cancelled) return "cancelled";
  if (!endsOn) return "expired";
  const days = daysLeft(endsOn, today);
  if (days < 0) return "expired";
  if (days <= EXPIRING_DAYS) return "expiring";
  return "active";
}

/** Share of the period already used, from 0 to 1. */
export function periodProgress(startsOn: string, endsOn: string, today = new Date()) {
  const total = midnight(endsOn) - midnight(startsOn) + DAY;
  const used = midnight(ymd(today)) - midnight(startsOn);
  return Math.min(1, Math.max(0, used / total));
}

/** Short human sentence about the validity, e.g. "Vence en 42 días". */
export function validityText(endsOn: string | null, cancelled: boolean, today = new Date()) {
  if (cancelled) return "Membresía anulada";
  if (!endsOn) return "Sin vigencia registrada";
  const d = daysLeft(endsOn, today);
  if (d > 1) return `Vence en ${d} días`;
  if (d === 1) return "Vence mañana";
  if (d === 0) return "Vence hoy";
  return d === -1 ? "Venció ayer" : `Venció hace ${-d} días`;
}

/** Renewals continue right after the current period; an expired card restarts today. */
export function suggestedRenewalStart(endsOn: string | null, today = new Date()) {
  if (!endsOn || daysLeft(endsOn, today) < 0) return ymd(today);
  const d = new Date(`${endsOn}T00:00`);
  d.setDate(d.getDate() + 1);
  return ymd(d);
}

/** One year from `start`, ending the day before the anniversary (inclusive, 12 months). */
export function validityEnd(start: string) {
  const d = new Date(`${start}T00:00`);
  d.setFullYear(d.getFullYear() + 1);
  d.setDate(d.getDate() - 1);
  return ymd(d);
}

export const formatSoles = (n: number) => new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(n);
export const formatDate = (s: string) => new Date(`${s}T00:00`).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
export const todayYmd = () => ymd(new Date());

/** Identity data of an additional member registered without a patient file. */
export type PersonInput = { first_name: string; last_name: string; dni: string; birth_date: string; mobile: string; email: string };

export const EMPTY_PERSON: PersonInput = { first_name: "", last_name: "", dni: "", birth_date: "", mobile: "", email: "" };

// DNI (8 digits) or CE / passport (up to 12 alphanumeric characters). Mirrors membership_members_dni_format.
export const DNI_PATTERN = /^[A-Za-z0-9]{8,12}$/;

/** Returns an error message, or null when the person data is complete and valid. */
export function personError(p: PersonInput): string | null {
  if (!p.first_name.trim() || !p.last_name.trim()) return "Nombres y apellidos son obligatorios.";
  if (!DNI_PATTERN.test(p.dni.trim())) return "El DNI debe tener 8 dígitos (o hasta 12 caracteres si es CE o pasaporte).";
  if (p.birth_date && p.birth_date > todayYmd()) return "La fecha de nacimiento no puede ser futura.";
  if (p.email.trim() && !/^\S+@\S+\.\S+$/.test(p.email.trim())) return "El correo no es válido.";
  return null;
}

type NamedMember = {
  client: { first_name: string; last_name: string; dni: string | null } | null;
  first_name: string | null;
  last_name: string | null;
  dni: string | null;
};

/** Display name of a member, whether linked to a patient or registered with its own data. */
export const memberName = (m: NamedMember) =>
  m.client ? `${m.client.first_name} ${m.client.last_name}` : m.first_name ? `${m.first_name} ${m.last_name ?? ""}`.trim() : "Paciente eliminado";

export const memberDni = (m: NamedMember) => m.client?.dni ?? m.dni ?? null;
