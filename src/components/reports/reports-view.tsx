"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import NextLink from "next/link";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DownloadIcon from "@mui/icons-material/FileDownloadOutlined";
import {
  reportAppointments,
  reportBalances,
  reportIncome,
  reportNewPatients,
  reportTreatments,
} from "@/app/(app)/reportes/actions";
import { AnimatedNumber, EASE, MotionBox, MotionPaper } from "@/components/motion";
import { ColumnChart, HorizontalBars } from "@/components/reports/charts";
import { ReportTable } from "@/components/reports/report-table";
import { STATUS, type AppointmentStatus } from "@/lib/appointments";
import { formatMoney } from "@/lib/money";
import { formatRecordNumber } from "@/lib/record";
import {
  PRESETS,
  bucketize,
  downloadCsv,
  groupBy,
  presetRange,
  ymd,
  type DateRange,
  type Preset,
} from "@/lib/reports";

const fmtDate = (d: string) =>
  new Date(d.length === 10 ? `${d}T00:00` : d).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("es-PE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });

function useReport<T>(fetcher: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ data: T | null; error: boolean; key: string }>({ data: null, error: false, key: "" });
  const key = JSON.stringify(deps);
  useEffect(() => {
    let cancelled = false;
    fetcher()
      .then((data) => !cancelled && setState({ data, error: false, key }))
      .catch(() => !cancelled && setState({ data: null, error: true, key }));
    return () => {
      cancelled = true;
    };
    // `fetcher` closes over `deps`, which are already part of `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return { data: state.key === key ? state.data : null, error: state.error && state.key === key };
}

function Stat({ label, value, hint, index = 0 }: { label: string; value: React.ReactNode; hint?: string; index?: number }) {
  return (
    <MotionPaper
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, boxShadow: "0 10px 24px rgba(11,37,69,0.14)" }}
      transition={{ duration: 0.3, ease: EASE, delay: index * 0.06 }}
      sx={{ p: { xs: 1.5, sm: 2.5 }, height: "100%" }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 800, fontSize: { xs: 20, sm: 26 }, lineHeight: 1.2, mt: 0.5, overflowWrap: "anywhere" }}>
        {value}
      </Typography>
      {hint && (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      )}
    </MotionPaper>
  );
}

function Stats({ items }: { items: { label: string; value: React.ReactNode; hint?: string }[] }) {
  return (
    <Grid container spacing={{ xs: 1, sm: 2 }}>
      {items.map((s, i) => (
        <Grid key={s.label} size={{ xs: 6, md: 12 / items.length }}>
          <Stat {...s} index={i} />
        </Grid>
      ))}
    </Grid>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {action}
      </Stack>
      {children}
    </Stack>
  );
}

const ExportButton = ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => (
  <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={onClick} disabled={disabled}>
    Exportar CSV
  </Button>
);

function Loading({ error }: { error: boolean }) {
  return error ? (
    <Alert severity="error">No se pudo cargar el reporte. Intenta de nuevo.</Alert>
  ) : (
    <Stack spacing={2}>
      <Skeleton variant="rounded" height={90} />
      <Skeleton variant="rounded" height={260} />
    </Stack>
  );
}

function IncomeReport({ range }: { range: DateRange }) {
  const { data, error } = useReport(() => reportIncome(range), [range.from, range.to]);
  if (!data) return <Loading error={error} />;

  const total = data.reduce((s, r) => s + r.amount, 0);
  const series = bucketize(data.map((r) => ({ date: r.date, value: r.amount })), range);
  const byMethod = groupBy(data, (r) => r.method, (r) => r.amount).sort((a, b) => b.sum - a.sum);

  return (
    <Stack spacing={3}>
      <Stats
        items={[
          { label: "Total cobrado", value: <AnimatedNumber value={total} kind="money" /> },
          { label: "N.º de pagos", value: <AnimatedNumber value={data.length} /> },
          { label: "Promedio por pago", value: <AnimatedNumber value={data.length ? total / data.length : 0} kind="money" /> },
        ]}
      />
      <Section title={`Cobros por ${series.unit === "day" ? "día" : "mes"}`}>
        <Paper sx={{ p: 2 }}>
          <ColumnChart series={series} format={formatMoney} ariaLabel="Cobros en el período" />
        </Paper>
      </Section>
      {byMethod.length > 0 && (
        <Section title="Por método de pago">
          <Paper sx={{ p: 2 }}>
            <HorizontalBars
              ariaLabel="Cobros por método de pago"
              data={byMethod.map((m) => ({ label: m.label, value: m.sum, display: formatMoney(m.sum) }))}
            />
          </Paper>
        </Section>
      )}
      <Section
        title="Detalle de pagos"
        action={
          <ExportButton
            disabled={!data.length}
            onClick={() =>
              downloadCsv(
                `ingresos_${range.from}_${range.to}.csv`,
                ["Fecha", "Paciente", "Plan", "Método", "Monto"],
                data.map((r) => [r.date, r.patient, r.plan, r.method, r.amount.toFixed(2)]),
              )
            }
          />
        }
      >
        <ReportTable
          rows={[...data].reverse()}
          rowKey={(r, i) => `${r.date}-${i}`}
          empty="No hay pagos en este período."
          columns={[
            { label: "Paciente", render: (r) => r.patient },
            { label: "Fecha", render: (r) => fmtDate(r.date) },
            { label: "Plan", render: (r) => r.plan },
            { label: "Método", render: (r) => r.method },
            { label: "Monto", align: "right", render: (r) => formatMoney(r.amount) },
          ]}
        />
      </Section>
    </Stack>
  );
}

