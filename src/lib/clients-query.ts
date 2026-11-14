import type { SupabaseClient } from "@supabase/supabase-js";
import { callDateRange } from "@/lib/calls";
import type { ListFilters } from "@/lib/list-filters";
import { DESKTOP_PAGE_SIZE } from "@/lib/page-size";

/** Tag marking a patient as new to the clinic. */
export const NEW_TAG = "nuevo";

const COLUMNS =
  "id, record_number, legacy_record_number, first_name, last_name, mobile, whatsapp, email, description, is_priority, tags, contact_saved_at, last_call_at, last_call_outcome, last_call_by, next_call_on";

export async function fetchClientsPage(
  supabase: SupabaseClient,
  { page, filters, pageSize = DESKTOP_PAGE_SIZE }: { page: number; filters: ListFilters; pageSize?: number },
) {
  const { term, onlyPriority, outcomes, callFrom, callTo } = filters;
  let query = supabase.from("clients").select(COLUMNS, { count: "exact" });
  query = query
    // record_number comes from a sequence, so it follows insertion order exactly
    // (created_at ties for every row of a bulk import).
    .order("record_number", { ascending: true });
  if (outcomes.length) query = query.in("last_call_outcome", outcomes);
  // Last call between two Lima days (inclusive).
  const range = callDateRange(callFrom, callTo);
  if (range.gte) query = query.gte("last_call_at", range.gte);
  if (range.lt) query = query.lt("last_call_at", range.lt);
  if (onlyPriority) query = query.eq("is_priority", true);
  if (term) {
    // A purely numeric term also matches the clinic record number exactly.
    const byNumber = /^\d{1,9}$/.test(term) ? `,record_number.eq.${Number(term)}` : "";
    query = query.or(
      `first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,mobile.ilike.%${term}%${byNumber}`,
    );
  }
  return query.range((page - 1) * pageSize, page * pageSize - 1);
}
