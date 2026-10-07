"use client";

import { useState, useTransition } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import { deleteClient } from "@/app/clients/actions";

export function DeleteClientButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Tooltip title="Eliminar">
        <IconButton color="error" onClick={() => setOpen(true)}>
          <DeleteIcon />
        </IconButton>
      </Tooltip>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>¿Eliminar cliente?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {name} se eliminará de forma permanente. Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            color="error"
            variant="contained"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await deleteClient(id);
                setOpen(false);
              })
            }
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
