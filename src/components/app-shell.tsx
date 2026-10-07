"use client";

import { Suspense, useState } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import Avatar from "@mui/material/Avatar";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import CalendarIcon from "@mui/icons-material/CalendarMonthOutlined";
import ContactsIcon from "@mui/icons-material/Contacts";
import BarChartIcon from "@mui/icons-material/BarChartOutlined";
import MedicalServicesIcon from "@mui/icons-material/MedicalServicesOutlined";
import GroupIcon from "@mui/icons-material/GroupOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import { motion } from "framer-motion";
import { logout } from "@/app/login/actions";
import { EASE, MotionBox } from "@/components/motion";

const DRAWER_WIDTH = 240;

const NAV = [
  { href: "/", label: "Pacientes", icon: <GroupIcon />, match: (p: string) => p === "/" || p.startsWith("/clients") },
  { href: "/servicios", label: "Servicios", icon: <MedicalServicesIcon />, match: (p: string) => p.startsWith("/servicios") },
  { href: "/agenda", label: "Agenda", icon: <CalendarIcon />, match: (p: string) => p.startsWith("/agenda") },
  { href: "/reportes", label: "Reportes", icon: <BarChartIcon />, match: (p: string) => p.startsWith("/reportes") },
];

const WIDE_ROUTES = ["/agenda", "/reportes"];

function PageArea({ children, wide, animate }: { children: React.ReactNode; wide: boolean; animate: boolean }) {
  return (
    <Container maxWidth={wide ? "xl" : "lg"} sx={{ py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
      {animate ? (
        <MotionBox initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE }}>
          {children}
        </MotionBox>
      ) : (
        children
      )}
    </Container>
  );
}

/** Keyed by pathname so each navigation replays the entrance; the sidebar around it never remounts. */
function PageAreaWithPath({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const wide = WIDE_ROUTES.some((r) => pathname.startsWith(r));
  return (
    <PageArea key={pathname} wide={wide} animate>
      {children}
    </PageArea>
  );
}

function NavList({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  return (
    <List sx={{ p: 1.5 }}>
      {NAV.map((item) => (
        <ListItemButton
          key={item.href}
          component={NextLink}
          href={item.href}
          selected={item.match(pathname)}
          onClick={onNavigate}
          sx={{
            borderRadius: 2,
            mb: 0.75,
            py: 1.1,
            color: "rgba(255,255,255,0.78)",
            "&:hover": { bgcolor: "rgba(255,255,255,0.08)", color: "#fff" },
            position: "relative",
            "&.Mui-selected, &.Mui-selected:hover": { bgcolor: "transparent", color: "#fff" },
            "&.Mui-selected .MuiListItemIcon-root": { color: "#19b4d8" },
          }}
        >
          {item.match(pathname) && (
            // Shared layoutId: the highlight glides from the previous item to this one.
            <motion.span
              layoutId="nav-pill"
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 8,
                background: "rgba(25,180,216,0.2)",
                boxShadow: "inset 3px 0 0 #19b4d8",
              }}
            />
          )}
          <motion.span
            whileHover={{ x: 4 }}
            transition={{ type: "spring", stiffness: 400, damping: 24 }}
            style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
          </motion.span>
        </ListItemButton>
      ))}
    </List>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const menu = (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        color: "#fff",
        background: "linear-gradient(170deg, #0b3c6e 0%, #082b52 65%, #06213f 100%)",
        "&::before": {
          content: '""',
          position: "absolute",
          width: 260,
          height: 260,
          borderRadius: "50%",
          border: "46px solid rgba(25,180,216,0.14)",
          bottom: -90,
          left: -110,
          pointerEvents: "none",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2.5, py: 3 }}>
        <Avatar sx={{ bgcolor: "#19b4d8", color: "#fff", width: 42, height: 42, boxShadow: "0 4px 12px rgba(25,180,216,0.45)" }}>
          <ContactsIcon />
        </Avatar>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 20, lineHeight: 1.1, letterSpacing: 0.5 }}>Lumayo</Typography>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.65)", letterSpacing: 1.2, textTransform: "uppercase", fontSize: 10 }}>
            Centro Odontológico
          </Typography>
        </Box>
      </Box>
      <Typography variant="overline" sx={{ px: 2.5, color: "rgba(255,255,255,0.5)", letterSpacing: 1.5 }}>
        Menú
      </Typography>
      <Suspense fallback={null}>
        <NavList onNavigate={() => setOpen(false)} />
      </Suspense>
      <Box sx={{ flexGrow: 1 }} />
      <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />
      <Box component="form" action={logout} sx={{ p: 1.5, position: "relative" }}>
        <Button
          type="submit"
          fullWidth
          startIcon={<LogoutIcon />}
          sx={{ justifyContent: "flex-start", color: "rgba(255,255,255,0.78)", py: 1, "&:hover": { bgcolor: "rgba(255,255,255,0.08)", color: "#fff" } }}
        >
          Cerrar sesión
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ minHeight: "100vh", display: "flex" }}>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box", border: 0 },
        }}
        open
      >
        {menu}
      </Drawer>
      <Drawer
        variant="temporary"
        open={open}
        onClose={() => setOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box", border: 0 },
        }}
      >
        {menu}
      </Drawer>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            display: { md: "none" },
            background: "linear-gradient(90deg, #0b3c6e 0%, #082b52 100%)",
            color: "#fff",
          }}
        >
          <Toolbar>
            <IconButton edge="start" color="inherit" aria-label="Abrir menú" onClick={() => setOpen(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Lumayo
            </Typography>
          </Toolbar>
        </AppBar>
        <Suspense fallback={<PageArea wide={false} animate={false}>{children}</PageArea>}>
          <PageAreaWithPath>{children}</PageAreaWithPath>
        </Suspense>
      </Box>
    </Box>
  );
}
