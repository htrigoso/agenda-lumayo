/**
 * Findings catalog of the odontogram, following NTS N° 188-MINSA/DGIESP-2022 (RM 559-2022/MINSA), §6.1.
 * 38 findings. Colors are fixed by the standard: blue = good state or non-pathological
 * characteristic; red = poor state, temporary or pathological finding.
 *
 * Source: public transcription of §6.1 of the standard (not the official PDF). The graphic
 * symbols drawn for each finding are an interpretation and must be checked against the annex
 * of the official document by the dentist.
 */

export type Level = "surface" | "tooth" | "range";
export type Color = "blue" | "red";

export type FindingState = { code: string; name: string; color: Color; acronym?: string; type?: string };
export type FindingType = { code: string; name: string; acronym: string };

export type Finding = {
  code: string;
  section: string;
  name: string;
  level: Level;
  temporalOnly?: boolean;
  /** Range findings that always span the whole arch (one click). */
  fullArch?: boolean;
  /** Typed findings (crown, restoration...) let the user pick a type + good/poor condition. */
  types?: FindingType[];
  states: FindingState[];
  /** Fixed acronym shown for the finding when its states carry none. */
  acronym?: string;
  /** Glyph used for findings without a dedicated drawing. */
  glyph?: string;
};

export const COLORS: Record<Color, string> = { blue: "#2563eb", red: "#dc2626" };

const condition = (name?: string): FindingState[] => [
  { code: "BUENO", name: name ? `${name} en buen estado` : "Buen estado", color: "blue" },
  { code: "MALO", name: name ? `${name} en mal estado` : "Mal estado", color: "red" },
];
const present = (color: Color): FindingState[] => [{ code: "PRESENTE", name: "Presente", color }];
const typed = (types: FindingType[]): FindingState[] =>
  types.flatMap((t) => [
    { code: `${t.code}_BUENO`, name: `${t.name} en buen estado`, color: "blue" as Color, acronym: t.acronym, type: t.code },
    { code: `${t.code}_MALO`, name: `${t.name} en mal estado`, color: "red" as Color, acronym: t.acronym, type: t.code },
  ]);
const t = (code: string, name: string, acronym = code): FindingType => ({ code, name, acronym });

const CROWN_TYPES = [
  t("CM", "Corona metálica"),
  t("CF", "Corona fenestrada"),
  t("CMC", "Corona metal cerámica"),
  t("CV", "Corona Veneer"),
  t("CLM", "Corona libre de metal"),
];
const RESTORATION_TYPES = [
  t("AM", "Amalgama dental"),
  t("R", "Resina"),
  t("IV", "Ionómero de vidrio"),
  t("IM", "Incrustación metálica"),
  t("IE", "Incrustación estética"),
  t("C", "Carilla"),
];
const ENDO_TYPES = [t("TC", "Tratamiento de conductos"), t("PC", "Pulpectomía")];

