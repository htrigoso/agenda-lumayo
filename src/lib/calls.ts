/** MUI Chip colors used for call outcomes. */
export type OutcomeColor = "success" | "warning" | "info" | "error" | "default";

/** Sections the outcomes are shown under in the "Registrar llamada" dialog. */
export const CALL_OUTCOME_GROUPS = [
  { key: "appointments", label: "Citas" },
  { key: "interest", label: "Interés y consultas" },
  { key: "treatment", label: "Tratamiento y pagos" },
  { key: "not_reached", label: "No se pudo hablar" },
  { key: "not_interested", label: "No interesado / baja" },
  { key: "other", label: "Otros" },
] as const;

export type OutcomeGroup = (typeof CALL_OUTCOME_GROUPS)[number]["key"];

export type CallOutcome = {
  key: string;
  label: string;
  color: OutcomeColor;
  group: OutcomeGroup;
  /** The outcome needs a follow-up date (DB constraint for call_back). */
  needsDate?: boolean;
  /** The outcome needs non-blank notes (DB constraint for other). */
  needsNotes?: boolean;
};

/** Ordered as staff pick them in the dialog; keys match the call_logs.outcome check constraint. */
export const CALL_OUTCOMES: readonly CallOutcome[] = [
  // Citas
  { key: "appointment", label: "Agendó cita", color: "success", group: "appointments" },
  { key: "confirmed", label: "Confirmó su cita", color: "success", group: "appointments" },
  { key: "rescheduled", label: "Reprogramó su cita", color: "info", group: "appointments" },
  { key: "cancelled", label: "Canceló su cita", color: "error", group: "appointments" },
  { key: "no_show", label: "No asistió a su cita", color: "warning", group: "appointments" },
  { key: "call_back", label: "Volver a llamar", color: "warning", group: "appointments", needsDate: true },
  { key: "prefers_whatsapp", label: "Prefiere coordinar por WhatsApp", color: "info", group: "appointments" },
  // Interés y consultas
  { key: "send_info", label: "Enviar info por WhatsApp", color: "info", group: "interest" },
  { key: "asked_prices", label: "Consultó precios / presupuesto", color: "info", group: "interest" },
  { key: "wants_evaluation", label: "Quiere evaluación / diagnóstico", color: "success", group: "interest" },
  { key: "wants_treatment", label: "Interesado en tratamiento", color: "success", group: "interest" },
  { key: "asked_promotions", label: "Consultó promociones", color: "info", group: "interest" },
  { key: "asked_membership", label: "Interesado en membresía", color: "success", group: "interest" },
  { key: "asked_insurance", label: "Consultó seguro / convenio", color: "info", group: "interest" },
  { key: "asked_financing", label: "Consultó financiamiento / cuotas", color: "info", group: "interest" },
  { key: "will_think", label: "Lo pensará", color: "warning", group: "interest" },
  { key: "will_consult_family", label: "Consultará con su familia", color: "warning", group: "interest" },
  // Tratamiento y pagos
  { key: "dental_pain", label: "Urgencia / dolor dental", color: "error", group: "treatment" },
  { key: "treatment_follow_up", label: "Control de tratamiento", color: "info", group: "treatment" },
  { key: "post_treatment", label: "Seguimiento post tratamiento", color: "info", group: "treatment" },
  { key: "orthodontic_control", label: "Control de ortodoncia", color: "info", group: "treatment" },
  { key: "cleaning_reminder", label: "Recordatorio de limpieza", color: "info", group: "treatment" },
  { key: "pending_payment", label: "Pago pendiente", color: "warning", group: "treatment" },
  { key: "payment_done", label: "Realizó su pago", color: "success", group: "treatment" },
  { key: "satisfied", label: "Satisfecho con la atención", color: "success", group: "treatment" },
  { key: "complaint", label: "Queja / reclamo", color: "error", group: "treatment" },
  // No se pudo hablar
  { key: "no_answer", label: "No contesta", color: "default", group: "not_reached" },
  { key: "busy", label: "Ocupado / cortó la llamada", color: "default", group: "not_reached" },
  { key: "voicemail", label: "Buzón de voz", color: "default", group: "not_reached" },
  { key: "unreachable", label: "Apagado / fuera de servicio", color: "default", group: "not_reached" },
  { key: "third_party", label: "Contestó un familiar / tercero", color: "default", group: "not_reached" },
  { key: "wrong_number", label: "Número equivocado", color: "error", group: "not_reached" },
  // No interesado / baja
  { key: "not_interested", label: "No interesado", color: "error", group: "not_interested" },
  { key: "no_budget", label: "Sin presupuesto por ahora", color: "warning", group: "not_interested" },
  { key: "other_clinic", label: "Se atiende en otra clínica", color: "error", group: "not_interested" },
  { key: "moved_away", label: "Se mudó / no vive en la zona", color: "default", group: "not_interested" },
  { key: "do_not_call", label: "No desea ser contactado", color: "error", group: "not_interested" },
  { key: "deceased", label: "Paciente fallecido", color: "default", group: "not_interested" },
  // Otros
  { key: "other", label: "Otro", color: "default", group: "other", needsNotes: true },
];

