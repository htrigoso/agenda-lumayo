import { Suspense } from "react";
import { connection } from "next/server";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { NewMembershipForm } from "@/components/membership/new-membership-form";
import { requireAdmin } from "@/lib/staff";

async function Form() {
  await connection();
  return <NewMembershipForm />;
}

export default async function NewMembershipPage() {
  await requireAdmin();
  return (
    <>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link href="/membresias" underline="hover" color="text.secondary">Membresías</Link>
        <Typography color="text.primary" sx={{ fontWeight: 600 }}>Nueva</Typography>
      </Breadcrumbs>
      <Typography variant="h5">Nueva membresía</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Elige la tarjeta, el titular y sus adicionales. El cobro se registra como afiliación anual.
      </Typography>
      <Suspense fallback={<Skeleton variant="rounded" height={520} />}>
        <Form />
      </Suspense>
    </>
  );
}
