import { Suspense } from "react";
import { connection } from "next/server";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import { listMemberships } from "@/app/(app)/membresias/actions";
import { MembershipsBrowser } from "@/components/membership/memberships-browser";

async function MembershipsList() {
  await connection();
  const rows = await listMemberships();
  return <MembershipsBrowser rows={rows} />;
}

function ListSkeleton() {
  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2}>
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={84} sx={{ flex: 1 }} />)}
      </Stack>
      <Skeleton variant="rounded" height={104} />
      {[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={76} />)}
    </Stack>
  );
}

export default function MembershipsPage() {
  return (
    <>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5, mb: 3 }}>
        <div>
          <Typography variant="h5">Membresías</Typography>
          <Typography variant="body2" color="text.secondary">Lumayo Card Clásica y Dorada · titulares, adicionales y vigencias</Typography>
        </div>
        <Button component="a" href="/membresias/nueva" variant="contained" startIcon={<AddIcon />}>
          Nueva membresía
        </Button>
      </Stack>
      <Suspense fallback={<ListSkeleton />}>
        <MembershipsList />
      </Suspense>
    </>
  );
}
