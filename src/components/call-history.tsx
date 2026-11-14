"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import { alpha } from "@mui/material/styles";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import EventIcon from "@mui/icons-material/EventOutlined";
import PersonIcon from "@mui/icons-material/PersonOutlined";
import { type CallLog, deleteCall } from "@/app/(app)/clients/actions";
import { CallLogDialog } from "@/components/call-log-dialog";
import { formatCallWhen, formatDay, groupCallsByMonth, outcomeLabel, outcomeOption } from "@/lib/calls";

type Props = {
  clientId: string;
  name: string;
  mobile: string | null;
  whatsapp: string | null;
  calls: CallLog[];
  /** Only admins may delete history entries. */
  isAdmin: boolean;
  /** Lima calendar day (YYYY-MM-DD), computed on the server. */
  today: string;
};

/** Trash button with a confirmation dialog for one history entry. */
function DeleteCallButton({ call }: { call: CallLog }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      try {
        await deleteCall(call.id);
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo eliminar la llamada.");
      }
    });
  }

  return (
    <>
      <Tooltip title="Eliminar del historial">
        <IconButton
          size="small"
          aria-label="Eliminar llamada"
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
          sx={{ ml: "auto" }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Dialog open={open} onClose={() => !pending && setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>¿Eliminar esta llamada?</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5}>
            <Typography variant="body2">
              {outcomeLabel(call.outcome)} · {formatCallWhen(call.created_at)}
              {call.staff_name && ` · ${call.staff_name}`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Se borrará del historial y no se puede deshacer.
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={remove}
            disabled={pending}
            startIcon={pending ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {pending ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const RAIL = 24;

function CallEntry({ call, isAdmin, today }: { call: CallLog; isAdmin: boolean; today: string }) {
  const color = outcomeOption(call.outcome)?.color ?? "default";
  return (
    <Box sx={{ position: "relative", pl: `${RAIL + 8}px`, pb: 2 }}>
      {/* Dot on the vertical rail, colored like the outcome. */}
      <Box
        sx={{
          position: "absolute",
          left: RAIL / 2 - 6,
          top: 4,
          width: 12,
          height: 12,
          borderRadius: "50%",
          bgcolor: color === "default" ? "grey.500" : `${color}.main`,
          border: 2,
          borderColor: "background.paper",
          boxShadow: 1,
        }}
      />
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 0.75 }}>
        <Chip size="small" color={outcomeOption(call.outcome)?.color ?? "default"} label={outcomeLabel(call.outcome)} sx={{ fontWeight: 600 }} />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {formatCallWhen(call.created_at, today)}
        </Typography>
        {call.staff_name && (
          <Chip
            size="small"
            icon={<PersonIcon />}
            label={call.staff_name}
            sx={{ fontWeight: 600, bgcolor: (t) => alpha(t.palette.primary.main, 0.1), color: "primary.main", "& .MuiChip-icon": { color: "primary.main" } }}
          />
        )}
        {call.follow_up_on && (
          <Chip size="small" variant="outlined" icon={<EventIcon />} label={`Volver a llamar el ${formatDay(call.follow_up_on)}`} />
        )}
        {isAdmin && <DeleteCallButton call={call} />}
      </Stack>
      {call.notes && (
        <Typography variant="body2" sx={{ mt: 0.75, whiteSpace: "pre-wrap" }}>
          {call.notes}
        </Typography>
      )}
    </Box>
  );
}

/** "Llamadas" tab of the patient file: a monthly timeline, newest call first, plus a button to log a new one. */
export function CallHistory({ clientId, name, mobile, whatsapp, calls, isAdmin, today }: Props) {
  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Historial de llamadas
        </Typography>
        <CallLogDialog variant="button" clientId={clientId} name={name} mobile={mobile} whatsapp={whatsapp} />
      </Stack>
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        {calls.length === 0 ? (
          <Typography color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
            Aún no hay llamadas registradas con este paciente.
          </Typography>
        ) : (
          // Vertical timeline on the left, grouped by month, newest first.
          groupCallsByMonth(calls).map((month) => (
            <Box key={month.key} sx={{ position: "relative" }}>
              <Typography
                variant="overline"
                color="primary"
                sx={{ display: "block", fontWeight: 700, lineHeight: 2, pl: `${RAIL + 8}px`, mb: 1 }}
              >
                {month.label} · {month.calls.length} {month.calls.length === 1 ? "llamada" : "llamadas"}
              </Typography>
              <Box
                sx={{
                  position: "relative",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: RAIL / 2 - 1,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    bgcolor: "divider",
                  },
                }}
              >
                {month.calls.map((c) => (
                  <CallEntry key={c.id} call={c} isAdmin={isAdmin} today={today} />
                ))}
              </Box>
            </Box>
          ))
        )}
      </Paper>
    </Stack>
  );
}
