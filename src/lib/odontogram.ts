/**
 * Odontogram model (v2). Teeth use FDI numbering (ISO 3950): first digit = quadrant
 * (1-4 permanent, 5-8 temporary), second digit = position from the midline.
 * Findings come from the NTS 188-MINSA/DGIESP-2022 catalog (see odontogram-catalog.ts).
 */
import { findingByCode, type Finding } from "@/lib/odontogram-catalog";

export type Surface = "O" | "V" | "L" | "M" | "D";
export type Zone = "top" | "bottom" | "left" | "right" | "center";

export type Mark = { f: string; s: string };
export type ToothData = { S?: Partial<Record<Surface, Mark>>; W?: Mark[] };
export type RangeMark = Mark & { from: string; to: string };
export type OdontogramData = { v: 2; teeth: Record<string, ToothData>; ranges: RangeMark[] };

export const EMPTY_ODONTOGRAM: OdontogramData = { v: 2, teeth: {}, ranges: [] };

export const SURFACE_LABEL: Record<Surface, string> = {
  O: "Oclusal / incisal",
  V: "Vestibular",
  L: "Lingual / palatina",
  M: "Mesial",
  D: "Distal",
};

const range = (from: number, to: number) => {
  const step = from <= to ? 1 : -1;
  const out: number[] = [];
  for (let n = from; n !== to + step; n += step) out.push(n);
  return out;
};
const pad = (n: number): (number | null)[] => Array(n).fill(null);

export type Arch = "upper" | "lower";
export type ToothRow = { id: string; label: string; arch: Arch; teeth: (number | null)[]; temporary: boolean };

// `null` slots keep temporary teeth aligned under their permanent neighbours.
export const ROWS: ToothRow[] = [
  { id: "upper", label: "Superior permanente", arch: "upper", teeth: [...range(18, 11), ...range(21, 28)], temporary: false },
  { id: "upper-temp", label: "Superior temporal", arch: "upper", teeth: [...pad(3), ...range(55, 51), ...range(61, 65), ...pad(3)], temporary: true },
  { id: "lower-temp", label: "Inferior temporal", arch: "lower", teeth: [...pad(3), ...range(85, 81), ...range(71, 75), ...pad(3)], temporary: true },
  { id: "lower", label: "Inferior permanente", arch: "lower", teeth: [...range(48, 41), ...range(31, 38)], temporary: false },
];

export const quadrantOf = (tooth: number) => Math.floor(tooth / 10);
export const isTemporary = (tooth: number) => quadrantOf(tooth) >= 5;
/** FDI validity: quadrants 1-4 have teeth 1-8, temporary quadrants 5-8 have teeth 1-5. */
export function isValidTooth(tooth: number) {
  const q = quadrantOf(tooth);
  const pos = tooth % 10;
  return q >= 1 && q <= 8 && pos >= 1 && pos <= (q >= 5 ? 5 : 8);
}
export const isUpper = (tooth: number) => [1, 2, 5, 6].includes(quadrantOf(tooth));

/** Maps a clicked zone of a tooth drawing to the anatomical surface it represents. */
export function surfaceAt(tooth: number, zone: Zone): Surface {
  if (zone === "center") return "O";
  const upper = isUpper(tooth);
  if (zone === "top") return upper ? "V" : "L";
  if (zone === "bottom") return upper ? "L" : "V";
  // Mesial faces the midline: right side for quadrants 1/4/5/8, left side for 2/3/6/7.
  const q = quadrantOf(tooth);
  const mesialOnRight = q === 1 || q === 4 || q === 5 || q === 8;
  if (zone === "right") return mesialOnRight ? "M" : "D";
  return mesialOnRight ? "D" : "M";
}

export type Tool =
  | { kind: "mark"; finding: string; state: string }
  | { kind: "erase-surface" }
  | { kind: "erase-tooth" }
  | { kind: "clear" };

const withTooth = (data: OdontogramData, key: string, next: ToothData): OdontogramData => {
  const teeth = { ...data.teeth };
  const hasSurface = next.S && Object.keys(next.S).length > 0;
  if (!hasSurface && !(next.W && next.W.length > 0)) delete teeth[key];
  else teeth[key] = { ...(hasSurface ? { S: next.S } : {}), ...(next.W?.length ? { W: next.W } : {}) };
  return { ...data, teeth };
};

const sameMark = (a: Mark | undefined, f: string, s: string) => !!a && a.f === f && a.s === s;

/** Applies a surface or whole-tooth finding. Applying the exact same mark twice removes it. */
export function applyMark(data: OdontogramData, finding: Finding, state: string, tooth: number, zone: Zone): OdontogramData {
  if (finding.level === "range") return data;
  if (finding.temporalOnly && !isTemporary(tooth)) return data;
  const key = String(tooth);
  const current = data.teeth[key] ?? {};

  if (finding.level === "surface") {
    const surface = surfaceAt(tooth, zone);
    const S = { ...current.S };
    if (sameMark(S[surface], finding.code, state)) delete S[surface];
    else S[surface] = { f: finding.code, s: state };
    return withTooth(data, key, { ...current, S });
  }

  const others = (current.W ?? []).filter((m) => m.f !== finding.code);
  const had = (current.W ?? []).find((m) => m.f === finding.code);
  const W = sameMark(had, finding.code, state) ? others : [...others, { f: finding.code, s: state }];
  return withTooth(data, key, { ...current, W });
}

