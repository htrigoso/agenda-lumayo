import type { SupabaseClient } from "@supabase/supabase-js";
import { limaToday } from "@/lib/calls";
import { DESKTOP_PAGE_SIZE } from "@/lib/page-size";

/** Tag marking a patient as new to the clinic. */
export const NEW_TAG = "nuevo";

const COLUMNS =
  "id, record_number, legacy_record_number, first_name, last_name, mobile, whatsapp, email, description, is_priority, tags, contact_saved_at, last_call_at, last_call_outcome, last_call_by, next_call_on";

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
    onlyDue,
    pageSize = DESKTOP_PAGE_SIZE,
  }: { page: number; term: string; onlyPriority: boolean; onlyNew: boolean; onlyDue: boolean; pageSize?: number },
) {
  let query = supabase.from("clients").select(COLUMNS, { count: "exact" });
  // "Por llamar": follow-ups due today or overdue (Lima calendar), oldest first.
  if (onlyDue) query = query.lte("next_call_on", limaToday()).order("next_call_on", { ascending: true });
  query = query
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
  return query.range((page - 1) * pageSize, page * pageSize - 1);
}
