import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
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
            Lumayo<Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}> · Agenda de Clientes</Box>
          </Typography>
          <form action={logout}>
            <Button type="submit" color="inherit" startIcon={<LogoutIcon />} sx={{ display: { xs: "none", sm: "inline-flex" } }}>
              Cerrar sesión
            </Button>
            <IconButton type="submit" color="inherit" aria-label="Cerrar sesión" sx={{ display: { xs: "inline-flex", sm: "none" } }}>
              <LogoutIcon />
            </IconButton>
          </form>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
        {children}
      </Container>
    </Box>
  );
}
