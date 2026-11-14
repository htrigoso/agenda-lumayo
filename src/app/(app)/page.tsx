import { Suspense } from "react";
import { redirect } from "next/navigation";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import EmailIcon from "@mui/icons-material/EmailOutlined";
import GroupIcon from "@mui/icons-material/GroupOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import type { Client } from "@/components/client-form";
import { StatCard } from "@/components/stat-card";
import { ClientsView } from "@/components/clients-view";
import { SearchBox } from "@/components/search-box";
import { fetchClientsPage, sanitizeTerm } from "@/lib/clients-query";
import { pageSizeFor } from "@/lib/page-size";
import { limaToday } from "@/lib/calls";
import { getCurrentStaff, getStaffNames } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { connection, userAgent } from "next/server";

type Filters = { term: string; onlyPriority: boolean; onlyNew: boolean; onlyDue: boolean };

function pageHref(page: number, { term, onlyPriority, onlyNew, onlyDue }: Filters) {
  const params = new URLSearchParams();
  if (term) params.set("q", term);
  if (onlyPriority) params.set("potential", "1");
  if (onlyNew) params.set("new", "1");
  if (onlyDue) params.set("call", "1");
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

async function Dashboard({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  // Per-request, per-user data: render at request time, never prerender it.
  await connection();
  const { q, potential, new: newParam, call, page: pageParam } = await searchParams;
  const onlyPriority = potential === "1";
  const onlyNew = newParam === "1";
  const onlyDue = call === "1";
  const term = sanitizeTerm(q);
  const filters = { term, onlyPriority, onlyNew, onlyDue };

  const rawPage = typeof pageParam === "string" ? Number.parseInt(pageParam, 10) : 1;
  const requestedPage = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  // 150 per page on phones, 250 on larger screens (decided on the server so the first render is right).
  const pageSize = pageSizeFor(userAgent({ headers: await headers() }).device.type);

  const supabase = await createClient();
  const head = { count: "exact", head: true } as const;
  const [list, totalRes, whatsappRes, emailRes, staffNames, staff] = await Promise.all([
    fetchClientsPage(supabase, { page: requestedPage, term, onlyPriority, onlyNew, onlyDue, pageSize }),
    supabase.from("clients").select("id", head),
    supabase.from("clients").select("id", head).not("whatsapp", "is", null),
    supabase.from("clients").select("id", head).not("email", "is", null),
    getStaffNames(),
    getCurrentStaff(),
  ]);
  const isAdmin = staff?.role === "admin";

  const clients = list.data as Client[] | null;
  const matches = list.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(matches / pageSize));
  // Out-of-range pages (e.g. after deleting the last item of a page) show the last page.
  if (requestedPage > pageCount && matches > 0) redirect(pageHref(pageCount, filters));
  const page = requestedPage;

  const total = totalRes.count ?? 0;
  const withWhatsapp = whatsappRes.count ?? 0;
  const withEmail = emailRes.count ?? 0;

  return (
    <Stack spacing={2}>
      <Grid container spacing={{ xs: 1, sm: 1.5 }}>
        <Grid size={4}>
          <StatCard index={0} label="Total de pacientes" value={total} icon={<GroupIcon />} />
        </Grid>
        <Grid size={4}>
          <StatCard index={1} label="Con WhatsApp" value={withWhatsapp} icon={<WhatsAppIcon />} />
        </Grid>
        <Grid size={4}>
          <StatCard index={2} label="Con correo" value={withEmail} icon={<EmailIcon />} />
        </Grid>
      </Grid>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <SearchBox initial={term} onlyPriority={onlyPriority} onlyNew={onlyNew} onlyDue={onlyDue} />
        {isAdmin && (
          <Button href="/clients/new" variant="contained" startIcon={<AddIcon />}>
            Nuevo paciente
          </Button>
        )}
      </Stack>

      <ClientsView
        clients={clients ?? []}
        matches={matches}
        page={page}
        pageSize={pageSize}
        term={term}
        onlyPriority={onlyPriority}
        onlyNew={onlyNew}
        onlyDue={onlyDue}
        staffNames={staffNames}
        today={limaToday()}
        isAdmin={isAdmin}
      />
    </Stack>
  );
}

export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5 }}>
        Pacientes
      </Typography>
      <Suspense fallback={<Skeleton variant="rounded" height={320} />}>
        <Dashboard searchParams={searchParams} />
      </Suspense>
    </>
  );
}
