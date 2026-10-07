import Typography from "@mui/material/Typography";
import { ClientForm } from "@/components/client-form";

export default function NewClientPage() {
  return (
    <>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Nuevo paciente
      </Typography>
      <ClientForm />
    </>
  );
}
