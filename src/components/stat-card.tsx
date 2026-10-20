"use client";

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { AnimatedNumber, EASE, MotionPaper } from "@/components/motion";

export function StatCard({
  label,
  value,
  icon,
  index = 0,
  color = "primary.main",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  index?: number;
  /** Background of the icon badge. */
  color?: string;
}) {
  return (
    <MotionPaper
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: "0 1px 2px rgba(26,47,81,0.06), 0 14px 28px -16px rgba(26,47,81,0.35)" }}
      transition={{ duration: 0.35, ease: EASE, delay: index * 0.08 }}
      sx={{
        p: { xs: 1.5, sm: 2.5 },
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-start", sm: "center" },
        gap: { xs: 1, sm: 2 },
        height: "100%",
      }}
    >
      <Avatar sx={{ bgcolor: color, color: "#fff", width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}>
        {icon}
      </Avatar>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
          <AnimatedNumber value={value} />
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: 12, sm: 14 } }}>
          {label}
        </Typography>
      </Box>
    </MotionPaper>
  );
}
