"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import SearchIcon from "@mui/icons-material/Search";

export function SearchBox({ initial }: { initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(value.trim() ? `/?q=${encodeURIComponent(value.trim())}` : "/");
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
  );
}
