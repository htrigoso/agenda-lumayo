"use client";

import { useState } from "react";
import Badge from "@mui/material/Badge";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import TuneIcon from "@mui/icons-material/Tune";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import SearchIcon from "@mui/icons-material/Search";
import StarIcon from "@mui/icons-material/Star";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalkOutlined";
import EventIcon from "@mui/icons-material/EventOutlined";
import { outcomesByGroup } from "@/lib/calls";
import { EMPTY_FILTERS, type ListFilters, filtersHref } from "@/lib/list-filters";
import { useListNavigation } from "@/components/list-navigation";

type FilterKey = "onlyPriority";

const FILTERS: { key: FilterKey; label: string; icon: React.ReactNode; color: "warning" | "info" }[] = [
  { key: "onlyPriority", label: "Potenciales", icon: <StarIcon fontSize="small" color="warning" />, color: "warning" },
];

export function SearchBox({ filters }: { filters: ListFilters }) {
  const { navigate, pending } = useListNavigation();
  const [value, setValue] = useState(filters.term);
  const [open, setOpen] = useState(false);
  // Filters are edited as a draft in the side panel and only applied on "Aplicar".
  const [draft, setDraft] = useState(filters);
  const activeCount =
    [filters.onlyPriority, filters.callFrom || filters.callTo].filter(Boolean).length + filters.outcomes.length;

  function openFilters() {
    setDraft(filters);
    setOpen(true);
  }

  function go(next: ListFilters) {
    navigate(filtersHref({ ...next, term: value.trim() }));
  }

  return (
    <Stack direction="row" spacing={1} sx={{ flex: 1, alignItems: "center" }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(filters);
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
          startIcon={pending ? <CircularProgress size={16} /> : <TuneIcon />}
          onClick={openFilters}
          sx={{ bgcolor: "background.paper", whiteSpace: "nowrap" }}
        >
          Filtros
        </Button>
      </Badge>
      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Stack sx={{ width: { xs: "90vw", sm: 400 }, height: "100%" }}>
          <Stack direction="row" sx={{ alignItems: "center", px: 2, py: 1.5 }}>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
              Filtros
            </Typography>
            <IconButton aria-label="Cerrar" onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
          <Divider />
          <Stack spacing={0.5} useFlexGap sx={{ p: 2, flexGrow: 1, minHeight: 0, overflowY: "auto" }}>
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
            <Divider sx={{ my: 1.5 }} />
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.5 }}>
              <EventIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2">Fecha de la última llamada</Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              <TextField
                type="date"
                size="small"
                label="Desde"
                fullWidth
                value={draft.callFrom ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, callFrom: e.target.value || null }))}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: draft.callTo ?? undefined } }}
              />
              <TextField
                type="date"
                size="small"
                label="Hasta"
                fullWidth
                value={draft.callTo ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, callTo: e.target.value || null }))}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: draft.callFrom ?? undefined } }}
              />
            </Stack>
            <Divider sx={{ my: 1.5 }} />
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
              <PhoneInTalkIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2">Resultado de la última llamada</Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
              Puedes elegir varios.
            </Typography>
            <Stack spacing={1.25}>
              {outcomesByGroup().map((group) => (
                <div key={group.key}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 700, mb: 0.5 }}>
                    {group.label}
                  </Typography>
                  <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75 }}>
                    {group.outcomes.map((o) => {
                      const selected = draft.outcomes.includes(o.key);
                      return (
                        <Chip
                          key={o.key}
                          size="small"
                          label={o.label}
                          color={o.color}
                          variant={selected ? "filled" : "outlined"}
                          icon={selected ? <CheckIcon /> : undefined}
                          aria-pressed={selected}
                          onClick={() =>
                            setDraft((d) => ({
                              ...d,
                              outcomes: selected ? d.outcomes.filter((k) => k !== o.key) : [...d.outcomes, o.key],
                            }))
                          }
                        />
                      );
                    })}
                  </Stack>
                </div>
              ))}
            </Stack>
          </Stack>
          <Divider />
          <Stack direction="row" spacing={1} sx={{ p: 2, justifyContent: "flex-end" }}>
            <Button color="inherit" onClick={() => setDraft({ ...EMPTY_FILTERS, term: filters.term })}>
              Limpiar
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                setOpen(false);
                go(draft);
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
