"use client";

import Chip from "@mui/material/Chip";
import StarIcon from "@mui/icons-material/Star";

export function PriorityChip() {
  return <Chip size="small" color="warning" icon={<StarIcon />} label="Potencial" sx={{ fontWeight: 600 }} />;
}
