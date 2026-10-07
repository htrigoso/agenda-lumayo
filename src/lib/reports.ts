// Shared types, date helpers and aggregation helpers for the reports module.

export type DateRange = { from: string; to: string }; // inclusive local dates, "YYYY-MM-DD"

export type IncomeRow = { date: string; amount: number; method: string; patient: string; plan: string };
export type BalanceRow = {
  patient_id: string;
  patient: string;
  record: number | null;
  plan: string;
  total: number;
  paid: number;
  balance: number;
  since: string;
  last_payment: string | null;
};
export type AppointmentRow = { starts_at: string; status: string; patient: string; reason: string | null };
export type TreatmentRow = {
  attended_at: string;
  name: string;
  item_id: string | null;
  value: number;
};
export type NewPatientRow = { id: string; created_at: string; patient: string; record: number };

const pad = (n: number) => String(n).padStart(2, "0");
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s: string) => new Date(`${s}T00:00:00`);

export type Preset = "today" | "7d" | "month" | "last-month" | "year" | "custom";

export const PRESETS: { id: Preset; label: string }[] = [
  { id: "today", label: "Hoy" },
  { id: "7d", label: "Últimos 7 días" },
  { id: "month", label: "Este mes" },
  { id: "last-month", label: "Mes pasado" },
  { id: "year", label: "Este año" },
];

export function presetRange(preset: Preset, now = new Date()): DateRange {
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (preset) {
    case "today":
      return { from: ymd(now), to: ymd(now) };
    case "7d": {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      return { from: ymd(start), to: ymd(now) };
    }
    case "last-month":
      return { from: ymd(new Date(y, m - 1, 1)), to: ymd(new Date(y, m, 0)) };
    case "year":
      return { from: `${y}-01-01`, to: `${y}-12-31` };
    default:
      return { from: ymd(new Date(y, m, 1)), to: ymd(new Date(y, m + 1, 0)) };
  }
}

/** [from 00:00, day after `to` 00:00) in local time, as ISO strings for timestamptz filters. */
export function isoBounds(range: DateRange) {
  const end = parse(range.to);
  end.setDate(end.getDate() + 1);
  return { fromISO: parse(range.from).toISOString(), toISO: end.toISOString() };
}

export const daysBetween = (range: DateRange) =>
  Math.round((parse(range.to).getTime() - parse(range.from).getTime()) / 86_400_000) + 1;

export type Series = { keys: string[]; labels: string[]; values: number[]; unit: "day" | "month" };

/** Sums `value` per day (ranges up to ~2 months) or per month, filling empty buckets with 0. */
export function bucketize(points: { date: string; value: number }[], range: DateRange): Series {
  const unit = daysBetween(range) <= 62 ? "day" : "month";
  const keys: string[] = [];
  const cursor = parse(range.from);
  const end = parse(range.to);
  if (unit === "month") cursor.setDate(1);
  while (cursor <= end) {
    keys.push(unit === "day" ? ymd(cursor) : ymd(cursor).slice(0, 7));
    if (unit === "day") cursor.setDate(cursor.getDate() + 1);
    else cursor.setMonth(cursor.getMonth() + 1);
  }
  const sums = new Map(keys.map((k) => [k, 0]));
  for (const p of points) {
    const key = unit === "day" ? p.date.slice(0, 10) : p.date.slice(0, 7);
    if (sums.has(key)) sums.set(key, (sums.get(key) ?? 0) + p.value);
  }
  const labels = keys.map((k) =>
    unit === "day"
      ? parse(k).toLocaleDateString("es-PE", { day: "numeric", month: "short" })
      : parse(`${k}-01`).toLocaleDateString("es-PE", { month: "short", year: "2-digit" }),
  );
  return { keys, labels, values: keys.map((k) => sums.get(k) ?? 0), unit };
}

export function groupBy<T>(rows: T[], key: (r: T) => string, value: (r: T) => number) {
  const map = new Map<string, { count: number; sum: number }>();
  for (const r of rows) {
    const k = key(r);
    const cur = map.get(k) ?? { count: 0, sum: 0 };
    map.set(k, { count: cur.count + 1, sum: cur.sum + value(r) });
  }
  return [...map.entries()].map(([label, v]) => ({ label, ...v }));
}

const CSV_BOM = "﻿"; // lets Excel open UTF-8 accents correctly

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([CSV_BOM + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Largest "nice" tick step so the axis shows round numbers (0 / 1,000 / 2,000). */
export function niceScale(max: number, ticks = 4) {
  if (max <= 0) return { top: 1, step: 1 / ticks };
  const raw = max / ticks;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
  return { top: step * ticks, step };
}
