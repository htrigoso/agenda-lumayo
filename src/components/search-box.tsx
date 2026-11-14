"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Badge from "@mui/material/Badge";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import TuneIcon from "@mui/icons-material/Tune";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import SearchIcon from "@mui/icons-material/Search";
import StarIcon from "@mui/icons-material/Star";
import FiberNewIcon from "@mui/icons-material/FiberNewOutlined";
import PhoneCallbackIcon from "@mui/icons-material/PhoneCallbackOutlined";

type FilterKey = "priority" | "isNew" | "due";

const FILTERS: { key: FilterKey; label: string; icon: React.ReactNode; color: "warning" | "info" }[] = [
  { key: "priority", label: "Potenciales", icon: <StarIcon fontSize="small" color="warning" />, color: "warning" },
  { key: "isNew", label: "Nuevos", icon: <FiberNewIcon fontSize="small" color="info" />, color: "info" },
  { key: "due", label: "Por llamar", icon: <PhoneCallbackIcon fontSize="small" color="warning" />, color: "warning" },
];

export function SearchBox({
  initial,
  onlyPriority,
  onlyNew,
  onlyDue,
}: {
  initial: string;
  onlyPriority: boolean;
  onlyNew: boolean;
  onlyDue: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [open, setOpen] = useState(false);
  // Filters are edited as a draft in the side panel and only applied on "Aplicar".
  const [draft, setDraft] = useState({ priority: onlyPriority, isNew: onlyNew, due: onlyDue });
  const activeCount = [onlyPriority, onlyNew, onlyDue].filter(Boolean).length;

  function openFilters() {
    setDraft({ priority: onlyPriority, isNew: onlyNew, due: onlyDue });
    setOpen(true);
  }

  function go(term: string, priority: boolean, isNew: boolean, due: boolean) {
    const params = new URLSearchParams();
    if (term.trim()) params.set("q", term.trim());
    if (priority) params.set("potential", "1");
    if (isNew) params.set("new", "1");
    if (due) params.set("call", "1");
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  return (
    <Stack direction="row" spacing={1} sx={{ flex: 1, alignItems: "center" }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(value, onlyPriority, onlyNew, onlyDue);
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
      <Badge badgeContent={activeCount} color="primary">
        <Button
          variant="outlined"
          startIcon={<TuneIcon />}
          onClick={openFilters}
          sx={{ bgcolor: "background.paper", whiteSpace: "nowrap" }}
        >
          Filtros
        </Button>
      </Badge>
      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Stack sx={{ width: { xs: "85vw", sm: 340 }, height: "100%" }}>
          <Stack direction="row" sx={{ alignItems: "center", px: 2, py: 1.5 }}>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
              Filtros
            </Typography>
            <IconButton aria-label="Cerrar" onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
          <Divider />
          <Stack spacing={0.5} sx={{ p: 2, flexGrow: 1 }}>
            {FILTERS.map((f) => (
              <FormControlLabel
                key={f.key}
                control={
                  <Switch
                    color={f.color}
                    checked={draft[f.key]}
                    onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.checked }))}
                  />
                }
                label={
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    {f.icon}
                    <span>{f.label}</span>
                  </Stack>
                }
              />
            ))}
          </Stack>
          <Divider />
          <Stack direction="row" spacing={1} sx={{ p: 2, justifyContent: "flex-end" }}>
            <Button color="inherit" onClick={() => setDraft({ priority: false, isNew: false, due: false })}>
              Limpiar
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                setOpen(false);
                go(value, draft.priority, draft.isNew, draft.due);
              }}
            >
              Aplicar
            </Button>
          </Stack>
        </Stack>
      </Drawer>
    </Stack>
  );
}