/** Outcomes split into their dialog sections, in display order. */
export function outcomesByGroup() {
  return CALL_OUTCOME_GROUPS.map((g) => ({ ...g, outcomes: CALL_OUTCOMES.filter((o) => o.group === g.key) }));
}

/** Denormalized "last call" columns kept on clients by the call_logs trigger. */
export type CallSummary = {
  last_call_at: string | null;
  last_call_outcome: string | null;
  last_call_by: string | null;
  next_call_on: string | null;
};

/** `outcome` is optional ("" = none), but a call needs an outcome or a note. */
export type CallInput = { outcome: string; notes: string; followUpOn: string };

const TIME_ZONE = "America/Lima";

export function outcomeOption(key: string | null | undefined) {
  return key ? CALL_OUTCOMES.find((o) => o.key === key) : undefined;
}

/** Label of an outcome; a call logged with only a note reads "Nota". */
export function outcomeLabel(key: string | null | undefined) {
  if (!key) return "Nota";
  return outcomeOption(key)?.label ?? key;
}

/** Calendar day (YYYY-MM-DD) of `date` in Lima. */
export function limaToday(date: Date = new Date()) {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(date);
}

function isValidDay(day: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const d = new Date(`${day}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === day;
}

/** Adds `n` days to a YYYY-MM-DD day. */
export function addDays(day: string, n: number) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Error message for an invalid call, or null. `today` is the Lima calendar day (YYYY-MM-DD). */
export function validateCall({ outcome, notes, followUpOn }: CallInput, today: string = limaToday()) {
  const option = outcomeOption(outcome);
  if (outcome && !option) return "El resultado elegido no es válido.";
  if (!option && !notes.trim()) return "Elige un resultado o escribe una nota.";
  if (option?.needsNotes && !notes.trim()) return "Escribe una nota que describa la llamada.";
  const date = followUpOn.trim();
  if (option?.needsDate && !date) return "Elige la fecha para volver a llamar.";
  if (date) {
    if (!isValidDay(date)) return "La fecha no es válida.";
    if (date < today) return "La fecha no puede estar en el pasado.";
  }
  return null;
}

/** "hoy", "ayer" or "hace N días" for a timestamp, using Lima calendar days. */
export function relativeDay(iso: string, today: string) {
  const day = limaToday(new Date(iso));
  const diff = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${day}T00:00:00Z`)) / 86_400_000);
  if (diff <= 0) return "hoy";
  if (diff === 1) return "ayer";
  return `hace ${diff} días`;
}

/** A follow-up is due when its date is today or earlier. */
export function isCallDue(nextCallOn: string | null | undefined, today: string) {
  return Boolean(nextCallOn) && (nextCallOn as string) <= today;
}

/** Exact local datetime for tooltips and history, e.g. "14/11/2026, 10:32". */
export function formatCallDateTime(iso: string) {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: TIME_ZONE,
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

/** A YYYY-MM-DD day as "14/11/2026". */
export function formatDay(day: string) {
  const [y, m, d] = day.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Groups calls by calendar month in Lima ("Noviembre 2026"), newest month first and newest call
 * first inside each month.
 */
export function groupCallsByMonth<T extends { created_at: string }>(calls: T[]) {
  const monthName = new Intl.DateTimeFormat("es-PE", { timeZone: TIME_ZONE, month: "long", year: "numeric" });
  const sorted = [...calls].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  const groups: { key: string; label: string; calls: T[] }[] = [];
  for (const call of sorted) {
    const key = limaToday(new Date(call.created_at)).slice(0, 7);
    let group = groups.at(-1);
    if (group?.key !== key) {
      const label = monthName.format(new Date(call.created_at)).replace(" de ", " ");
      group = { key, label: label.charAt(0).toUpperCase() + label.slice(1), calls: [] };
      groups.push(group);
    }
    group.calls.push(call);
  }
  return groups;
}
