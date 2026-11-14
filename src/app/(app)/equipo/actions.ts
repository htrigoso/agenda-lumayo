"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStaff } from "@/lib/staff";
import { authErrorMessage, isStaffRole, validateNewWorker, type StaffRole } from "@/lib/team";

export type StaffMember = { userId: string; fullName: string; role: StaffRole; active: boolean; email: string | null };

/** Result of the "add worker" form: an inline error, or ok. */
export type CreateWorkerState = { error: string } | { ok: true } | null;

async function requireAdmin() {
  const me = await getCurrentStaff();
  if (me?.role !== "admin") throw new Error("Solo un administrador puede gestionar el equipo.");
  return me;
}

export async function listStaff(): Promise<StaffMember[]> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff")
    .select("user_id, full_name, role, active")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  // Emails live in auth.users: readable only with the service role key.
  const emails = new Map<string, string>();
  const admin = createAdminClient();
  if (admin) {
    const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });
    for (const u of users?.users ?? []) if (u.email) emails.set(u.id, u.email);
  }

  return (data ?? []).map((s) => ({
    userId: s.user_id as string,
    fullName: s.full_name as string,
    role: s.role as StaffRole,
    active: Boolean(s.active),
    email: emails.get(s.user_id as string) ?? null,
  }));
}

export async function createWorker(_prev: CreateWorkerState, formData: FormData): Promise<CreateWorkerState> {
  await requireAdmin();
  const input = {
    fullName: String(formData.get("full_name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
    role: String(formData.get("role") ?? "worker"),
  };
  const invalid = validateNewWorker(input);
  if (invalid) return { error: invalid };

  const admin = createAdminClient();
  if (!admin) return { error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY para crear cuentas." };

  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });
  if (error || !data.user) return { error: authErrorMessage(error ?? { message: "respuesta vacía" }) };

  const supabase = await createClient();
  const { error: insertError } = await supabase
    .from("staff")
    .insert({ user_id: data.user.id, full_name: input.fullName, role: input.role, active: true });
  if (insertError) {
    // Do not leave an orphan login without a staff row.
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: `No se pudo registrar al trabajador: ${insertError.message}` };
  }
  revalidatePath("/equipo");
  return { ok: true };
}

export async function setStaffActive(userId: string, active: boolean) {
  const me = await requireAdmin();
  if (userId === me.userId && !active) throw new Error("No puedes desactivar tu propia cuenta.");
  const supabase = await createClient();
  const { error } = await supabase.from("staff").update({ active }).eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/equipo");
}

export async function setStaffRole(userId: string, role: string) {
  const me = await requireAdmin();
  if (!isStaffRole(role)) throw new Error("Rol no válido.");
  if (userId === me.userId && role !== "admin") throw new Error("No puedes quitarte el rol de administrador.");
  const supabase = await createClient();
  const { error } = await supabase.from("staff").update({ role }).eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/equipo");
}
