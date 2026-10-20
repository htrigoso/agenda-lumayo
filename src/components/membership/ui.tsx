"use client";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { AQUA, AZUL, GOLD, INK, LINE } from "@/lib/brand";
import { STATUS_COLOR, STATUS_LABEL, STATUS_SOFT, periodProgress, validityText, type MembershipStatus, type PlanKey } from "@/lib/membership";

export const PLAN_FILL: Record<PlanKey, string> = { classic: AZUL[700], gold: GOLD.gradient };

/** Small colored card shape that identifies the plan without the full card artwork. */
export function PlanSwatch({ plan, size = 44 }: { plan: PlanKey; size?: number }) {
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: Math.round(size / 1.586),
        flexShrink: 0,
        borderRadius: 1,
        background: PLAN_FILL[plan],
        position: "relative",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)",
        "&::after": {
          content: '""',
          position: "absolute",
          left: "14%",
          bottom: "22%",
          width: "30%",
          height: 3,
          borderRadius: 2,
          bgcolor: plan === "gold" ? GOLD.accent : AQUA[300],
        },
      }}
    />
  );
}

export function StatusChip({ status, size = "small" }: { status: MembershipStatus; size?: "small" | "medium" }) {
  return (
    <Chip
      size={size}
      label={STATUS_LABEL[status]}
      sx={{ bgcolor: STATUS_SOFT[status], color: STATUS_COLOR[status], fontWeight: 700, border: "none" }}
    />
  );
}

/** Progress of the current period with a "Vence en N días" caption. */
export function ValidityBar({
  startsOn,
  endsOn,
  status,
  dense = false,
}: {
  startsOn: string | null;
  endsOn: string | null;
  status: MembershipStatus;
  dense?: boolean;
}) {
  const progress = startsOn && endsOn ? periodProgress(startsOn, endsOn) : 1;
  const color = STATUS_COLOR[status];
  return (
    <Stack spacing={0.5} sx={{ minWidth: 0 }}>
      <Box sx={{ height: dense ? 5 : 8, borderRadius: 99, bgcolor: STATUS_SOFT[status], overflow: "hidden" }}>
        <Box sx={{ height: "100%", width: `${Math.round(progress * 100)}%`, bgcolor: color, borderRadius: 99, transition: "width .6s ease" }} />
      </Box>
      <Typography variant="caption" sx={{ color, fontWeight: 600 }}>
        {validityText(endsOn, status === "cancelled")}
      </Typography>
    </Stack>
  );
}

/** One dot per seat: filled for registered additional members, hollow for free seats. */
export function SeatDots({ used, max, plan }: { used: number; max: number; plan: PlanKey }) {
  const fill = plan === "gold" ? GOLD.main : AQUA[500];
  return (
    <Stack direction="row" spacing={0.5} aria-label={`${used} de ${max} adicionales`}>
      {Array.from({ length: max }, (_, i) => (
        <Box
          key={i}
          sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: i < used ? fill : "transparent", border: `1.5px solid ${i < used ? fill : LINE}` }}
        />
      ))}
    </Stack>
  );
}

/** Numbered form step that turns into a check once complete. */
export function StepHeader({ n, title, done, aside }: { n: number; title: string; done?: boolean; aside?: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
      <Avatar
        sx={{
          width: 30,
          height: 30,
          fontSize: 14,
          fontWeight: 700,
          bgcolor: done ? AQUA[500] : AZUL[100],
          color: done ? "#fff" : AZUL[700],
          transition: "background-color .25s ease",
        }}
      >
        {done ? <CheckRoundedIcon sx={{ fontSize: 18 }} /> : n}
      </Avatar>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, flexGrow: 1 }}>{title}</Typography>
      {aside}
    </Stack>
  );
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

/** Initials avatar: blue for the holder, aqua for additional members, outlined when there is no patient file. */
export function MemberAvatar({ name, role, external }: { name: string; role: "holder" | "additional"; external?: boolean }) {
  const holder = role === "holder";
  return (
    <Avatar
      sx={{
        width: 40,
        height: 40,
        fontSize: 14,
        fontWeight: 700,
        bgcolor: external ? "#fff" : holder ? AZUL[700] : AQUA[100],
        color: external ? INK[600] : holder ? "#fff" : AQUA[700],
        border: external ? `1.5px dashed ${INK[400]}` : "none",
      }}
    >
      {initials(name) || "?"}
    </Avatar>
  );
}

/** Small uppercase label used above values in summaries. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="caption" sx={{ color: INK[400], fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
      {children}
    </Typography>
  );
}
