"use client";

import { useEffect, useState, useTransition } from "react";
import { useTheme } from "@mui/material/styles";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import useMediaQuery from "@mui/material/useMediaQuery";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { deleteAppointment, saveAppointment, searchClients } from "@/app/agenda/actions";
import {
  DURATIONS,
  STATUS,
  reminderUrl,
  toDateTimeLocal,
  type Appointment,
  type AppointmentStatus,
} from "@/lib/appointments";

type ClientOption = { id: string; first_name: string; last_name: string; mobile: string | null };

export type DialogState = { appointment?: Appointment; startsAt?: Date };

const label = (c: ClientOption) => `${c.first_name} ${c.last_name}`;

export function AppointmentDialog({
  state,
  onClose,
  onChanged,
}: {
  state: DialogState | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const appointment = state?.appointment;

  return (
    <Dialog open={state !== null} onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="sm">
      {/* Remount the form on every open so its state starts fresh. */}
      {state && (
        <AppointmentForm
          key={appointment?.id ?? state.startsAt?.getTime() ?? "new"}
          state={state}
          onClose={onClose}
          onChanged={onChanged}
        />
      )}
    </Dialog>
  );
}

function AppointmentForm({
  state,
  onClose,
  onChanged,
}: {
  state: DialogState;
  onClose: () => void;
  onChanged: () => void;
}) {
  const appointment = state.appointment;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [client, setClient] = useState<ClientOption | null>(
    appointment?.client
      ? { id: appointment.client_id, ...appointment.client }
      : null,
  );
  const [options, setOptions] = useState<ClientOption[]>(client ? [client] : []);
  const [input, setInput] = useState(client ? label(client) : "");
  const [startsAt, setStartsAt] = useState(
    toDateTimeLocal(appointment?.starts_at ?? state.startsAt ?? new Date()),
  );
  const [duration, setDuration] = useState(appointment?.duration_minutes ?? 30);
  const [reason, setReason] = useState(appointment?.reason ?? "");
  const [notes, setNotes] = useState(appointment?.notes ?? "");
  const [status, setStatus] = useState<AppointmentStatus>(appointment?.status ?? "scheduled");

  // Debounced client search.
  useEffect(() => {
    if (client && input === label(client)) return;
    const timer = setTimeout(() => {
      searchClients(input)
        .then((rows) => setOptions(rows))
        .catch(() => setOptions([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [input, client]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!client) return setError("Selecciona un paciente.");
    const date = new Date(startsAt);
    if (Number.isNaN(date.getTime())) return setError("La fecha y hora no son válidas.");
    setError(null);
    startTransition(async () => {
      const res = await saveAppointment({
        id: appointment?.id,
        client_id: client.id,
        starts_at: date.toISOString(),
        duration_minutes: duration,
        reason,
        notes,
        status,
      });
      if (res.error) return setError(res.error);
      onChanged();
      onClose();
    });
  }

  function remove() {
    if (!appointment) return;
    startTransition(async () => {
      await deleteAppointment(appointment.id);
      onChanged();
      onClose();
    });
  }

  const reminder = appointment ? reminderUrl(appointment) : null;

  return (
    <form onSubmit={submit} style={{ display: "contents" }}>
      <DialogTitle>{appointment ? "Editar cita" : "Nueva cita"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Autocomplete
            options={options}
            value={client}
            inputValue={input}
            onInputChange={(_, v) => setInput(v)}
            onChange={(_, v) => setClient(v)}
            getOptionLabel={label}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            filterOptions={(x) => x}
            noOptionsText="Sin resultados"
            renderOption={(props, o) => {
              const { key, ...rest } = props;
              return (
                <li key={key} {...rest}>
                  {label(o)}
                  {o.mobile ? ` · ${o.mobile}` : ""}
                </li>
              );
            }}
            renderInput={(params) => <TextField {...params} label="Paciente" required />}
          />
          <TextField
            label="Fecha y hora"
            type="datetime-local"
            required
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Stack direction="row" spacing={2}>
            <TextField select label="Duración" value={duration} onChange={(e) => setDuration(Number(e.target.value))} fullWidth>
              {DURATIONS.map((d) => (
                <MenuItem key={d} value={d}>
                  {d} min
                </MenuItem>
              ))}
            </TextField>
            <TextField select label="Estado" value={status} onChange={(e) => setStatus(e.target.value as AppointmentStatus)} fullWidth>
              {Object.entries(STATUS).map(([value, s]) => (
                <MenuItem key={value} value={value}>
                  {s.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <TextField label="Motivo o tratamiento" value={reason} onChange={(e) => setReason(e.target.value)} />
          <TextField label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={3} />
          {reminder && (
            <Button href={reminder} target="_blank" rel="noreferrer" startIcon={<WhatsAppIcon />} sx={{ color: "#128c7e" }}>
              Recordar por WhatsApp
            </Button>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, flexWrap: "wrap", gap: 1 }}>
        {appointment && (
          <Button color="error" onClick={() => setConfirmDelete(true)} disabled={pending} sx={{ mr: "auto" }}>
            Eliminar
          </Button>
        )}
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button type="submit" variant="contained" disabled={pending}>
          {pending ? "Guardando..." : "Guardar"}
        </Button>
      </DialogActions>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>¿Eliminar cita?</DialogTitle>
        <DialogContent>
          <DialogContentText>La cita se eliminará de forma permanente. Esta acción no se puede deshacer.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={remove} disabled={pending}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </form>
  );
}
