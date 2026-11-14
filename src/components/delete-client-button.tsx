"use client";

import { useState, useTransition } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import { deleteClient } from "@/app/(app)/clients/actions";

/** Word the user must type to enable the delete button (GitHub/Vercel-style safeguard). */
const CONFIRM_WORD = "eliminar";

export function DeleteClientButton({ id, name, onDeleted }: { id: string; name: string; onDeleted?: () => void }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, startTransition] = useTransition();
  const confirmed = typed.trim().toLowerCase() === CONFIRM_WORD;

  function close() {
    if (pending) return;
    setOpen(false);
    setTyped("");
  }

  function remove() {
    if (!confirmed || pending) return;
    startTransition(async () => {
      await deleteClient(id);
      onDeleted?.();
      setOpen(false);
      setTyped("");
    });
  }

  return (
    <>
      <Tooltip title="Eliminar">
        <IconButton color="error" onClick={() => setOpen(true)}>
          <DeleteIcon />
        </IconButton>
      </Tooltip>
      <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
        <DialogTitle>¿Eliminar paciente?</DialogTitle>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            remove();
          }}
        >
          <DialogContent sx={{ pt: 0 }}>
            <DialogContentText sx={{ mb: 2 }}>
              <strong>{name}</strong> se eliminará de forma permanente. Esta acción no se puede deshacer.
            </DialogContentText>
            <DialogContentText sx={{ mb: 1 }}>
              Para confirmar, escribe <strong>{CONFIRM_WORD}</strong> a continuación:
            </DialogContentText>
            <TextField
              autoFocus
              fullWidth
              size="small"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={CONFIRM_WORD}
              autoComplete="off"
              slotProps={{ htmlInput: { "aria-label": `Escribe ${CONFIRM_WORD} para confirmar` } }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={close} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" color="error" variant="contained" disabled={!confirmed || pending}>
              {pending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
