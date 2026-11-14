"use client";

import { useState, useTransition } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import PersonAddIcon from "@mui/icons-material/PersonAddOutlined";
import { setStaffActive, setStaffRole, type StaffMember } from "@/app/(app)/equipo/actions";
import { AddWorkerDialog } from "@/components/team/add-worker-dialog";
import { ROLE_LABELS } from "@/lib/team";

type Props = { members: StaffMember[]; currentUserId: string; canCreate: boolean };

function MemberRow({ member, isMe, onError }: { member: StaffMember; isMe: boolean; onError: (msg: string) => void }) {
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      try {
        await action();
      } catch (e) {
        onError(e instanceof Error ? e.message : "No se pudo guardar el cambio.");
      }
    });
  }

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={{ xs: 1, sm: 2 }}
      sx={{ alignItems: { sm: "center" }, py: 1.5, px: 2, opacity: pending ? 0.6 : 1 }}
      aria-busy={pending}
    >
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography sx={{ fontWeight: 600 }}>{member.fullName}</Typography>
          {isMe && <Chip size="small" label="Tú" />}
          {!member.active && <Chip size="small" color="error" variant="outlined" label="Inactivo" />}
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
          {member.email ?? "Correo no disponible"}
        </Typography>
      </Box>
      <TextField
        select
        size="small"
        label="Rol"
        value={member.role}
        disabled={pending || isMe}
        onChange={(e) => run(() => setStaffRole(member.userId, e.target.value))}
        helperText={isMe ? "No puedes cambiar tu propio rol" : undefined}
        sx={{ minWidth: 170 }}
      >
        {Object.entries(ROLE_LABELS).map(([key, label]) => (
          <MenuItem key={key} value={key}>
            {label}
          </MenuItem>
        ))}
      </TextField>
      <Stack direction="row" sx={{ alignItems: "center", minWidth: 120 }}>
        <Switch
          checked={member.active}
          disabled={pending || isMe}
          onChange={(e) => run(() => setStaffActive(member.userId, e.target.checked))}
          slotProps={{ input: { "aria-label": `Cuenta activa de ${member.fullName}` } }}
        />
        <Typography variant="body2">{member.active ? "Activo" : "Inactivo"}</Typography>
      </Stack>
    </Stack>
  );
}

export function TeamManager({ members, currentUserId, canCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => setOpen(true)} disabled={!canCreate}>
          Agregar trabajador
        </Button>
      </Stack>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Paper>
        {members.length === 0 && (
          <Typography color="text.secondary" sx={{ p: 4, textAlign: "center" }}>
            Aún no hay personal registrado.
          </Typography>
        )}
        {members.map((m, i) => (
          <Box key={m.userId} sx={{ borderTop: i === 0 ? 0 : 1, borderColor: "divider" }}>
            <MemberRow member={m} isMe={m.userId === currentUserId} onError={setError} />
          </Box>
        ))}
      </Paper>
      <AddWorkerDialog open={open} onClose={() => setOpen(false)} />
    </Stack>
  );
}
