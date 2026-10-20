import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { PLANS, type PlanKey } from "@/lib/membership";

// Same look as the landing's CardFront (landing/src/components/lumayo-card/CardFaces.tsx).
const THEME: Record<PlanKey, { background: string; accent: string; subtle: string }> = {
  classic: { background: "#2364c2", accent: "#61d6d7", subtle: "#98d3f8" },
  gold: {
    background: "linear-gradient(118deg,#c39c48 0%,#d4b25c 30%,#dcc070 52%,#d2ae55 76%,#c09744 100%)",
    accent: "#f3dc9a",
    subtle: "#fbf1d2",
  },
};

export function CardFace({ plan, code, additional, compact = false }: { plan: PlanKey; code: string; additional: number; compact?: boolean }) {
  const t = THEME[plan];
  const isGold = plan === "gold";
  return (
    <Box
      sx={{
        position: "relative",
        aspectRatio: "1.586 / 1",
        width: "100%",
        maxWidth: compact ? 300 : 440,
        borderRadius: 2,
        overflow: "hidden",
        color: "#fff",
        background: t.background,
        boxShadow: "0 14px 30px rgba(26,47,81,0.22)",
        textShadow: isGold ? "0 1px 3px rgba(60,40,5,0.45)" : undefined,
        p: compact ? 2 : 3,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        component="img"
        src="/lumayo+centro-white.svg"
        alt="Lumayo"
        sx={{ width: compact ? 100 : 150, height: "auto" }}
      />
      <Box sx={{ mt: compact ? 1 : 2, width: 40, height: 4, borderRadius: 2, bgcolor: t.accent }} />
      <Typography sx={{ mt: 1, fontWeight: 800, fontSize: compact ? 15 : 22, lineHeight: 1.1 }}>Membresía familiar</Typography>
      <Typography sx={{ fontSize: compact ? 9 : 11, letterSpacing: "0.3em", textTransform: "uppercase", color: t.subtle }}>
        Anual · {PLANS[plan].label}
      </Typography>
      <Box sx={{ mt: "auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 1 }}>
        <Typography sx={{ fontSize: compact ? 10 : 12, fontWeight: 600 }}>
          1 titular + {PLANS[plan].maxAdditional} beneficiarios
          <Box component="span" sx={{ display: "block", color: t.subtle, fontWeight: 500 }}>
            {additional} registrados
          </Box>
        </Typography>
        <Typography sx={{ fontFamily: "monospace", fontWeight: 700, fontSize: compact ? 11 : 14, letterSpacing: "0.05em" }}>{code}</Typography>
      </Box>
      <Box
        component="img"
        src="/brand/lumayo-isotipo-white.svg"
        alt=""
        aria-hidden
        sx={{ position: "absolute", right: -30, top: "50%", width: "46%", opacity: isGold ? 0.1 : 0.22, transform: "translateY(-50%)", pointerEvents: "none" }}
      />
    </Box>
  );
}
