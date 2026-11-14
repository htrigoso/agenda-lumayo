import { test } from "node:test";
import assert from "node:assert/strict";
import { DESKTOP_PAGE_SIZE, MOBILE_PAGE_SIZE, pageSizeFor, safePageSize } from "./page-size.ts";

test("pageSizeFor: 150 patients per page on phones, 250 on desktop", () => {
  assert.equal(MOBILE_PAGE_SIZE, 150);
  assert.equal(DESKTOP_PAGE_SIZE, 250);
  assert.equal(pageSizeFor("mobile"), 150);
  assert.equal(pageSizeFor(undefined), 250);
  assert.equal(pageSizeFor("tablet"), 250);
});

test("safePageSize only accepts the known sizes (clients cannot request huge pages)", () => {
  assert.equal(safePageSize(150), 150);
  assert.equal(safePageSize(250), 250);
  assert.equal(safePageSize(100000), 250);
  assert.equal(safePageSize(Number.NaN), 250);
});
