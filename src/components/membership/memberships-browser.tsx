"use client";

import { useMemo, useState } from "react";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import GroupsIcon from "@mui/icons-material/Groups";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SearchIcon from "@mui/icons-material/Search";
import VerifiedIcon from "@mui/icons-material/Verified";
import type { MembershipRow } from "@/app/(app)/membresias/actions";
import { PlanSwatch, SeatDots, StatusChip, ValidityBar } from "@/components/membership/ui";
import { AnimatePresence, LiftCard, Stagger } from "@/components/motion";
import { StatCard } from "@/components/stat-card";
import { AQUA, AZUL, INK } from "@/lib/brand";
import { PLANS, STATUS_COLOR, STATUS_LABEL, memberDni, memberName, statusOf, type MembershipStatus, type PlanKey } from "@/lib/membership";

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Attention first: what is about to expire, then healthy cards, then the rest.
const ORDER: Record<MembershipStatus, number> = { expiring: 0, active: 1, expired: 2, cancelled: 3 };
const STATUSES: MembershipStatus[] = ["active", "expiring", "expired", "cancelled"];

export function MembershipsBrowser({ rows }: { rows: MembershipRow[] }) {
  const [query, setQuery] = useState("");
  const [plan, setPlan] = useState<"all" | PlanKey>("all");
  const [status, setStatus] = useState<"all" | MembershipStatus>("all");

  const items = useMemo(
    () =>
      rows
        .map((m) => {
          const period = m.periods[0] ?? null;
          const st = statusOf(period?.ends_on ?? null, m.cancelled_at !== null);
          const holder = m.members.find((x) => x.role === "holder");
          const haystack = fold(
            [m.code, ...m.members.flatMap((x) => [memberName(x), memberDni(x) ?? "", x.member_code ?? ""])].join(" "),
          );
          return { m, period, status: st, holder, additional: m.members.filter((x) => x.role === "additional").length, haystack };
        })
        .sort((a, b) => ORDER[a.status] - ORDER[b.status] || (a.period?.ends_on ?? "").localeCompare(b.period?.ends_on ?? "")),
    [rows],
  );

  const count = (s: MembershipStatus) => items.filter((x) => x.status === s).length;
  const people = items.filter((x) => x.status !== "cancelled").reduce((n, x) => n + 1 + x.additional, 0);

  const q = fold(query.trim());
  const visible = items.filter(
    (x) => (plan === "all" || x.m.plan === plan) && (status === "all" || x.status === status) && (!q || x.haystack.includes(q)),
  );
  const filtering = q !== "" || plan !== "all" || status !== "all";
  const clear = () => {
    setQuery("");
    setPlan("all");
    setStatus("all");
  };

  if (rows.length === 0) {
    return (
      <Paper sx={{ p: { xs: 4, sm: 6 }, textAlign: "center" }}>
        <Box sx={{ display: "inline-flex", p: 2, borderRadius: "50%", bgcolor: AZUL[100], color: AZUL[700], mb: 2 }}>
          <CardMembershipIcon sx={{ fontSize: 40 }} />
        </Box>
        <Typography variant="h6">Aún no hay membresías</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, mb: 3, maxWidth: 420, mx: "auto" }}>
          Registra la primera Lumayo Card Clásica o Dorada con su titular y sus adicionales.
        </Typography>
        <Button component={NextLink} href="/membresias/nueva" variant="contained" startIcon={<AddIcon />}>
          Registrar primera membresía
        </Button>
      </Paper>
    );
  }

  return (
    <Stack spacing={3}>
      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard index={0} label="Vigentes" value={count("active") + count("expiring")} icon={<VerifiedIcon />} color={AQUA[500]} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard index={1} label="Por vencer (30 días)" value={count("expiring")} icon={<ScheduleIcon />} color={STATUS_COLOR.expiring} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard index={2} label="Vencidas" value={count("expired")} icon={<EventBusyIcon />} color={STATUS_COLOR.expired} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard index={3} label="Personas afiliadas" value={people} icon={<GroupsIcon />} color={AZUL[700]} />
        </Grid>
      </Grid>

      <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ alignItems: { md: "center" } }}>
          <TextField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, DNI o código"
            size="small"
            fullWidth
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
          />
          <ToggleButtonGroup exclusive size="small" value={plan} onChange={(_, v) => v && setPlan(v)} sx={{ flexShrink: 0 }}>
            <ToggleButton value="all" sx={{ px: 2 }}>Todas</ToggleButton>
            <ToggleButton value="classic" sx={{ px: 2 }}>Clásica</ToggleButton>
            <ToggleButton value="gold" sx={{ px: 2 }}>Dorada</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        <Stack direction="row" sx={{ mt: 1.5, flexWrap: "wrap", gap: 1 }}>
          <Chip label={`Todos los estados · ${items.length}`} onClick={() => setStatus("all")} color={status === "all" ? "primary" : "default"} variant={status === "all" ? "filled" : "outlined"} />
          {STATUSES.map((s) => (
            <Chip
              key={s}
              label={`${STATUS_LABEL[s]} · ${count(s)}`}
              onClick={() => setStatus(status === s ? "all" : s)}
              variant={status === s ? "filled" : "outlined"}
              sx={status === s ? { bgcolor: STATUS_COLOR[s], color: "#fff", "&:hover": { bgcolor: STATUS_COLOR[s] } } : { color: STATUS_COLOR[s], borderColor: "divider" }}
            />
          ))}
        </Stack>
      </Paper>

      {visible.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">Ninguna membresía coincide con la búsqueda.</Typography>
          {filtering && <Button onClick={clear} sx={{ mt: 1.5 }}>Limpiar filtros</Button>}
        </Paper>
      ) : (
        <Stagger spacing={1.25}>
          <AnimatePresence initial={false}>
            {visible.map(({ m, period, status: st, holder, additional }) => (
              <LiftCard key={m.id} sx={{ overflow: "hidden" }}>
                <Box
                  component={NextLink}
                  href={`/membresias/${m.id}`}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "auto 1fr auto", md: "auto minmax(0,2fr) minmax(0,1fr) minmax(160px,1.2fr) auto" },
                    alignItems: "center",
                    columnGap: 2,
                    rowGap: 1.25,
                    p: { xs: 1.75, sm: 2 },
                    textDecoration: "none",
                    color: "inherit",
                    opacity: st === "cancelled" ? 0.65 : 1,
                  }}
                >
                  <PlanSwatch plan={m.plan} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700 }} noWrap>{holder ? memberName(holder) : "Sin titular"}</Typography>
                    <Typography variant="body2" sx={{ color: INK[400], fontFamily: "var(--font-geist-mono), monospace" }} noWrap>
                      {m.code} · {PLANS[m.plan].label}
                    </Typography>
                  </Box>
                  <Box sx={{ display: { xs: "block", md: "none" }, justifySelf: "end" }}>
                    <StatusChip status={st} />
                  </Box>
                  <Stack spacing={0.5} sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}>
                    <SeatDots used={additional} max={PLANS[m.plan].maxAdditional} plan={m.plan} />
                    <Typography variant="caption" color="text.secondary">
                      Titular + {additional} de {PLANS[m.plan].maxAdditional} adicionales
                    </Typography>
                  </Stack>
                  <Box sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}>
                    <ValidityBar startsOn={period?.starts_on ?? null} endsOn={period?.ends_on ?? null} status={st} dense />
                  </Box>
                  <Box sx={{ display: { xs: "none", md: "block" } }}>
                    <StatusChip status={st} />
                  </Box>
                </Box>
              </LiftCard>
            ))}
          </AnimatePresence>
        </Stagger>
      )}
    </Stack>
  );
}
