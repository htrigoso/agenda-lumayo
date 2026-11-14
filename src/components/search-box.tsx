"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import SearchIcon from "@mui/icons-material/Search";
import StarIcon from "@mui/icons-material/Star";
import FiberNewIcon from "@mui/icons-material/FiberNewOutlined";

export function SearchBox({
  initial,
  onlyPriority,
  onlyNew,
}: {
  initial: string;
  onlyPriority: boolean;
  onlyNew: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial);

  function go(term: string, priority: boolean, isNew: boolean) {
    const params = new URLSearchParams();
    if (term.trim()) params.set("q", term.trim());
    if (priority) params.set("potential", "1");
    if (isNew) params.set("new", "1");
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  return (
    <Stack direction="row" spacing={1} sx={{ flex: 1, alignItems: "center" }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(value, onlyPriority, onlyNew);
        }}
        style={{ flex: 1 }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar por nombre, correo o celular (Enter)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
          sx={{ bgcolor: "background.paper" }}
        />
      </form>
      <Chip
        icon={<StarIcon />}
        label="Potenciales"
        color={onlyPriority ? "warning" : "default"}
        variant={onlyPriority ? "filled" : "outlined"}
        onClick={() => go(value, !onlyPriority, onlyNew)}
        sx={{ fontWeight: 600, bgcolor: onlyPriority ? undefined : "background.paper" }}
      />
      <Chip
        icon={<FiberNewIcon />}
        label="Nuevos"
        color={onlyNew ? "info" : "default"}
        variant={onlyNew ? "filled" : "outlined"}
        onClick={() => go(value, onlyPriority, !onlyNew)}
        sx={{ fontWeight: 600, bgcolor: onlyNew ? undefined : "background.paper" }}
      />
    </Stack>
  );
}
