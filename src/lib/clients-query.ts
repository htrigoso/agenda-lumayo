import type { SupabaseClient } from "@supabase/supabase-js";

export const PAGE_SIZE = 50;

const COLUMNS = "id, first_name, last_name, mobile, whatsapp, email, description, is_priority";

export function sanitizeTerm(q: unknown) {
  return typeof q === "string" ? q.trim().replace(/[,()%]/g, "") : "";
}

export async function fetchClientsPage(
  supabase: SupabaseClient,
  { page, term, onlyPriority }: { page: number; term: string; onlyPriority: boolean },
) {
  let query = supabase
    .from("clients")
    .select(COLUMNS, { count: "exact" })
    .order("is_priority", { ascending: false })
    .order("first_name")
    .order("id");
  if (onlyPriority) query = query.eq("is_priority", true);
  if (term) {
    query = query.or(
      `first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,mobile.ilike.%${term}%`,
    );
  }
  return query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
}
