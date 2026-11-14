import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CALL_OUTCOMES,
  addDays,
  groupCallsByMonth,
  isCallDue,
  limaToday,
  outcomeLabel,
  outcomeOption,
  relativeDay,
  validateCall,
} from "./calls.ts";

const TODAY = "2026-11-14";

test("CALL_OUTCOMES lists every outcome in the agreed order", () => {
  assert.deepEqual(
    CALL_OUTCOMES.map((o) => o.key),
    ["appointment", "call_back", "send_info", "no_answer", "unreachable", "wrong_number", "not_interested", "other"],
  );
});

test("only call_back needs a date and only other needs notes", () => {
  assert.deepEqual(CALL_OUTCOMES.filter((o) => o.needsDate).map((o) => o.key), ["call_back"]);
  assert.deepEqual(CALL_OUTCOMES.filter((o) => o.needsNotes).map((o) => o.key), ["other"]);
});

test("outcomeLabel returns the Spanish label, or the raw key when unknown", () => {
  assert.equal(outcomeLabel("appointment"), "Agendó cita");
  assert.equal(outcomeLabel("call_back"), "Volver a llamar");
  assert.equal(outcomeLabel("mystery"), "mystery");
});

test("outcomeOption exposes the chip color", () => {
  assert.equal(outcomeOption("appointment")?.color, "success");
  assert.equal(outcomeOption("wrong_number")?.color, "error");
  assert.equal(outcomeOption("nope"), undefined);
});

test("validateCall accepts a plain outcome", () => {
  assert.equal(validateCall({ outcome: "no_answer", notes: "", followUpOn: "" }, TODAY), null);
});

test("validateCall rejects an unknown outcome", () => {
  assert.match(validateCall({ outcome: "bogus", notes: "", followUpOn: "" }, TODAY) ?? "", /resultado/i);
  assert.match(validateCall({ outcome: "", notes: "", followUpOn: "" }, TODAY) ?? "", /resultado/i);
});

test("validateCall requires notes for other (blank does not count)", () => {
  assert.match(validateCall({ outcome: "other", notes: "   ", followUpOn: "" }, TODAY) ?? "", /nota/i);
  assert.equal(validateCall({ outcome: "other", notes: "Pidió presupuesto", followUpOn: "" }, TODAY), null);
});

test("validateCall requires a follow-up date for call_back", () => {
  assert.match(validateCall({ outcome: "call_back", notes: "", followUpOn: "" }, TODAY) ?? "", /fecha/i);
  assert.equal(validateCall({ outcome: "call_back", notes: "", followUpOn: "2026-11-15" }, TODAY), null);
});

test("validateCall allows today but not a past date", () => {
  assert.equal(validateCall({ outcome: "call_back", notes: "", followUpOn: TODAY }, TODAY), null);
  assert.match(validateCall({ outcome: "call_back", notes: "", followUpOn: "2026-11-13" }, TODAY) ?? "", /pasad/i);
});

test("validateCall rejects a malformed date", () => {
  assert.match(validateCall({ outcome: "call_back", notes: "", followUpOn: "15/11/2026" }, TODAY) ?? "", /fecha/i);
  assert.match(validateCall({ outcome: "call_back", notes: "", followUpOn: "2026-02-30" }, TODAY) ?? "", /fecha/i);
});

test("validateCall checks an optional date on other outcomes too", () => {
  assert.match(validateCall({ outcome: "send_info", notes: "", followUpOn: "2026-01-01" }, TODAY) ?? "", /pasad/i);
  assert.equal(validateCall({ outcome: "send_info", notes: "", followUpOn: "2026-12-01" }, TODAY), null);
});

test("limaToday uses the America/Lima calendar day (UTC-5)", () => {
  // 03:00 UTC on the 15th is still the 14th in Lima.
  assert.equal(limaToday(new Date("2026-11-15T03:00:00Z")), "2026-11-14");
  assert.equal(limaToday(new Date("2026-11-15T05:00:00Z")), "2026-11-15");
});

test("addDays moves across month and year boundaries", () => {
  assert.equal(addDays("2026-11-14", 1), "2026-11-15");
  assert.equal(addDays("2026-11-30", 1), "2026-12-01");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});

test("relativeDay describes a timestamp relative to today in Lima", () => {
  assert.equal(relativeDay("2026-11-14T20:00:00Z", TODAY), "hoy");
  // 02:00 UTC on the 14th is the evening of the 13th in Lima.
  assert.equal(relativeDay("2026-11-14T02:00:00Z", TODAY), "ayer");
  assert.equal(relativeDay("2026-11-11T15:00:00Z", TODAY), "hace 3 días");
});

test("isCallDue is true when the follow-up date is today or earlier", () => {
  assert.equal(isCallDue("2026-11-14", TODAY), true);
  assert.equal(isCallDue("2026-11-01", TODAY), true);
  assert.equal(isCallDue("2026-11-15", TODAY), false);
  assert.equal(isCallDue(null, TODAY), false);
  assert.equal(isCallDue(undefined, TODAY), false);
});

test("groupCallsByMonth groups by Lima month, newest month and call first", () => {
  const calls = [
    { id: "a", created_at: "2026-10-05T15:00:00Z" },
    { id: "b", created_at: "2026-11-14T15:00:00Z" },
    // 1 Dec 03:00 UTC is still 30 Nov in Lima.
    { id: "c", created_at: "2026-12-01T03:00:00Z" },
    { id: "d", created_at: "2026-10-20T15:00:00Z" },
  ];
  const groups = groupCallsByMonth(calls);
  assert.deepEqual(
    groups.map((g) => [g.label, g.calls.map((c) => c.id)]),
    [
      ["Noviembre 2026", ["c", "b"]],
      ["Octubre 2026", ["d", "a"]],
    ],
  );
});
