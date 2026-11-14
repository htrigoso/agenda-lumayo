"use client";

import Chip from "@mui/material/Chip";
import FiberNewIcon from "@mui/icons-material/FiberNewOutlined";

export function NewChip() {
  return <Chip size="small" color="info" icon={<FiberNewIcon />} label="Nuevo" sx={{ fontWeight: 600 }} />;
}