function BalancesReport() {
  const { data, error } = useReport(() => reportBalances(), []);
  const patients = useMemo(() => {
    const map = new Map<string, { id: string; patient: string; record: number | null; plans: number; total: number; paid: number; balance: number; since: string }>();
    for (const r of data ?? []) {
      const cur = map.get(r.patient_id) ?? { id: r.patient_id, patient: r.patient, record: r.record, plans: 0, total: 0, paid: 0, balance: 0, since: r.since };
      map.set(r.patient_id, {
        ...cur,
        plans: cur.plans + 1,
        total: cur.total + r.total,
        paid: cur.paid + r.paid,
        balance: cur.balance + r.balance,
        since: r.since < cur.since ? r.since : cur.since,
      });
    }
    return [...map.values()].sort((a, b) => b.balance - a.balance);
  }, [data]);

  if (!data) return <Loading error={error} />;
  const owed = patients.reduce((s, p) => s + p.balance, 0);

  return (
    <Stack spacing={3}>
      <Alert severity="info" icon={false}>
        Este reporte muestra la situación <b>actual</b> de todos los planes activos; no depende del rango de fechas.
      </Alert>
      <Stats
        items={[
          { label: "Total por cobrar", value: <AnimatedNumber value={owed} kind="money" /> },
          { label: "Pacientes con saldo", value: <AnimatedNumber value={patients.length} /> },
          { label: "Mayor saldo", value: patients[0] ? <AnimatedNumber value={patients[0].balance} kind="money" /> : "—", hint: patients[0]?.patient },
        ]}
      />
      <Section
        title="Pacientes con saldo pendiente"
        action={
          <ExportButton
            disabled={!patients.length}
            onClick={() =>
              downloadCsv(
                "saldos_pendientes.csv",
                ["H.C.", "Paciente", "Planes", "Total", "Pagado", "Saldo", "Desde"],
                patients.map((p) => [p.record ? formatRecordNumber(p.record) : "", p.patient, p.plans, p.total.toFixed(2), p.paid.toFixed(2), p.balance.toFixed(2), p.since]),
              )
            }
          />
        }
      >
        <ReportTable
          rows={patients}
          rowKey={(p) => p.id}
          empty="No hay saldos pendientes. ¡Todo está al día!"
          columns={[
            {
              label: "Paciente",
              render: (p) => (
                <Link component={NextLink} href={`/clients/${p.id}`} underline="hover" color="inherit">
                  {p.patient}
                  {p.record ? ` · H.C. ${formatRecordNumber(p.record)}` : ""}
                </Link>
              ),
            },
            { label: "Planes", align: "right", render: (p) => p.plans },
            { label: "Total", align: "right", render: (p) => formatMoney(p.total) },
            { label: "Pagado", align: "right", render: (p) => formatMoney(p.paid) },
            { label: "Saldo", align: "right", render: (p) => <b style={{ color: "#c62828" }}>{formatMoney(p.balance)}</b> },
            { label: "Desde", render: (p) => fmtDate(p.since) },
          ]}
        />
      </Section>
    </Stack>
  );
}