export function eraseSurface(data: OdontogramData, tooth: number, zone: Zone): OdontogramData {
  const key = String(tooth);
  const current = data.teeth[key];
  const surface = surfaceAt(tooth, zone);
  if (!current?.S?.[surface]) return data;
  const S = { ...current.S };
  delete S[surface];
  return withTooth(data, key, { ...current, S });
}

export function eraseTooth(data: OdontogramData, tooth: number): OdontogramData {
  const key = String(tooth);
  const current = data.teeth[key];
  if (current?.W?.length) return withTooth(data, key, { ...current, W: [] });
  // Nothing whole left on the tooth: drop ranges that touch it.
  return { ...data, ranges: data.ranges.filter((r) => !touches(r, tooth)) };
}

export function clearTooth(data: OdontogramData, tooth: number): OdontogramData {
  const teeth = { ...data.teeth };
  delete teeth[String(tooth)];
  return { ...data, teeth, ranges: data.ranges.filter((r) => !touches(r, tooth)) };
}

const touches = (r: RangeMark, tooth: number) => r.from === String(tooth) || r.to === String(tooth);

/** Adds a range finding between two teeth of the same row (toggles if it already exists). */
export function applyRange(data: OdontogramData, finding: Finding, state: string, from: number, to: number): OdontogramData {
  const [a, b] = [String(from), String(to)];
  const existing = data.ranges.find((r) => r.f === finding.code && r.from === a && r.to === b);
  const rest = data.ranges.filter((r) => r !== existing);
  if (existing && existing.s === state) return { ...data, ranges: rest };
  return { ...data, ranges: [...rest, { f: finding.code, s: state, from: a, to: b }] };
}

// ---------- persistence helpers ----------

/** Old (v1) condition ids → catalog marks. Unofficial ones ("extraction") have no equivalent and are dropped. */
const LEGACY_SURFACE: Record<string, Mark | undefined> = {
  caries: { f: "CARIES", s: "CD" },
  filling: { f: "RESTAURACION", s: "R_BUENO" },
  sealant: { f: "SELLANTE", s: "BUENO" },
  fracture: { f: "FRACTURA", s: "PRESENTE" },
};
const LEGACY_WHOLE: Record<string, Mark | undefined> = {
  missing: { f: "AUSENTE", s: "DAO" },
  crown: { f: "CORONA", s: "CM_BUENO" },
  crown_defective: { f: "CORONA", s: "CM_MALO" },
  endodontic: { f: "TRATAMIENTO_CONDUCTO", s: "TC_BUENO" },
  implant: { f: "IMPLANTE", s: "BUENO" },
  remaining_root: { f: "REMANENTE_RADICULAR", s: "PRESENTE" },
};

const isMark = (m: unknown): m is Mark =>
  !!m && typeof m === "object" && typeof (m as Mark).f === "string" && typeof (m as Mark).s === "string" && !!findingByCode((m as Mark).f);

/** Accepts any stored shape (v2, legacy v1 or garbage) and returns a valid v2 odontogram. */
export function normalizeOdontogram(value: unknown): OdontogramData {
  const v = (value ?? {}) as Record<string, unknown>;
  const rawTeeth = v.teeth && typeof v.teeth === "object" ? (v.teeth as Record<string, Record<string, unknown>>) : {};
  const teeth: Record<string, ToothData> = {};

  for (const [key, tooth] of Object.entries(rawTeeth)) {
    if (!/^\d{2}$/.test(key) || !isValidTooth(Number(key)) || !tooth || typeof tooth !== "object") continue;
    const S: Partial<Record<Surface, Mark>> = {};
    for (const [surface, mark] of Object.entries((tooth.S ?? {}) as Record<string, unknown>)) {
      if (!["O", "V", "L", "M", "D"].includes(surface)) continue;
      const m = typeof mark === "string" ? LEGACY_SURFACE[mark] : isMark(mark) ? mark : undefined;
      if (m) S[surface as Surface] = m;
    }
    const W: Mark[] = [];
    const rawW = tooth.W;
    if (typeof rawW === "string") {
      const m = LEGACY_WHOLE[rawW];
      if (m) W.push(m);
    } else if (Array.isArray(rawW)) {
      for (const m of rawW) if (isMark(m)) W.push(m);
    }
    if (Object.keys(S).length || W.length) teeth[key] = { ...(Object.keys(S).length ? { S } : {}), ...(W.length ? { W } : {}) };
  }

  const ranges: RangeMark[] = [];
  if (Array.isArray(v.ranges)) {
    for (const r of v.ranges as RangeMark[]) if (isMark(r) && isValidTooth(Number(r.from)) && isValidTooth(Number(r.to))) ranges.push(r);
  }
  // Legacy bridges become "prótesis parcial fija" in good state.
  if (Array.isArray(v.bridges)) {
    for (const b of v.bridges as { from?: string; to?: string }[]) {
      if (b?.from && b?.to && isValidTooth(Number(b.from)) && isValidTooth(Number(b.to))) {
        ranges.push({ f: "PROTESIS_FIJA", s: "BUENO", from: b.from, to: b.to });
      }
    }
  }
  return { v: 2, teeth, ranges };
}

export const isEmptyOdontogram = (d: OdontogramData) => Object.keys(d.teeth).length === 0 && d.ranges.length === 0;
