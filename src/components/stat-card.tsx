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
      whileHover={{ y: -2 }}
      transition={{ duration: 0.35, ease: EASE, delay: index * 0.08 }}
      sx={{
        px: 1.5,
        py: 0.75,
        display: "flex",
        alignItems: "center",
        gap: 1,
        height: "100%",
        minWidth: 0,
      }}
    >
      <Avatar sx={{ bgcolor: color, color: "#fff", width: 26, height: 26, "& svg": { fontSize: 16 } }}>{icon}</Avatar>
      {/* One compact line: number and label side by side (label wraps under on narrow screens). */}
      <Box sx={{ display: "flex", alignItems: "baseline", columnGap: 0.75, flexWrap: "wrap", minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: { xs: 15, sm: 17 }, lineHeight: 1.2 }}>
          <AnimatedNumber value={value} />
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: 11, sm: 13 }, lineHeight: 1.2 }}>
          {label}
        </Typography>
      </Box>
    </MotionPaper>
  );
}
