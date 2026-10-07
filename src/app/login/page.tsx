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
import Image from "next/image";
import { motion } from "framer-motion";
import { EASE, MotionBox, MotionStack, StaggerItem, containerVariants } from "@/components/motion";
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
          <MotionStack variants={containerVariants} initial="hidden" animate="show" spacing={2.5}>
            <StaggerItem>
              <motion.div
                initial={{ scale: 0.4, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 16 }}
                style={{ width: 48 }}
              >
                <Avatar sx={{ bgcolor: "primary.main", width: 48, height: 48 }}>
                  <ContactsIcon />
                </Avatar>
              </motion.div>
            </StaggerItem>
            <StaggerItem>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                Iniciar sesión
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Lumayo · Centro Odontológico
              </Typography>
            </Box>
            </StaggerItem>
            <StaggerItem>
              <TextField name="email" type="email" label="Correo" required fullWidth autoFocus />
            </StaggerItem>
            <StaggerItem>
              <TextField name="password" type="password" label="Contraseña" required fullWidth />
            </StaggerItem>
            {error && (
              <motion.div initial={{ x: 0 }} animate={{ x: [0, -8, 8, -6, 6, 0] }} transition={{ duration: 0.4 }}>
                <Alert severity="error">{error}</Alert>
              </motion.div>
            )}
            <StaggerItem>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Button type="submit" variant="contained" size="large" disabled={pending} fullWidth>
                  {pending ? "Ingresando..." : "Ingresar"}
                </Button>
              </motion.div>
            </StaggerItem>
          </MotionStack>
        </Box>
      </Box>

      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          alignItems: "flex-end",
          justifyContent: "flex-start",
          p: { md: 5, lg: 7 },
          color: "common.white",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(160deg, #0b3c6e 0%, #082b52 60%, #0a4a82 100%)",
          "&::before, &::after": {
            content: '""',
            position: "absolute",
            borderRadius: "50%",
            border: "90px solid rgba(25,180,216,0.18)",
            zIndex: 1,
            pointerEvents: "none",
          },
          "&::before": { width: 560, height: 560, top: -240, right: -160 },
          "&::after": { width: 700, height: 700, bottom: -380, left: -220 },
        }}
      >
        {/* Photo (slow zoom-out on load) under a brand-blue veil that deepens toward the text. */}
        <MotionBox
          aria-hidden
          initial={{ scale: 1.14 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.2, ease: EASE }}
          sx={{ position: "absolute", inset: 0, zIndex: 0 }}
        >
          <Image
            src="/images/login-dentists.jpg"
            alt=""
            fill
            sizes="50vw"
            style={{ objectFit: "cover", objectPosition: "50% 30%" }}
          />
        </MotionBox>
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            background:
              "linear-gradient(180deg, rgba(11,60,110,0.45) 0%, rgba(8,43,82,0.35) 30%, rgba(8,43,82,0.82) 68%, rgba(6,33,63,0.96) 100%)",
          }}
        />
        <motion.div
          aria-hidden
          animate={{ y: [0, -22, 0], x: [0, 10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "absolute", zIndex: 1, top: "14%", right: "10%", width: 90, height: 90, borderRadius: "50%", background: "rgba(25,180,216,0.28)", filter: "blur(2px)" }}
        />
        <motion.div
          aria-hidden
          animate={{ y: [0, 26, 0], x: [0, -14, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "absolute", zIndex: 1, top: "38%", left: "8%", width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.14)" }}
        />
        <MotionBox
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
          sx={{ position: "relative", zIndex: 2, maxWidth: 480 }}
        >
          <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.15 }}>
            Bienvenido a la agenda de Lumayo
          </Typography>
          <Typography sx={{ mt: 2, color: "rgba(255,255,255,0.65)" }}>
            Centro Odontológico. Organiza los datos de contacto de tus pacientes y encuéntralos rápido cuando los necesites.
          </Typography>
          <Stack spacing={1.5} sx={{ mt: 4 }}>
            {features.map((f, i) => (
              <MotionStack
                key={f.text}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: EASE, delay: 0.45 + i * 0.12 }}
                direction="row"
                spacing={1.5}
                sx={{
                  alignItems: "center",
                  px: 1.5,
                  py: 1,
                  borderRadius: 3,
                  bgcolor: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <Avatar sx={{ bgcolor: "rgba(255,255,255,0.1)", color: "#19b4d8", width: 36, height: 36 }}>
                  {f.icon}
                </Avatar>
                <Typography variant="body2">{f.text}</Typography>
              </MotionStack>
            ))}
          </Stack>
        </MotionBox>
      </Box>
    </Box>
  );
}
