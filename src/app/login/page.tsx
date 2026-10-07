"use client";

import { useActionState } from "react";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ContactsIcon from "@mui/icons-material/Contacts";
import GroupIcon from "@mui/icons-material/GroupOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import SearchIcon from "@mui/icons-material/Search";
import { login } from "./actions";

const features = [
  { icon: <GroupIcon />, text: "Todos tus clientes en un solo lugar" },
  { icon: <WhatsAppIcon />, text: "Escríbeles por WhatsApp con un clic" },
  { icon: <SearchIcon />, text: "Encuentra cualquier contacto al instante" },
];

export default function LoginPage() {
  const [error, action, pending] = useActionState(login, null);

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
      <Box sx={{ display: "grid", placeItems: "center", p: 3, bgcolor: "background.paper" }}>
        <Box component="form" action={action} sx={{ width: "100%", maxWidth: 360 }}>
          <Stack spacing={2.5}>
            <Avatar sx={{ bgcolor: "primary.main", width: 48, height: 48 }}>
              <ContactsIcon />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                Iniciar sesión
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Lumayo · Centro Odontológico
              </Typography>
            </Box>
            <TextField name="email" type="email" label="Correo" required fullWidth autoFocus />
            <TextField name="password" type="password" label="Contraseña" required fullWidth />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" size="large" disabled={pending}>
              {pending ? "Ingresando..." : "Ingresar"}
            </Button>
          </Stack>
        </Box>
      </Box>

      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          alignItems: "center",
          justifyContent: "center",
          p: 8,
          color: "common.white",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(160deg, #0b3c6e 0%, #082b52 60%, #0a4a82 100%)",
          "&::before, &::after": {
            content: '""',
            position: "absolute",
            borderRadius: "50%",
            border: "90px solid rgba(25,180,216,0.18)",
          },
          "&::before": { width: 560, height: 560, top: -240, right: -160 },
          "&::after": { width: 700, height: 700, bottom: -380, left: -220 },
        }}
      >
        <Box sx={{ position: "relative", maxWidth: 460 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.15 }}>
            Bienvenido a la agenda de Lumayo
          </Typography>
          <Typography sx={{ mt: 2, color: "rgba(255,255,255,0.65)" }}>
            Centro Odontológico. Organiza los datos de contacto de tus pacientes y encuéntralos rápido cuando los necesites.
          </Typography>
          <Stack spacing={2} sx={{ mt: 5 }}>
            {features.map((f) => (
              <Stack key={f.text} direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.1)", color: "#19b4d8", width: 36, height: 36 }}>
                  {f.icon}
                </Avatar>
                <Typography variant="body2">{f.text}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
