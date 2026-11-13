import { test } from "node:test";
import assert from "node:assert/strict";
import { buildVCard, toE164, vcardFileName } from "./vcard.ts";

const base = { first_name: "Juan Carlos", last_name: "Pérez Ríos", mobile: "987654321", email: null };

test("builds a vCard 3.0 with CRLF line endings", () => {
  const card = buildVCard(base);
  assert.ok(card.startsWith("BEGIN:VCARD\r\nVERSION:3.0\r\n"));
  assert.ok(card.endsWith("END:VCARD\r\n"));
});

test("uses the name as-is, surnames in the family field", () => {
  const card = buildVCard(base);
  assert.match(card, /\r\nN:Pérez Ríos;Juan Carlos;;;\r\n/);
  assert.match(card, /\r\nFN:Juan Carlos Pérez Ríos\r\n/);
});

test("adds the Peruvian country code to 9-digit mobiles", () => {
  assert.match(buildVCard(base), /\r\nTEL;TYPE=CELL:\+51987654321\r\n/);
});

test("includes email only when present", () => {
  assert.doesNotMatch(buildVCard(base), /EMAIL/);
  assert.match(buildVCard({ ...base, email: "juan@mail.com" }), /\r\nEMAIL;TYPE=INTERNET:juan@mail\.com\r\n/);
});

test("escapes vCard special characters", () => {
  const card = buildVCard({ ...base, first_name: "Ana; María", last_name: "O,Neil\\X" });
  assert.match(card, /N:O\\,Neil\\\\X;Ana\\; María;;;/);
});

test("never leaks clinical description into the card", () => {
  const card = buildVCard({ ...base, description: "Endodoncia S/ 400" } as typeof base);
  assert.doesNotMatch(card, /Endodoncia/);
});

test("falls back to the phone number when the patient has no name", () => {
  const card = buildVCard({ ...base, first_name: "", last_name: "" });
  assert.match(card, /\r\nFN:987654321\r\n/);
});

test("toE164 normalizes common Peruvian formats", () => {
  assert.equal(toE164("987 654 321"), "+51987654321");
  assert.equal(toE164("+51 987654321"), "+51987654321");
  assert.equal(toE164("51987654321"), "+51987654321");
  assert.equal(toE164("012345678"), "012345678");
});

test("vcardFileName is ASCII-safe", () => {
  assert.equal(vcardFileName(base), "Juan-Carlos-Perez-Rios.vcf");
  assert.equal(vcardFileName({ ...base, first_name: "", last_name: "" }), "contacto.vcf");
});
