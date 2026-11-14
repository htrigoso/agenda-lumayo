import { test } from "node:test";
import assert from "node:assert/strict";
import { EMPTY_FILTERS, filtersHref, hasFilters, parseListFilters } from "./list-filters.ts";

test("parseListFilters reads every filter from the URL, ignoring invalid values", () => {
  assert.deepEqual(
    parseListFilters({ q: " ana ", potential: "1", outcome: "no_answer,bogus", from: "2026-11-01", to: "2026-02-30" }),
    { term: "ana", onlyPriority: true, outcomes: ["no_answer"], callFrom: "2026-11-01", callTo: null },
  );
  assert.deepEqual(parseListFilters({}), EMPTY_FILTERS);
});

test("filtersHref writes only the active filters, plus the page when > 1", () => {
  assert.equal(filtersHref(EMPTY_FILTERS), "/");
  assert.equal(
    filtersHref({ ...EMPTY_FILTERS, term: "ana", outcomes: ["no_answer", "voicemail"], callFrom: "2026-11-01", callTo: "2026-11-14" }, 2),
    "/?q=ana&outcome=no_answer%2Cvoicemail&from=2026-11-01&to=2026-11-14&page=2",
  );
});

test("parseListFilters(filtersHref(x)) round-trips", () => {
  const filters = { term: "luz", onlyPriority: true, outcomes: ["call_back"], callFrom: null, callTo: "2026-11-14" };
  const params = Object.fromEntries(new URL(filtersHref(filters), "http://x").searchParams);
  assert.deepEqual(parseListFilters(params), filters);
});

test("hasFilters is true when any filter is set", () => {
  assert.equal(hasFilters(EMPTY_FILTERS), false);
  assert.equal(hasFilters({ ...EMPTY_FILTERS, callTo: "2026-11-14" }), true);
  assert.equal(hasFilters({ ...EMPTY_FILTERS, outcomes: ["other"] }), true);
});
