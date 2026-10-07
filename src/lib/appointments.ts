import { whatsappUrl } from "@/lib/phone";

export type AppointmentStatus = "scheduled" | "confirmed" | "done" | "cancelled" | "no_show";

export const STATUS: Record<AppointmentStatus, { label: string; color: string }> = {
  scheduled: { label: "Programada", color: "#1565c0" },
  confirmed: { label: "Confirmada", color: "#2e7d32" },
  done: { label: "Atendida", color: "#546e7a" },
  cancelled: { label: "Cancelada", color: "#c62828" },
  no_show: { label: "No asistió", color: "#e65100" },
};

export const DURATIONS = [15, 30, 45, 60, 90, 120];

export type Appointment = {
  id: string;
  client_id: string;
  starts_at: string;
  duration_minutes: number;
  reason: string | null;
  notes: string | null;
  status: AppointmentStatus;
  client: { first_name: string; last_name: string; mobile: string | null; whatsapp: string | null } | null;
};

export type AppointmentInput = {
  id?: string;
  client_id: string;
  starts_at: string;
  duration_minutes: number;
  reason: string | null;
  notes: string | null;
  status: AppointmentStatus;
};

export function clientName(a: Appointment) {
  return a.client ? `${a.client.first_name} ${a.client.last_name}` : "Paciente eliminado";
}

export function endsAt(a: Appointment) {
  return new Date(new Date(a.starts_at).getTime() + a.duration_minutes * 60_000);
}

export function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false });
}

/** "YYYY-MM-DDTHH:mm" in the browser's local time, for <input type="datetime-local">. */
export function toDateTimeLocal(date: Date | string) {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function reminderUrl(a: Appointment) {
  const phone = a.client?.whatsapp ?? a.client?.mobile;
  if (!phone || !a.client) return null;
  const when = new Date(a.starts_at);
  const day = when.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });
  const text = `Hola ${a.client.first_name}, te recordamos tu cita en Lumayo Centro Odontológico el ${day} a las ${formatTime(when)}. ¡Te esperamos!`;
  return whatsappUrl(phone, text);
}
