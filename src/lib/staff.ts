import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { StaffRole } from "@/lib/team";

export type CurrentStaff = { userId: string; fullName: string; role: StaffRole };

/**
 * The signed-in user's active staff row, or null (signed out, no row, or deactivated).
 * Cached per request so the layout, nav and pages share one lookup.
 */
export const getCurrentStaff = cache(async (): Promise<CurrentStaff | null> => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data } = await supabase
    .from("staff")
    .select("user_id, full_name, role, active")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!data?.active) return null;
  return { userId: data.user_id as string, fullName: data.full_name as string, role: data.role as StaffRole };
});

/** Gate for admin-only pages: anyone else is sent back to the patient list. */
export async function requireAdmin(): Promise<CurrentStaff> {
  const staff = await getCurrentStaff();
  if (staff?.role !== "admin") redirect("/");
  return staff;
}

/** Gate for admin-only server actions: throws instead of redirecting. */
export async function assertAdmin(): Promise<CurrentStaff> {
  const staff = await getCurrentStaff();
  if (staff?.role !== "admin") throw new Error("No autorizado");
  return staff;
}

/** Map of staff user_id → full name, for showing who made each call. */
export async function getStaffNames() {
  const supabase = await createClient();
  const { data } = await supabase.from("staff").select("user_id, full_name");
  return Object.fromEntries((data ?? []).map((s) => [s.user_id as string, s.full_name as string])) as Record<string, string>;
}
