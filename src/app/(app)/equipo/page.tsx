import { Suspense } from "react";
import { notFound } from "next/navigation";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { listStaff } from "@/app/(app)/equipo/actions";
import { TeamManager } from "@/components/team/team-manager";
import { getCurrentStaff } from "@/lib/staff";
import { hasServiceRoleKey } from "@/lib/supabase/admin";

async function Team() {
  const me = await getCurrentStaff();
  if (me?.role !== "admin") notFound();
  const members = await listStaff();
  const canManageAccounts = hasServiceRoleKey();
  return (
    <Stack spacing={2}>
      {!canManageAccounts && (
        <Alert severity="warning">
          Para crear cuentas y ver los correos falta la clave de servicio. Agrega <strong>SUPABASE_SERVICE_ROLE_KEY</strong> en{" "}
          <code>.env.local</code> y en las variables de entorno de Vercel, y vuelve a desplegar.
        </Alert>
      )}
      <TeamManager members={members} currentUserId={me.userId} canCreate={canManageAccounts} />
    </Stack>
  );
}

export default function TeamPage() {
  return (
    <>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Equipo
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Cuentas del personal que usa la agenda
      </Typography>
      <Suspense fallback={<Skeleton variant="rounded" height={260} />}>
        <Team />
      </Suspense>
    </>
  );
}
