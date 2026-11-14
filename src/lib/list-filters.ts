import { parseDay, parseOutcomes } from "./calls.ts";

/** Search and filters of the patient list, as carried in the URL. */
export type ListFilters = {
  term: string;
  onlyPriority: boolean;
  /** Last-call outcome keys (any of them). */
  outcomes: string[];
  /** Last call between these Lima days (YYYY-MM-DD), inclusive. */
  callFrom: string | null;
  callTo: string | null;
};

export const EMPTY_FILTERS: ListFilters = {
  term: "",
  onlyPriority: false,
  outcomes: [],
  callFrom: null,
  callTo: null,
};

/** Search text safe to embed in a PostgREST `or` filter. */
export function sanitizeTerm(q: unknown) {
  return typeof q === "string" ? q.trim().replace(/[,()%]/g, "") : "";
}

/** Filters from URL search params; invalid values are dropped. */
export function parseListFilters(params: Record<string, string | string[] | undefined>): ListFilters {
  return {
    term: sanitizeTerm(params.q),
    onlyPriority: params.potential === "1",
    outcomes: parseOutcomes(params.outcome),
    callFrom: parseDay(params.from),
    callTo: parseDay(params.to),
  };
}

/** List URL for these filters (and page, when past the first one). */
export function filtersHref(filters: ListFilters, page = 1) {
  const params = new URLSearchParams();
  if (filters.term) params.set("q", filters.term);
  if (filters.onlyPriority) params.set("potential", "1");
  if (filters.outcomes.length) params.set("outcome", filters.outcomes.join(","));
  if (filters.callFrom) params.set("from", filters.callFrom);
  if (filters.callTo) params.set("to", filters.callTo);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

export function hasFilters(f: ListFilters) {
  return Boolean(f.term || f.onlyPriority || f.outcomes.length || f.callFrom || f.callTo);
}
