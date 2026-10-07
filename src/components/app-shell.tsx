import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import ContactsIcon from "@mui/icons-material/Contacts";
import LogoutIcon from "@mui/icons-material/Logout";
import { logout } from "@/app/login/actions";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: "100vh" }}>
      <AppBar position="sticky" elevation={0} color="inherit" sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar>
          <ContactsIcon color="primary" sx={{ mr: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1 }}>
            Lumayo · Agenda de Clientes
          </Typography>
          <form action={logout}>
            <Button type="submit" color="inherit" startIcon={<LogoutIcon />}>
              Cerrar sesión
            </Button>
          </form>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
}
