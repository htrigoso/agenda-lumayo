"use client";

import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Fab from "@mui/material/Fab";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { LiftCard, Stagger } from "@/components/motion";
import { listAppointments } from "@/app/(app)/agenda/actions";
import {
  STATUS,
  clientName,
  endsAt,
  formatTime,
  toDateTimeLocal,
  type Appointment,
} from "@/lib/appointments";

type Props = {
  refreshKey: number;
  onCreate: (startsAt: Date) => void;
  onSelect: (appointment: Appointment) => void;
};

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function shift(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function DayList({ refreshKey, onCreate, onSelect }: Props) {
  const [day, setDay] = useState(() => startOfDay(new Date()));
  const [items, setItems] = useState<Appointment[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listAppointments(day.toISOString(), shift(day, 1).toISOString())
      .then((list) => {
        if (cancelled) return;
        setItems(list);
        setError(false);
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [day, refreshKey]);

  function change(next: Date) {
    setItems(null);
    setDay(startOfDay(next));
  }

  const isToday = startOfDay(new Date()).getTime() === day.getTime();
  const label = day.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });

  function newAppointment() {
    const start = new Date(day);
    start.setHours(9, 0, 0, 0);
    onCreate(start);
  }

  return (
    <Stack spacing={2} sx={{ pb: 10 }}>
      <Paper sx={{ p: 1.5 }}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <IconButton aria-label="Día anterior" onClick={() => change(shift(day, -1))}>
            <ChevronLeftIcon />
          </IconButton>
          <Box sx={{ textAlign: "center" }}>
            <Typography sx={{ fontWeight: 700, textTransform: "capitalize" }}>{label}</Typography>
            <Typography variant="caption" color="text.secondary">
              {items === null ? "Cargando..." : `${items.length} ${items.length === 1 ? "cita" : "citas"}`}
            </Typography>
          </Box>
          <IconButton aria-label="Día siguiente" onClick={() => change(shift(day, 1))}>
            <ChevronRightIcon />
          </IconButton>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mt: 1.5, alignItems: "center" }}>
          <TextField
            type="date"
            size="small"
            fullWidth
            value={toDateTimeLocal(day).slice(0, 10)}
            onChange={(e) => e.target.value && change(new Date(`${e.target.value}T00:00`))}
            slotProps={{ htmlInput: { "aria-label": "Ir a una fecha" } }}
          />
          <Chip
            label="Hoy"
            color="primary"
            variant={isToday ? "filled" : "outlined"}
            onClick={() => change(new Date())}
            sx={{ fontWeight: 600 }}
          />
        </Stack>
      </Paper>

      {error && <Alert severity="error">No se pudo cargar la agenda. Intenta de nuevo.</Alert>}

      {items === null && !error && (
        <>
          <Skeleton variant="rounded" height={84} />
          <Skeleton variant="rounded" height={84} />
        </>
      )}

      {items?.length === 0 && (
        <Paper sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>No hay citas para este día.</Paper>
      )}

      {items && items.length > 0 && (
        <Stagger key={day.getTime()} spacing={2}>
          {items.map((a) => {
        const status = STATUS[a.status];
        return (
          <LiftCard
            key={a.id}
            onClick={() => onSelect(a)}
            sx={{ p: 2, cursor: "pointer", borderLeft: 5, borderColor: status.color, opacity: a.status === "cancelled" ? 0.65 : 1 }}
          >
            <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
              <Box sx={{ minWidth: 56 }}>
                <Typography sx={{ fontWeight: 700 }}>{formatTime(a.starts_at)}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatTime(endsAt(a))}
                </Typography>
              </Box>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600, overflowWrap: "anywhere" }}>{clientName(a)}</Typography>
                {a.reason && (
                  <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                    {a.reason}
                  </Typography>
                )}
                <Chip
                  size="small"
                  label={status.label}
                  sx={{ mt: 1, bgcolor: status.color, color: "#fff", fontWeight: 600 }}
                />
              </Box>
            </Stack>
          </LiftCard>
        );
      })}
        </Stagger>
      )}

      <Fab
        color="primary"
        aria-label="Nueva cita"
        onClick={newAppointment}
        sx={{ position: "fixed", right: 16, bottom: 16 }}
      >
        <AddIcon />
      </Fab>
    </Stack>
  );
}
