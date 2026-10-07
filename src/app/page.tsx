import { Suspense } from "react";
import { redirect } from "next/navigation";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import EmailIcon from "@mui/icons-material/EmailOutlined";
import GroupIcon from "@mui/icons-material/GroupOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import type { Client } from "@/components/client-form";
import { AppShell } from "@/components/app-shell";
import { ClientsView } from "@/components/clients-view";
import { SearchBox } from "@/components/search-box";
import { PAGE_SIZE, fetchClientsPage, sanitizeTerm } from "@/lib/clients-query";
import { createClient } from "@/lib/supabase/server";

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Paper
      sx={{
        p: { xs: 1.5, sm: 2.5 },
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-start", sm: "center" },
        gap: { xs: 1, sm: 2 },
        height: "100%",
      }}
    >
      <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText", width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}>
        {icon}
      </Avatar>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: 12, sm: 14 } }}>
          {label}
        </Typography>
      </Box>
    </Paper>
  );
}

function pageHref(page: number, term: string, onlyPriority: boolean) {
  const params = new URLSearchParams();
  if (term) params.set("q", term);
  if (onlyPriority) params.set("potential", "1");
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

async function Dashboard({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const { q, potential, page: pageParam } = await searchParams;
  const onlyPriority = potential === "1";
  const term = sanitizeTerm(q);

  const rawPage = typeof pageParam === "string" ? Number.parseInt(pageParam, 10) : 1;
  const requestedPage = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const supabase = await createClient();
  const head = { count: "exact", head: true } as const;
  const [list, totalRes, whatsappRes, emailRes] = await Promise.all([
    fetchClientsPage(supabase, { page: requestedPage, term, onlyPriority }),
    supabase.from("clients").select("id", head),
    supabase.from("clients").select("id", head).not("whatsapp", "is", null),
    supabase.from("clients").select("id", head).not("email", "is", null),
  ]);

  const clients = list.data as Client[] | null;
  const matches = list.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(matches / PAGE_SIZE));
  // Out-of-range pages (e.g. after deleting the last item of a page) show the last page.
  if (requestedPage > pageCount && matches > 0) redirect(pageHref(pageCount, term, onlyPriority));
  const page = requestedPage;
  const from = matches === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, matches);

  const total = totalRes.count ?? 0;
  const withWhatsapp = whatsappRes.count ?? 0;
  const withEmail = emailRes.count ?? 0;

  return (
    <Stack spacing={3}>
      <Grid container spacing={{ xs: 1, sm: 2 }}>
        <Grid size={4}>
          <StatCard label="Total de pacientes" value={total} icon={<GroupIcon />} />
        </Grid>
        <Grid size={4}>
          <StatCard label="Con WhatsApp" value={withWhatsapp} icon={<WhatsAppIcon />} />
        </Grid>
        <Grid size={4}>
          <StatCard label="Con correo" value={withEmail} icon={<EmailIcon />} />
        </Grid>
      </Grid>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <SearchBox initial={term} onlyPriority={onlyPriority} />
        <Button href="/clients/new" variant="contained" startIcon={<AddIcon />}>
          Nuevo paciente
        </Button>
      </Stack>

      <ClientsView
        clients={clients ?? []}
        matches={matches}
        page={page}
        pageCount={pageCount}
        from={from}
        to={to}
        term={term}
        onlyPriority={onlyPriority}
      />
    </Stack>
  );
}

export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <AppShell>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Pacientes
      </Typography>
      <Suspense fallback={<Skeleton variant="rounded" height={320} />}>
        <Dashboard searchParams={searchParams} />
      </Suspense>
    </AppShell>
  );
}
