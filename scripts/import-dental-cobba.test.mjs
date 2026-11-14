import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSql, isPlaceholderPhone, toClient } from "./import-dental-cobba.mjs";

const base = { nombre: "Ana Maria Ruiz Soto", dni: "12345678", telefono: "987654321", telefono_valido: true };

test("placeholder phones with 7+ repeated digits are rejected", () => {
  assert.equal(isPlaceholderPhone("999999998"), true);
  assert.equal(isPlaceholderPhone("900000000"), true);
  assert.equal(isPlaceholderPhone("987654321"), false);
  assert.equal(toClient({ ...base, telefono: "999999998" }).mobile, null);
});

test("source label goes into the description mark", () => {
  assert.match(toClient(base, { source: "Bloque 1" }).description, /^Importado de fichas Dental Cobba · Bloque 1/);
});

test("tag is only set on inserted rows, never on updated ones", () => {
  const sql = buildSql([toClient(base)], { userId: "00000000-0000-0000-0000-000000000000", tag: "nuevo" });
  const [fill, insert] = sql.split("insert into");
  assert.doesNotMatch(fill, /tags/);
  assert.match(insert, /tags/);
  assert.match(insert, /'\{nuevo\}'::text\[\]/);
});

test("shared family phone only matches when the first given name is equal, ignoring accents", () => {
  const sql = buildSql([toClient(base)], { userId: "00000000-0000-0000-0000-000000000000" });
  assert.match(sql, /c\.mobile = s\.mobile and translate\(lower\(split_part\(c\.first_name, ' ', 1\)\), 'áéíóúü', 'aeiouu'\) = translate\(lower\(split_part\(s\.first_name, ' ', 1\)\)/);
});
