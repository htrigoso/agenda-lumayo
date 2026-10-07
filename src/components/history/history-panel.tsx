"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import EditIcon from "@mui/icons-material/EditOutlined";
import {
  deleteAttendance,
  getAttendances,
  getOpenItems,
  type Attendance,
  type OpenItem,
} from "@/app/(app)/clients/clinical-actions";
import { formatRecordNumber } from "@/lib/record";
import { MotionStack, Stagger, itemVariants } from "@/components/motion";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { AttendanceDialog } from "@/components/history/attendance-dialog";

export function HistoryPanel({
  clientId,
  recordNumber,
  legacyNumber,
}: {
  clientId: string;
  recordNumber?: number;
  legacyNumber: string | null;
}) {
  const [items, setItems] = useState<Attendance[] | null>(null);
  const [openItems, setOpenItems] = useState<OpenItem[]>([]);
  const [error, setError] = useState(false);
  const [view, setView] = useState<"plan" | "time">("plan");
  const [dialog, setDialog] = useState<{ attendance: Attendance | null } | null>(null);
  const [removing, setRemoving] = useState<Attendance | null>(null);
  const [pending, startTransition] = useTransition();

  const load = useCallback(() => {
    getAttendances(clientId)
      .then((list) => {
        setItems(list);
        setError(false);
      })
      .catch(() => setError(true));
    getOpenItems(clientId)
      .then(setOpenItems)
      .catch(() => setOpenItems([]));
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  const groups = useMemo(() => {
    const map = new Map<string, { key: string; title: string; items: Attendance[] }>();
    for (const a of items ?? []) {
      const key = a.plan_id ?? "none";
      const group = map.get(key) ?? { key, title: a.plan_title ?? "Otras atenciones (fuera del presupuesto)", items: [] };
      group.items.push(a);
      map.set(key, group);
    }
    // Plans first (most recent activity first), "other attendances" last.
    return [...map.values()].sort((x, y) => Number(x.key === "none") - Number(y.key === "none"));
  }, [items]);

  const timeline = (list: Attendance[]) => (
    <Stagger key={view} spacing={0}>
      {list.map((a, index) => (
        <MotionStack key={a.id} variants={itemVariants} direction="row" spacing={2}>
          <Stack sx={{ alignItems: "center", width: 14, flexShrink: 0 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "primary.main", mt: 2.2, flexShrink: 0 }} />
            {index < list.length - 1 && <Box sx={{ width: 2, flexGrow: 1, bgcolor: "divider" }} />}
          </Stack>
          <Paper sx={{ p: 2, mb: 2, flexGrow: 1, minWidth: 0 }}>
            <Stack direction="row" sx={{ alignItems: "flex-start", gap: 1 }}>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">
                  {new Date(`${a.attended_at}T00:00`).toLocaleDateString("es-PE", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Typography>
                <Typography sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>{a.procedure}</Typography>
                <Stack direction="row" sx={{ gap: 1, mt: 0.5, flexWrap: "wrap" }}>
                  {a.teeth && <Chip size="small" label={`Piezas ${a.teeth}`} />}
                  {view === "time" && a.plan_title && <Chip size="small" color="primary" variant="outlined" label={a.plan_title} />}
                  {a.item_id && <Chip size="small" color="success" variant="outlined" label="Del presupuesto" />}
                </Stack>
                {a.notes && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, overflowWrap: "anywhere" }}>
                    {a.notes}
                  </Typography>
                )}
              </Box>
              <IconButton aria-label="Editar atención" onClick={() => setDialog({ attendance: a })}>
                <EditIcon />
              </IconButton>
              <IconButton aria-label="Eliminar atención" color="error" onClick={() => setRemoving(a)}>
                <DeleteIcon />
              </IconButton>
            </Stack>
          </Paper>
        </MotionStack>
      ))}
    </Stagger>
  );

  return (
    <Stack spacing={3}>
      {recordNumber !== undefined && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: "#f8fafc" }}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
                Historia clínica
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "primary.main" }}>
                N.º {formatRecordNumber(recordNumber)}
              </Typography>
            </Box>
            {legacyNumber && <Chip variant="outlined" label={`Historia anterior: ${legacyNumber}`} />}
          </Stack>
        </Paper>
      )}

      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Historial de atenciones
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ attendance: null })}>
          Registrar atención
        </Button>
      </Stack>

      {items && items.length > 0 && (
        <ToggleButtonGroup exclusive size="small" color="primary" value={view} onChange={(_, v) => v && setView(v)}>
          <ToggleButton value="plan" sx={{ px: 2, fontWeight: 600 }}>
            Por plan
          </ToggleButton>
          <ToggleButton value="time" sx={{ px: 2, fontWeight: 600 }}>
            Cronológico
          </ToggleButton>
        </ToggleButtonGroup>
      )}

      {error && <Alert severity="error">No se pudo cargar el historial.</Alert>}
      {items === null && !error && <Skeleton variant="rounded" height={200} />}
      {items?.length === 0 && (
        <Paper sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
          Aún no hay atenciones registradas para este paciente.
        </Paper>
      )}

      {items && items.length > 0 && view === "plan" && (
        <Stack spacing={3}>
          {groups.map((g) => (
            <Box key={g.key}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.5, flexWrap: "wrap" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {g.title}
                </Typography>
                <Chip size="small" label={`${g.items.length} ${g.items.length === 1 ? "atención" : "atenciones"}`} />
              </Stack>
              {timeline(g.items)}
            </Box>
          ))}
        </Stack>
      )}
      {items && items.length > 0 && view === "time" && timeline(items)}

      {dialog && (
        <AttendanceDialog
          key={dialog.attendance?.id ?? "new"}
          clientId={clientId}
          attendance={dialog.attendance}
          openItems={openItems}
          onClose={() => setDialog(null)}
          onSaved={load}
        />
      )}
      <ConfirmDialog
        open={removing !== null}
        title="¿Eliminar atención?"
        message={`Se eliminará "${removing?.procedure ?? ""}" del historial. Esta acción no se puede deshacer.`}
        pending={pending}
        onCancel={() => setRemoving(null)}
        onConfirm={() =>
          startTransition(async () => {
            if (removing) await deleteAttendance(removing.id);
            setRemoving(null);
            load();
          })
        }
      />
    </Stack>
  );
}
