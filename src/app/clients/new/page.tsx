import Typography from "@mui/material/Typography";
import { AppShell } from "@/components/app-shell";
import { ClientForm } from "@/components/client-form";

export default function NewClientPage() {
  return (
    <AppShell>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Nuevo paciente
      </Typography>
      <ClientForm />
    </AppShell>
  );
}
