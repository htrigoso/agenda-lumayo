import type { SupabaseClient } from "@supabase/supabase-js";

export const PAGE_SIZE = 50;

/** Tag marking a patient as new to the clinic. */
export const NEW_TAG = "nuevo";

const COLUMNS =
  "id, record_number, legacy_record_number, first_name, last_name, mobile, whatsapp, email, description, is_priority, tags";

export function sanitizeTerm(q: unknown) {
  return typeof q === "string" ? q.trim().replace(/[,()%]/g, "") : "";
}

export async function fetchClientsPage(
  supabase: SupabaseClient,
  {
    page,
    term,
    onlyPriority,
    onlyNew,
  }: { page: number; term: string; onlyPriority: boolean; onlyNew: boolean },
) {
  let query = supabase
    .from("clients")
    .select(COLUMNS, { count: "exact" })
    // record_number comes from a sequence, so it follows insertion order exactly
    // (created_at ties for every row of a bulk import).
    .order("record_number", { ascending: true });
  if (onlyPriority) query = query.eq("is_priority", true);
  if (onlyNew) query = query.contains("tags", [NEW_TAG]);
  if (term) {
    // A purely numeric term also matches the clinic record number exactly.
    const byNumber = /^\d{1,9}$/.test(term) ? `,record_number.eq.${Number(term)}` : "";
    query = query.or(
      `first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,mobile.ilike.%${term}%${byNumber}`,
    );
  }
  return query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
}
