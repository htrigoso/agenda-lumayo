"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { saveClient } from "@/app/(app)/clients/actions";

export type Client = {
  id: string;
  first_name: string;
  last_name: string;
  mobile: string | null;
  whatsapp: string | null;
  email: string | null;
  description: string | null;
  is_priority: boolean;
  record_number?: number;
  dni?: string | null;
  birth_date?: string | null;
  sex?: "M" | "F" | null;
  address?: string | null;
  occupation?: string | null;
  emergency_contact?: string | null;
  legacy_record_number?: string | null;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <Grid size={12}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1, mt: 1 }}>
          {title}
        </Typography>
      </Grid>
      {children}
    </>
  );
}

export function ClientForm({ client }: { client?: Client }) {
  const [mobile, setMobile] = useState(client?.mobile ?? "");
  const [whatsapp, setWhatsapp] = useState(client?.whatsapp ?? "");
  // New patients start with the shortcut on; existing ones only if both numbers already match.
  const [sameNumber, setSameNumber] = useState(client ? !!client.mobile && client.mobile === client.whatsapp : true);

  return (
    <Paper component="form" action={saveClient.bind(null, client?.id ?? null)} sx={{ p: { xs: 2, sm: 3 }, maxWidth: 820 }}>
      <Grid container spacing={2}>
        <Section title="Datos personales">
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField name="first_name" label="Nombres" required fullWidth defaultValue={client?.first_name} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField name="last_name" label="Apellidos" required fullWidth defaultValue={client?.last_name} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField name="dni" label="DNI" fullWidth defaultValue={client?.dni ?? ""} slotProps={{ htmlInput: { inputMode: "numeric" } }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              name="birth_date"
              label="Fecha de nacimiento"
              type="date"
              fullWidth
              defaultValue={client?.birth_date ?? ""}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField name="sex" label="Sexo" select fullWidth defaultValue={client?.sex ?? ""}>
              <MenuItem value="">—</MenuItem>
              <MenuItem value="M">Masculino</MenuItem>
              <MenuItem value="F">Femenino</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField name="occupation" label="Ocupación" fullWidth defaultValue={client?.occupation ?? ""} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField name="address" label="Dirección" fullWidth defaultValue={client?.address ?? ""} />
          </Grid>
        </Section>

        <Section title="Contacto">
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="mobile"
              label="Celular"
              type="tel"
              fullWidth
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            {/* A disabled field is not submitted, so the mirrored number travels in a hidden input. */}
            {sameNumber && <input type="hidden" name="whatsapp" value={mobile} />}
            <TextField
              name={sameNumber ? undefined : "whatsapp"}
              label="WhatsApp"
              type="tel"
              fullWidth
              disabled={sameNumber}
              value={sameNumber ? mobile : whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </Grid>
          <Grid size={12} sx={{ mt: -1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={sameNumber}
                  onChange={(e) => {
                    setSameNumber(e.target.checked);
                    // Unchecking keeps the number as a starting point instead of clearing the field.
                    if (!e.target.checked && !whatsapp) setWhatsapp(mobile);
                  }}
                />
              }
              label="Este número también es su WhatsApp"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField name="email" label="Correo" type="email" fullWidth defaultValue={client?.email ?? ""} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField name="emergency_contact" label="En caso de emergencia comunicar a" fullWidth defaultValue={client?.emergency_contact ?? ""} />
          </Grid>
        </Section>

        <Section title="Otros">
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="legacy_record_number"
              label="N.º de historia clínica anterior"
              fullWidth
              defaultValue={client?.legacy_record_number ?? ""}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex", alignItems: "center" }}>
            <FormControlLabel
              control={<Switch name="is_priority" defaultChecked={client?.is_priority ?? false} color="warning" />}
              label="Paciente potencial (prioridad alta)"
            />
          </Grid>
          <Grid size={12}>
            <TextField name="description" label="Notas" multiline minRows={3} fullWidth defaultValue={client?.description ?? ""} />
          </Grid>
        </Section>
      </Grid>
      <Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={1} sx={{ justifyContent: "flex-end", mt: 3 }}>
        <Button href="/" color="inherit">
          Cancelar
        </Button>
        <Button type="submit" variant="contained">
          Guardar paciente
        </Button>
      </Stack>
    </Paper>
  );
}
