import { test } from "node:test";
import assert from "node:assert/strict";
import { ROLE_LABELS, authErrorMessage, validateNewWorker } from "./team.ts";

const valid = { fullName: "Ana Pérez", email: "ana@lumayo.pe", password: "secreta123", role: "worker" };

test("validateNewWorker accepts a complete worker", () => {
  assert.equal(validateNewWorker(valid), null);
  assert.equal(validateNewWorker({ ...valid, role: "admin" }), null);
});

test("validateNewWorker requires a name", () => {
  assert.match(validateNewWorker({ ...valid, fullName: "  " }) ?? "", /nombre/i);
});

test("validateNewWorker requires a valid email", () => {
  assert.match(validateNewWorker({ ...valid, email: "ana" }) ?? "", /correo/i);
  assert.match(validateNewWorker({ ...valid, email: "" }) ?? "", /correo/i);
});

test("validateNewWorker requires a password of at least 8 characters", () => {
  assert.match(validateNewWorker({ ...valid, password: "1234567" }) ?? "", /8/);
  assert.equal(validateNewWorker({ ...valid, password: "12345678" }), null);
});

test("validateNewWorker rejects unknown roles", () => {
  assert.match(validateNewWorker({ ...valid, role: "owner" }) ?? "", /rol/i);
});

test("ROLE_LABELS names both roles in Spanish", () => {
  assert.deepEqual(ROLE_LABELS, { admin: "Administrador", worker: "Trabajador" });
});

test("authErrorMessage maps a duplicate email to a friendly message", () => {
  assert.match(authErrorMessage({ code: "email_exists", message: "x" }), /ya existe/i);
  assert.match(
    authErrorMessage({ message: "A user with this email address has already been registered" }),
    /ya existe/i,
  );
});

test("authErrorMessage maps a weak password and falls back to the raw message", () => {
  assert.match(authErrorMessage({ code: "weak_password", message: "x" }), /contraseña/i);
  assert.match(authErrorMessage({ message: "Boom" }), /Boom/);
});
