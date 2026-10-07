"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import SearchIcon from "@mui/icons-material/Search";
import StarIcon from "@mui/icons-material/Star";

export function SearchBox({ initial, onlyPriority }: { initial: string; onlyPriority: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);

  function go(term: string, priority: boolean) {
    const params = new URLSearchParams();
    if (term.trim()) params.set("q", term.trim());
    if (priority) params.set("potential", "1");
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  return (
    <Stack direction="row" spacing={1} sx={{ flex: 1, alignItems: "center" }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(value, onlyPriority);
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
        onClick={() => go(value, !onlyPriority)}
        sx={{ fontWeight: 600, bgcolor: onlyPriority ? undefined : "background.paper" }}
      />
    </Stack>
  );
}