export const FINDINGS: Finding[] = [
  { code: "ORTODONCIA_FIJA", section: "6.1.1", name: "Aparato ortodóntico fijo", level: "range", states: condition() },
  { code: "ORTODONCIA_REMOVIBLE", section: "6.1.2", name: "Aparato ortodóntico removible", level: "range", states: condition() },
  { code: "CORONA", section: "6.1.3", name: "Corona", level: "tooth", types: CROWN_TYPES, states: typed(CROWN_TYPES) },
  { code: "CORONA_TEMPORAL", section: "6.1.4", name: "Corona temporal", level: "tooth", acronym: "CT", states: present("red") },
  {
    code: "DDE",
    section: "6.1.5",
    name: "Defectos de desarrollo del esmalte",
    level: "surface",
    states: [
      { code: "O", name: "Opacidades del esmalte", color: "red", acronym: "O" },
      { code: "PE", name: "Pigmentación del esmalte", color: "red", acronym: "PE" },
    ],
  },
  { code: "DIASTEMA", section: "6.1.6", name: "Diastema", level: "range", glyph: ")(", states: present("blue") },
  { code: "EDENTULO_TOTAL", section: "6.1.7", name: "Edéntulo total", level: "range", fullArch: true, states: present("blue") },
  { code: "ESPIGO_MUNON", section: "6.1.8", name: "Espigo-muñón", level: "tooth", states: condition() },
  { code: "FOSAS_FISURAS_PROF", section: "6.1.9", name: "Fosas y fisuras profundas", level: "tooth", acronym: "FFP", states: present("blue") },
  { code: "FRACTURA", section: "6.1.10", name: "Fractura dental", level: "tooth", states: present("red") },
  { code: "FUSION", section: "6.1.11", name: "Fusión", level: "range", glyph: "∪", states: present("blue") },
  { code: "GEMINACION", section: "6.1.12", name: "Geminación", level: "tooth", glyph: "∞", states: present("blue") },
  { code: "GIROVERSION", section: "6.1.13", name: "Giroversión", level: "tooth", glyph: "↻", states: present("blue") },
  { code: "IMPACTACION", section: "6.1.14", name: "Impactación", level: "tooth", acronym: "I", states: present("blue") },
  { code: "IMPLANTE", section: "6.1.15", name: "Implante dental", level: "tooth", acronym: "IMP", states: condition() },
  {
    code: "CARIES",
    section: "6.1.16",
    name: "Lesión de caries dental",
    level: "surface",
    states: [
      { code: "MB", name: "Mancha blanca", color: "red", acronym: "MB" },
      { code: "CE", name: "Caries a nivel del esmalte", color: "red", acronym: "CE" },
      { code: "CD", name: "Caries a nivel de la dentina", color: "red", acronym: "CD" },
      { code: "CDP", name: "Caries en dentina con compromiso pulpar", color: "red", acronym: "CDP" },
    ],
  },
  { code: "MACRODONCIA", section: "6.1.17", name: "Macrodoncia", level: "tooth", acronym: "MAC", states: present("blue") },
  { code: "MICRODONCIA", section: "6.1.18", name: "Microdoncia", level: "tooth", acronym: "MIC", states: present("blue") },
  {
    code: "MOVILIDAD",
    section: "6.1.19",
    name: "Movilidad patológica",
    level: "tooth",
    states: [
      { code: "M1", name: "Movilidad de grado 1", color: "red", acronym: "M1" },
      { code: "M2", name: "Movilidad de grado 2", color: "red", acronym: "M2" },
    ],
  },
  {
    code: "AUSENTE",
    section: "6.1.20",
    name: "Pieza dentaria ausente",
    level: "tooth",
    states: [
      { code: "DNE", name: "Diente no erupcionado", color: "blue", acronym: "DNE" },
      { code: "DEX", name: "Ausente por extracción (caries)", color: "blue", acronym: "DEX" },
      { code: "DAO", name: "Ausente por otras razones", color: "blue", acronym: "DAO" },
    ],
  },
  { code: "CLAVIJA", section: "6.1.21", name: "Pieza dentaria en clavija", level: "tooth", glyph: "▲", states: present("blue") },
  { code: "ECTOPICA", section: "6.1.22", name: "Pieza dentaria ectópica", level: "tooth", acronym: "E", states: present("blue") },
  { code: "EN_ERUPCION", section: "6.1.23", name: "Pieza dentaria en erupción", level: "tooth", glyph: "↗", states: present("blue") },
  { code: "EXTRUIDA", section: "6.1.24", name: "Pieza dentaria extruida", level: "tooth", glyph: "↑", states: present("blue") },
  { code: "INTRUIDA", section: "6.1.25", name: "Pieza dentaria intruida", level: "tooth", glyph: "↓", states: present("blue") },
  { code: "SUPERNUMERARIA", section: "6.1.26", name: "Pieza dentaria supernumeraria", level: "range", acronym: "S", glyph: "S", states: present("blue") },
  { code: "PULPOTOMIA", section: "6.1.27", name: "Pulpotomía", level: "tooth", temporalOnly: true, acronym: "PP", states: condition() },
  {
    code: "POSICION_ANORMAL",
    section: "6.1.28",
    name: "Posición anormal dentaria",
    level: "tooth",
    states: [
      { code: "M", name: "Mesializado", color: "blue", acronym: "M" },
      { code: "D", name: "Distalizado", color: "blue", acronym: "D" },
      { code: "V", name: "Vestibularizado", color: "blue", acronym: "V" },
      { code: "P", name: "Palatinizado", color: "blue", acronym: "P" },
      { code: "L", name: "Lingualizado", color: "blue", acronym: "L" },
    ],
  },
  { code: "PROTESIS_FIJA", section: "6.1.29", name: "Prótesis parcial fija (puente)", level: "range", states: condition() },
  { code: "PROTESIS_COMPLETA", section: "6.1.30", name: "Prótesis completa", level: "range", fullArch: true, states: condition() },
  { code: "PROTESIS_REMOVIBLE", section: "6.1.31", name: "Prótesis parcial removible", level: "range", states: condition() },
  { code: "REMANENTE_RADICULAR", section: "6.1.32", name: "Remanente radicular", level: "tooth", acronym: "RR", states: present("red") },
  { code: "RESTAURACION", section: "6.1.33", name: "Restauración definitiva", level: "surface", types: RESTORATION_TYPES, states: typed(RESTORATION_TYPES) },
  { code: "RESTAURACION_TEMP", section: "6.1.34", name: "Restauración temporal", level: "surface", states: present("red") },
  { code: "SELLANTE", section: "6.1.35", name: "Sellante", level: "surface", acronym: "S", states: condition() },
  { code: "DESGASTE", section: "6.1.36", name: "Superficie desgastada", level: "surface", acronym: "DES", states: present("red") },
  { code: "TRATAMIENTO_CONDUCTO", section: "6.1.37", name: "Tratamiento de conducto", level: "tooth", types: ENDO_TYPES, states: typed(ENDO_TYPES) },
  { code: "TRANSPOSICION", section: "6.1.38", name: "Transposición dentaria", level: "range", glyph: "⇄", states: present("blue") },
];

export const findingByCode = (code: string) => FINDINGS.find((f) => f.code === code);
export const stateOf = (finding: Finding, code: string) => finding.states.find((s) => s.code === code);

export const LEVEL_LABEL: Record<Level, string> = {
  surface: "Superficie",
  tooth: "Pieza",
  range: "Entre piezas",
};

/** Acronym to print under a tooth for a mark (state acronym first, then the finding's). */
export function markAcronym(findingCode: string, stateCode: string) {
  const finding = findingByCode(findingCode);
  if (!finding) return "";
  return stateOf(finding, stateCode)?.acronym ?? finding.acronym ?? "";
}

export function markColor(findingCode: string, stateCode: string) {
  const finding = findingByCode(findingCode);
  const color = finding ? stateOf(finding, stateCode)?.color : undefined;
  return COLORS[color ?? "blue"];
}

export function markName(findingCode: string, stateCode: string) {
  const finding = findingByCode(findingCode);
  if (!finding) return findingCode;
  const state = stateOf(finding, stateCode);
  return state && finding.states.length > 1 ? state.name : finding.name;
}
