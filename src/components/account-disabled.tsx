import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import LockIcon from "@mui/icons-material/LockOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import { logout } from "@/app/login/actions";

/** Shown to a signed-in user without an active staff account. */
export function AccountDisabled() {
  return (
    <Paper sx={{ p: { xs: 3, sm: 5 }, maxWidth: 480, mx: "auto", mt: { xs: 2, sm: 6 }, textAlign: "center" }}>
      <LockIcon color="action" sx={{ fontSize: 48, mb: 1 }} />
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
        Tu cuenta no está habilitada
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Tu cuenta no está habilitada, contacta al administrador.
      </Typography>
      <form action={logout}>
        <Button type="submit" variant="outlined" startIcon={<LogoutIcon />}>
          Cerrar sesión
        </Button>
      </form>
    </Paper>
  );
}