function AppointmentsReport({ range }: { range: DateRange }) {
  const { data, error } = useReport(() => reportAppointments(range), [range.from, range.to]);
  if (!data) return <Loading error={error} />;

  const count = (s: AppointmentStatus) => data.filter((a) => a.status === s).length;
  const done = count("done");
  const noShow = count("no_show");
  const rate = done + noShow > 0 ? Math.round((done / (done + noShow)) * 100) : null;

  return (
    <Stack spacing={3}>
      <Stats
        items={[
          { label: "Citas en el período", value: <AnimatedNumber value={data.length} /> },
          { label: "Atendidas", value: <AnimatedNumber value={done} /> },
          { label: "No asistieron", value: <AnimatedNumber value={noShow} /> },
          { label: "Tasa de asistencia", value: rate === null ? "—" : `${rate}%`, hint: "Atendidas / (atendidas + no asistieron)" },
        ]}
      />
      <Section title="Por estado">
        <Paper sx={{ p: 2 }}>
          <HorizontalBars
            ariaLabel="Citas por estado"
            data={(Object.keys(STATUS) as AppointmentStatus[]).map((s) => ({
              label: STATUS[s].label,
              value: count(s),
              display: String(count(s)),
              color: STATUS[s].color,
            }))}
          />
        </Paper>
      </Section>
      <Section
        title="Detalle de citas"
        action={
          <ExportButton
            disabled={!data.length}
            onClick={() =>
              downloadCsv(
                `citas_${range.from}_${range.to}.csv`,
                ["Fecha y hora", "Paciente", "Motivo", "Estado"],
                data.map((a) => [new Date(a.starts_at).toLocaleString("es-PE"), a.patient, a.reason ?? "", STATUS[a.status as AppointmentStatus]?.label ?? a.status]),
              )
            }
          />
        }
      >
        <ReportTable
          rows={data}
          rowKey={(a, i) => `${a.starts_at}-${i}`}
          empty="No hay citas en este período."
          columns={[
            { label: "Paciente", render: (a) => a.patient },
            { label: "Fecha y hora", render: (a) => fmtDateTime(a.starts_at) },
            { label: "Motivo", render: (a) => a.reason || "—" },
            {
              label: "Estado",
              render: (a) => {
                const s = STATUS[a.status as AppointmentStatus];
                return <Chip size="small" label={s?.label ?? a.status} sx={{ bgcolor: s?.color, color: "#fff", fontWeight: 600 }} />;
              },
            },
          ]}
        />
      </Section>
    </Stack>
  );
}

function TreatmentsReport({ range }: { range: DateRange }) {
  const { data, error } = useReport(() => reportTreatments(range), [range.from, range.to]);
  const rows = useMemo(() => {
    const map = new Map<string, { name: string; times: number; items: Map<string, number> }>();
    for (const r of data ?? []) {
      const cur = map.get(r.name) ?? { name: r.name, times: 0, items: new Map() };
      cur.times += 1;
      // An item attended several times still counts its value once.
      if (r.item_id) cur.items.set(r.item_id, r.value);
      map.set(r.name, cur);
    }
    return [...map.values()]
      .map((m) => ({ name: m.name, times: m.times, value: [...m.items.values()].reduce((s, v) => s + v, 0) }))
      .sort((a, b) => b.times - a.times || b.value - a.value);
  }, [data]);

  if (!data) return <Loading error={error} />;
  const totalValue = rows.reduce((s, r) => s + r.value, 0);

  return (
    <Stack spacing={3}>
      <Stats
        items={[
          { label: "Atenciones registradas", value: <AnimatedNumber value={data.length} /> },
          { label: "Tratamientos distintos", value: <AnimatedNumber value={rows.length} /> },
          { label: "Valor atendido", value: <AnimatedNumber value={totalValue} kind="money" />, hint: "Según el precio del presupuesto" },
        ]}
      />
      {rows.length > 0 && (
        <Section title="Más realizados">
          <Paper sx={{ p: 2 }}>
            <HorizontalBars
              ariaLabel="Tratamientos más realizados"
              data={rows.slice(0, 10).map((r) => ({ label: r.name, value: r.times, display: `${r.times}` }))}
            />
          </Paper>
        </Section>
      )}
      <Section
        title="Detalle por tratamiento"
        action={
          <ExportButton
            disabled={!rows.length}
            onClick={() =>
              downloadCsv(
                `tratamientos_${range.from}_${range.to}.csv`,
                ["Tratamiento", "Veces", "Valor atendido"],
                rows.map((r) => [r.name, r.times, r.value.toFixed(2)]),
              )
            }
          />
        }
      >
        <ReportTable
          rows={rows}
          rowKey={(r) => r.name}
          empty="No hay atenciones en este período."
          columns={[
            { label: "Tratamiento", render: (r) => r.name },
            { label: "Veces", align: "right", render: (r) => r.times },
            { label: "Valor atendido", align: "right", render: (r) => formatMoney(r.value) },
          ]}
        />
      </Section>
    </Stack>
  );
}

