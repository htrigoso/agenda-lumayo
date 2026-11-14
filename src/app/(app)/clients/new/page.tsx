import Typography from "@mui/material/Typography";
import { ClientForm } from "@/components/client-form";
import { requireAdmin } from "@/lib/staff";

export default async function NewClientPage() {
  await requireAdmin();
  return (
    <>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Nuevo paciente
      </Typography>
      <ClientForm />
    </>
  );
}
