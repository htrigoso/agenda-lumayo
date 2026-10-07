import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import { saveClient } from "@/app/clients/actions";

export type Client = {
  id: string;
  first_name: string;
  last_name: string;
  mobile: string | null;
  whatsapp: string | null;
  email: string | null;
  description: string | null;
};

export function ClientForm({ client }: { client?: Client }) {
  return (
    <Paper component="form" action={saveClient.bind(null, client?.id ?? null)} sx={{ p: 3, maxWidth: 720 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField name="first_name" label="Nombres" required fullWidth defaultValue={client?.first_name} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField name="last_name" label="Apellidos" required fullWidth defaultValue={client?.last_name} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField name="mobile" label="Celular" type="tel" fullWidth defaultValue={client?.mobile ?? ""} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField name="whatsapp" label="WhatsApp" type="tel" fullWidth defaultValue={client?.whatsapp ?? ""} />
        </Grid>
        <Grid size={12}>
          <TextField name="email" label="Correo" type="email" fullWidth defaultValue={client?.email ?? ""} />
        </Grid>
        <Grid size={12}>
          <TextField name="description" label="Descripción" multiline minRows={4} fullWidth defaultValue={client?.description ?? ""} />
        </Grid>
      </Grid>
      <Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={1} sx={{ justifyContent: "flex-end", mt: 3 }}>
        <Button href="/" color="inherit">
          Cancel
        </Button>
        <Button type="submit" variant="contained">
          Guardar cliente
        </Button>
      </Stack>
    </Paper>
  );
}