function NewPatientsReport({ range }: { range: DateRange }) {
  const { data, error } = useReport(() => reportNewPatients(range), [range.from, range.to]);
  if (!data) return <Loading error={error} />;

  const series = bucketize(data.map((p) => ({ date: ymd(new Date(p.created_at)), value: 1 })), range);

  return (
    <Stack spacing={3}>
      <Stats items={[{ label: "Pacientes nuevos", value: <AnimatedNumber value={data.length} /> }]} />
      <Section title={`Altas por ${series.unit === "day" ? "día" : "mes"}`}>
        <Paper sx={{ p: 2 }}>
          <ColumnChart series={series} format={(n) => `${n} ${n === 1 ? "paciente" : "pacientes"}`} ariaLabel="Pacientes nuevos" />
        </Paper>
      </Section>
      <Section
        title="Detalle"
        action={
          <ExportButton
            disabled={!data.length}
            onClick={() =>
              downloadCsv(
                `pacientes_nuevos_${range.from}_${range.to}.csv`,
                ["H.C.", "Paciente", "Fecha de registro"],
                data.map((p) => [formatRecordNumber(p.record), p.patient, ymd(new Date(p.created_at))]),
              )
            }
          />
        }
      >
        <ReportTable
          rows={[...data].reverse()}
          rowKey={(p) => p.id}
          empty="No hay pacientes nuevos en este período."
          columns={[
            {
              label: "Paciente",
              render: (p) => (
                <Link component={NextLink} href={`/clients/${p.id}`} underline="hover" color="inherit">
                  {p.patient}
                </Link>
              ),
            },
            { label: "H.C.", render: (p) => formatRecordNumber(p.record) },
            { label: "Registrado", render: (p) => fmtDate(p.created_at) },
          ]}
        />
      </Section>
    </Stack>
  );
}

const subscribe = () => () => {};

const TABS = [
  { id: "income", label: "Ingresos", usesRange: true },
  { id: "balances", label: "Saldos pendientes", usesRange: false },
  { id: "appointments", label: "Citas", usesRange: true },
  { id: "treatments", label: "Tratamientos", usesRange: true },
  { id: "patients", label: "Pacientes nuevos", usesRange: true },
] as const;

export function ReportsView() {
  const [preset, setPreset] = useState<Preset>("month");
  // "Today" is only known in the browser: presets resolve after hydration, custom dates are stored as typed.
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const [custom, setCustom] = useState<DateRange | null>(null);
  const range = custom ?? (hydrated ? presetRange(preset === "custom" ? "month" : preset) : null);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("income");
  const active = TABS.find((t) => t.id === tab)!;

  function pick(next: Preset) {
    setPreset(next);
    setCustom(null);
  }

  function setDate(key: keyof DateRange, value: string) {
    if (!value) return;
    if (!range) return;
    setPreset("custom");
    const next = { ...range, [key]: value };
    setCustom(next.from > next.to ? { from: next.to, to: next.from } : next);
  }

  if (!range) {
    return (
      <Stack spacing={3}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Reportes
        </Typography>
        <Skeleton variant="rounded" height={300} />
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Reportes
      </Typography>

      {active.usesRange && (
        <Paper sx={{ p: 2 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
              {PRESETS.map((p) => (
                <Chip
                  key={p.id}
                  label={p.label}
                  onClick={() => pick(p.id)}
                  color={preset === p.id ? "primary" : "default"}
                  variant={preset === p.id ? "filled" : "outlined"}
                  sx={{ fontWeight: 600 }}
                />
              ))}
              {preset === "custom" && <Chip label="Personalizado" color="primary" />}
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                size="small"
                type="date"
                label="Desde"
                value={range.from}
                onChange={(e) => setDate("from", e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                size="small"
                type="date"
                label="Hasta"
                value={range.to}
                onChange={(e) => setDate("to", e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>
          </Stack>
        </Paper>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: "divider" }}>
        {TABS.map((t) => (
          <Tab key={t.id} value={t.id} label={t.label} sx={{ fontWeight: 600 }} />
        ))}
      </Tabs>

      <MotionBox key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: EASE }}>
        {tab === "income" && <IncomeReport range={range} />}
        {tab === "balances" && <BalancesReport />}
        {tab === "appointments" && <AppointmentsReport range={range} />}
        {tab === "treatments" && <TreatmentsReport range={range} />}
        {tab === "patients" && <NewPatientsReport range={range} />}
      </MotionBox>
    </Stack>
  );
}
