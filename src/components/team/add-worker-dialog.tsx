"use client";

import { startTransition, useActionState, useEffect } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { createWorker, type CreateWorkerState } from "@/app/(app)/equipo/actions";
import { MIN_PASSWORD_LENGTH, ROLE_LABELS } from "@/lib/team";

/** Mounted only while open, so every opening starts with an empty form and no stale error. */
function AddWorkerForm({ onClose }: { onClose: () => void }) {
  const [state, action, pending] = useActionState<CreateWorkerState, FormData>(createWorker, null);

  useEffect(() => {
    if (state && "ok" in state) onClose();
  }, [state, onClose]);

  return (
    <form
      // Submitting manually keeps the typed values when the server returns an error (a form action would reset them).
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {state && "error" in state && <Alert severity="error">{state.error}</Alert>}
          <TextField name="full_name" label="Nombre" required autoFocus fullWidth />
          <TextField name="email" type="email" label="Correo" required fullWidth autoComplete="off" />
          <TextField
            name="password"
            type="text"
            label="Contraseña temporal"
            required
            fullWidth
            autoComplete="new-password"
            helperText={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres. Compártela con el trabajador.`}
            slotProps={{ htmlInput: { minLength: MIN_PASSWORD_LENGTH } }}
          />
          <TextField name="role" select label="Rol" defaultValue="worker" fullWidth>
            {Object.entries(ROLE_LABELS).map(([key, label]) => (
              <MenuItem key={key} value={key}>
                {label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={pending}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={pending}
          startIcon={pending ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {pending ? "Creando..." : "Crear cuenta"}
        </Button>
      </DialogActions>
    </form>
  );
}

export function AddWorkerDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Agregar trabajador</DialogTitle>
      {open && <AddWorkerForm onClose={onClose} />}
    </Dialog>
  );
}
