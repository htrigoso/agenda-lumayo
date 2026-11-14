// Builds an idempotent SQL import of the Dental Cobba patient sheets into public.clients.
// Usage: node scripts/import-dental-cobba.mjs <json> <user_id> [--tag nuevo] [--source "Bloque 1"] [--chunk 300] [--out dir]
// Without --out the SQL goes to stdout; with --out it is split into <dir>/import-NN.sql files of --chunk rows.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const IMPORT_MARK = "Importado de fichas Dental Cobba";

const MONTHS = {
  ene: 1, enero: 1, feb: 2, febrero: 2, mar: 3, marzo: 3, abr: 4, abril: 4, may: 5, mayo: 5,
  jun: 6, junio: 6, jul: 7, julio: 7, ago: 8, agosto: 8, set: 9, sep: 9, sept: 9, septiembre: 9,
  setiembre: 9, oct: 10, octubre: 10, nov: 11, noviembre: 11, dic: 12, diciembre: 12,
};

const blank = (v) => {
  const s = String(v ?? "").trim();
  return s ? s : null;
};

export function parseDate(raw) {
  const s = blank(raw);
  if (!s || s.includes("?")) return null;
  const m = s.match(/^(\d{1,2})[/\-. ]+([a-zA-Z]+|\d{1,2})[/\-. ]+(\d{2}|\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = /^\d+$/.test(m[2]) ? Number(m[2]) : MONTHS[m[2].toLowerCase()];
  let year = Number(m[3]);
  if (m[3].length === 2) year += year > 30 ? 1900 : 2000;
  if (!month) return null;
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day || year < 1900 || d > new Date()) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseSex(raw) {
  const s = String(raw ?? "").trim().toUpperCase();
  if (s.startsWith("M")) return "M";
  if (s.startsWith("F")) return "F";
  return null;
}

/** Fillers like 999999998 or 900000000: seven or more copies of the same digit. */
export function isPlaceholderPhone(phone) {
  const counts = {};
  for (const ch of String(phone ?? "")) counts[ch] = (counts[ch] ?? 0) + 1;
  return Object.values(counts).some((n) => n >= 7);
}

const PARTICLES = new Set(["de", "del", "la", "las", "los"]);

/** Peruvian names: the last two surnames go to last_name, keeping particles ("del Águila") attached. */
export function splitName(raw) {
  const words = String(raw ?? "").replace(/\(\?\)/g, "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  let cut = words.length;
  for (let surnames = 0; surnames < 2 && cut > 1; surnames++) {
    cut--;
    while (cut > 1 && PARTICLES.has(words[cut - 1].toLowerCase())) cut--;
  }
  return { first_name: words.slice(0, cut).join(" "), last_name: words.slice(cut).join(" ") };
}

export function buildDescription(p, { dniPending = false, phoneRejected = null, source = null } = {}) {
  const lines = [IMPORT_MARK + (source ? ` · ${source}` : "") + (p.fecha ? ` (ficha ${p.fecha})` : "")];
  if (blank(p.motivo_consulta)) lines.push(`Motivo: ${p.motivo_consulta.trim()}`);
  const tx = (p.diagnosticos ?? [])
    .map((d) => [d.diagnostico, d.tratamiento, d.piezas && `piezas ${d.piezas}`, d.presupuesto].filter(blank).join(" · "))
    .filter(Boolean);
  if (tx.length) lines.push("Tratamientos:", ...tx.map((t) => `- ${t}`));
  if (blank(p.total_texto)) lines.push(`Total: ${p.total_texto.trim()}`);
  if (blank(p.telefono_secundario)) lines.push(`Teléfono secundario: ${p.telefono_secundario}`);
  if (blank(p.notas)) lines.push(`Notas: ${p.notas.trim()}`);
  const verify = [
    blank(p.datos_por_verificar),
    dniPending && `DNI ilegible en ficha: ${p.dni}`,
    phoneRejected && `Teléfono de relleno en ficha: ${phoneRejected}`,
  ].filter(Boolean);
  if (verify.length) lines.push(`Por verificar: ${verify.join("; ")}`);
  return lines.join("\n");
}

export function toClient(p, { source = null } = {}) {
  const dniRaw = blank(p.dni);
  const dniValid = dniRaw && /^\d{8}$/.test(dniRaw) ? dniRaw : null;
  const candidate = p.telefono_valido ? blank(p.telefono) : null;
  const placeholder = candidate && isPlaceholderPhone(candidate);
  const phone = placeholder ? null : candidate;
  return {
    ...splitName(p.nombre),
    mobile: phone,
    whatsapp: phone,
    dni: dniValid,
    birth_date: parseDate(p.fecha_nacimiento),
    sex: parseSex(p.sexo),
    address: blank(p.direccion),
    occupation: blank(p.ocupacion),
    legacy_record_number: blank(p.historia_clinica),
    description: buildDescription(p, {
      dniPending: Boolean(dniRaw && !dniValid),
      phoneRejected: placeholder ? candidate : null,
      source,
    }),
  };
}

const lit = (v) => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);

const COLS = ["first_name", "last_name", "mobile", "whatsapp", "dni", "birth_date", "sex", "address", "occupation", "legacy_record_number", "description"];

// Existing patients only get their empty fields filled; everything else is inserted.
// A phone match also needs the same first given name (accent-insensitive): families share one phone,
// so phone alone would merge different people, while sheets often misspell surnames or misread DNI digits.
// Jack Izquierdo was typed as 918751347 in the app and 978751347 in the sheet: same patient.
const firstGiven = (alias) => `translate(lower(split_part(${alias}.first_name, ' ', 1)), 'áéíóúü', 'aeiouu')`;
const MATCH = `(c.dni = s.dni or (c.mobile = s.mobile and ${firstGiven("c")} = ${firstGiven("s")}) or (c.mobile = '918751347' and s.mobile = '978751347'))`;

export function buildSql(rows, { userId, tag = null }) {
  const values = rows
    .map((c) => `(${COLS.map((k) => (k === "birth_date" ? `${lit(c[k])}::date` : lit(c[k]))).join(", ")})`)
    .join(",\n");
  const tagCol = tag ? ", tags" : "";
  const tagVal = tag ? `, ${lit(`{${tag}}`)}::text[]` : "";
  const uid = `${lit(userId)}::uuid`;
  return `with src(${COLS.join(", ")}) as (values
${values}
),
fill as (
  update public.clients c set
    dni = coalesce(c.dni, s.dni),
    birth_date = coalesce(c.birth_date, s.birth_date),
    sex = coalesce(c.sex, s.sex),
    address = coalesce(c.address, s.address),
    occupation = coalesce(c.occupation, s.occupation),
    legacy_record_number = coalesce(c.legacy_record_number, s.legacy_record_number),
    whatsapp = coalesce(c.whatsapp, s.whatsapp),
    description = case when c.description is null then s.description
                       when position(s.description in c.description) > 0 then c.description
                       else c.description || E'\\n\\n' || s.description end,
    updated_at = now()
  from src s
  where c.user_id = ${uid} and ${MATCH}
  returning c.id
),
ins as (
insert into public.clients (user_id, ${COLS.join(", ")}${tagCol})
select ${uid}, s.*${tagVal} from src s
where not exists (
  select 1 from public.clients c
  where c.user_id = ${uid}
    and (${MATCH} or (s.first_name <> '' and position('${IMPORT_MARK}' in coalesce(c.description, '')) > 0 and c.first_name = s.first_name and c.last_name = s.last_name))
)
returning id
)
select (select count(*) from fill) as updated, (select count(*) from ins) as inserted;`;
}

function parseArgs(argv) {
  const [jsonPath, userId, ...rest] = argv;
  const opts = { jsonPath, userId, tag: null, source: null, chunk: 0, out: null };
  for (let i = 0; i < rest.length; i += 2) opts[rest[i].replace(/^--/, "")] = rest[i + 1];
  opts.chunk = Number(opts.chunk) || 0;
  return opts;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.jsonPath || !opts.userId) {
    console.error('Usage: node scripts/import-dental-cobba.mjs <json> <user_id> [--tag nuevo] [--source "Bloque 1"] [--chunk 300] [--out dir]');
    process.exit(1);
  }
  const data = JSON.parse(readFileSync(opts.jsonPath, "utf8"));
  const rows = data.pacientes.map((p) => toClient(p, opts)).filter((c) => c.first_name || c.mobile || c.dni);
  if (!opts.out) {
    console.log(buildSql(rows, opts));
  } else {
    mkdirSync(opts.out, { recursive: true });
    const size = opts.chunk || rows.length;
    for (let i = 0; i * size < rows.length; i++) {
      const file = join(opts.out, `import-${String(i + 1).padStart(2, "0")}.sql`);
      writeFileSync(file, buildSql(rows.slice(i * size, (i + 1) * size), opts));
    }
  }
  console.error(JSON.stringify({ total: rows.length, sample: rows.slice(0, 2) }, null, 1));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
