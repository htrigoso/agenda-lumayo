"use client";

import { Suspense, use, useState } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
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
import CardMembershipIcon from "@mui/icons-material/CardMembershipOutlined";
import GroupIcon from "@mui/icons-material/GroupOutlined";
import BadgeIcon from "@mui/icons-material/BadgeOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import { motion } from "framer-motion";
import { logout } from "@/app/login/actions";
import { EASE, MotionBox } from "@/components/motion";
import { AQUA, AZUL } from "@/lib/brand";
import type { CurrentStaff } from "@/lib/staff";
import { ROLE_LABELS } from "@/lib/team";

const DRAWER_WIDTH = 240;

type NavEntry = { href: string; label: string; icon: React.ReactNode; match: (p: string) => boolean };

const NAV: NavEntry[] = [
  { href: "/", label: "Pacientes", icon: <GroupIcon />, match: (p: string) => p === "/" || p.startsWith("/clients") },
];

function PageArea({ children, animate }: { children: React.ReactNode; animate: boolean }) {
  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
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
  return (
    <PageArea key={pathname} animate>
      {children}
    </PageArea>
  );
}

const ADMIN_NAV: NavEntry[] = [
  { href: "/membresias", label: "Membresías", icon: <CardMembershipIcon />, match: (p: string) => p.startsWith("/membresias") },
  { href: "/equipo", label: "Equipo", icon: <BadgeIcon />, match: (p: string) => p.startsWith("/equipo") },
];

function NavItem({ item, onNavigate }: { item: NavEntry; onNavigate: () => void }) {
  const pathname = usePathname();
  const selected = item.match(pathname);
  return (
    <ListItemButton
      component={NextLink}
      href={item.href}
      selected={selected}
      onClick={onNavigate}
      sx={{
        borderRadius: 2,
        mb: 0.75,
        py: 1.1,
        color: "rgba(255,255,255,0.78)",
        "&:hover": { bgcolor: "rgba(255,255,255,0.08)", color: "#fff" },
        position: "relative",
        "&.Mui-selected, &.Mui-selected:hover": { bgcolor: "transparent", color: "#fff" },
        "&.Mui-selected .MuiListItemIcon-root": { color: AQUA[300] },
      }}
    >
      {selected && (
        // Shared layoutId: the highlight glides from the previous item to this one.
        <motion.span
          layoutId="nav-pill"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 8,
            background: "rgba(97,214,215,0.2)",
            boxShadow: `inset 3px 0 0 ${AQUA[300]}`,
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
  );
}

/** Admin-only entries appear once the staff lookup resolves. */
function AdminNav({ staff, onNavigate }: { staff: Promise<CurrentStaff | null>; onNavigate: () => void }) {
  const current = use(staff);
  if (current?.role !== "admin") return null;
  return ADMIN_NAV.map((item) => <NavItem key={item.href} item={item} onNavigate={onNavigate} />);
}

function NavList({ staff, onNavigate }: { staff: Promise<CurrentStaff | null>; onNavigate: () => void }) {
  return (
    <List sx={{ p: 1.5 }}>
      {NAV.map((item) => (
        <NavItem key={item.href} item={item} onNavigate={onNavigate} />
      ))}
      <Suspense fallback={null}>
        <AdminNav staff={staff} onNavigate={onNavigate} />
      </Suspense>
    </List>
  );
}

function StaffName({ staff }: { staff: Promise<CurrentStaff | null> }) {
  const current = use(staff);
  if (!current) return null;
  return (
    <Box sx={{ px: 2.5, pt: 1.5, position: "relative" }}>
      <Typography sx={{ fontWeight: 600, lineHeight: 1.3, overflowWrap: "anywhere" }}>{current.fullName}</Typography>
      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
        {ROLE_LABELS[current.role]}
      </Typography>
    </Box>
  );
}

export function AppShell({ children, staff }: { children: React.ReactNode; staff: Promise<CurrentStaff | null> }) {
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
        background: `linear-gradient(170deg, ${AZUL[700]} 0%, ${AZUL[800]} 100%)`,
        "&::before": {
          content: '""',
          position: "absolute",
          width: 260,
          height: 260,
          borderRadius: "50%",
          border: "46px solid rgba(97,214,215,0.14)",
          bottom: -90,
          left: -110,
          pointerEvents: "none",
        },
      }}
    >
      <Box sx={{ px: 2.5, py: 3 }}>
        {/* Firma con descriptor: primer contacto (Brandbook V2, pág. 5). */}
        <Box component="img" src="/lumayo+centro-white.svg" alt="Lumayo Centro Odontológico" sx={{ display: "block", width: 170, height: "auto" }} />
      </Box>
      <Typography variant="overline" sx={{ px: 2.5, color: "rgba(255,255,255,0.5)", letterSpacing: 1.5, fontWeight: 500 }}>
        Menú
      </Typography>
      <Suspense fallback={null}>
        <NavList staff={staff} onNavigate={() => setOpen(false)} />
      </Suspense>
      <Box sx={{ flexGrow: 1 }} />
      <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />
      <Suspense fallback={null}>
        <StaffName staff={staff} />
      </Suspense>
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
            background: `linear-gradient(90deg, ${AZUL[700]} 0%, ${AZUL[800]} 100%)`,
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
        <Suspense fallback={<PageArea animate={false}>{children}</PageArea>}>
          <PageAreaWithPath>{children}</PageAreaWithPath>
        </Suspense>
      </Box>
    </Box>
  );
}
