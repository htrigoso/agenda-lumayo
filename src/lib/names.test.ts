import { test } from "node:test";
import assert from "node:assert/strict";
import { shortName } from "./names.ts";

test("shortName keeps only the first given name and the first surname", () => {
  assert.equal(shortName("Jack Cristhoffer", "Izquierdo Barrera"), "Jack Izquierdo");
  assert.equal(shortName("Amílcar", "Sánchez Dal Águila"), "Amílcar Sánchez");
  assert.equal(shortName("Luz Magali", "Paredes salas"), "Luz Paredes");
});

test("shortName keeps compound surnames that start with a particle", () => {
  assert.equal(shortName("María", "De la Cruz Pérez"), "María De la Cruz");
  assert.equal(shortName("José", "del Águila Ríos"), "José del Águila");
});

test("shortName tolerates extra spaces and missing parts", () => {
  assert.equal(shortName("  Ana   Lucía ", "  Torres  "), "Ana Torres");
  assert.equal(shortName("Ana", ""), "Ana");
  assert.equal(shortName("", "Torres"), "Torres");
});
