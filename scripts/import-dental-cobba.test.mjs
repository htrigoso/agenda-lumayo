import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSql, isFillerDni, isPlaceholderPhone, selectRows, toClient } from "./import-dental-cobba.mjs";

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

test("selectRows drops patients without a usable phone when requirePhone is set", () => {
  const withPhone = { ...base };
  const filler = { ...base, dni: "87654321", telefono: "999999995" };
  const noPhone = { ...base, dni: "11223344", telefono: "", telefono_valido: false };
  assert.equal(selectRows([withPhone, filler, noPhone], { requirePhone: true }).length, 1);
  assert.equal(selectRows([withPhone, filler, noPhone], {}).length, 3);
});

test("filler DNIs are dropped so different people never merge on them", () => {
  for (const d of ["11111111", "00000000", "86868686", "95959579", "12312312", "44444456", "00000018", "79222222"]) {
    assert.equal(isFillerDni(d), true, d);
  }
  for (const d of ["45739863", "00954243", "01006010", "78882227", "01117777"]) {
    assert.equal(isFillerDni(d), false, d);
  }
  const c = toClient({ ...base, dni: "11111111" });
  assert.equal(c.dni, null);
  assert.match(c.description, /DNI de relleno en ficha: 11111111/);
});
