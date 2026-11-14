export type StaffRole = "admin" | "worker";

export const ROLE_LABELS: Record<StaffRole, string> = { admin: "Administrador", worker: "Trabajador" };

export const MIN_PASSWORD_LENGTH = 8;

export type NewWorker = { fullName: string; email: string; password: string; role: string };

export function isStaffRole(role: string): role is StaffRole {
  return role === "admin" || role === "worker";
}

/** Error message for an invalid "add worker" form, or null. */
export function validateNewWorker({ fullName, email, password, role }: NewWorker) {
  if (!fullName.trim()) return "Escribe el nombre del trabajador.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Escribe un correo válido.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `La contraseña temporal debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  if (!isStaffRole(role)) return "Elige un rol válido.";
  return null;
}

/** Friendly Spanish message for a Supabase Auth admin error. */
export function authErrorMessage(error: { code?: string; message: string }) {
  if (error.code === "email_exists" || /already (been )?registered/i.test(error.message)) {
    return "Ya existe una cuenta con ese correo.";
  }
  if (error.code === "weak_password") return "La contraseña es demasiado débil. Usa una más larga o variada.";
  return `No se pudo crear la cuenta: ${error.message}`;
}
