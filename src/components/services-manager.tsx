"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import EditIcon from "@mui/icons-material/EditOutlined";
import SearchIcon from "@mui/icons-material/Search";
import { deleteService, listServices, saveService } from "@/app/(app)/servicios/actions";
import type { Service } from "@/lib/budget";
import { formatMoney } from "@/lib/money";
import { AnimatePresence, LiftCard, Stagger } from "@/components/motion";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function ServicesManager() {
  const [services, setServices] = useState<Service[] | null>(null);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<Service | "new" | null>(null);
  const [removing, setRemoving] = useState<Service | null>(null);
  const [pending, startTransition] = useTransition();

  const load = useCallback(() => {
    listServices()
      .then((list) => {
        setServices(list);
        setError(false);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!services) return [];
    return term
      ? services.filter((s) => `${s.name} ${s.category ?? ""}`.toLowerCase().includes(term))
      : services;
  }, [services, filter]);

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Servicios
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing("new")}>
          Nuevo servicio
        </Button>
      </Stack>

      <TextField
        size="small"
        placeholder="Buscar servicio o categoría"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
        sx={{ bgcolor: "background.paper", maxWidth: 420 }}
      />

      {error && <Alert severity="error">No se pudieron cargar los servicios.</Alert>}
      {services === null && !error && <Skeleton variant="rounded" height={220} />}

      {services && visible.length === 0 && (
        <Paper sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
          {services.length === 0 ? "Aún no hay servicios. ¡Agrega el primero!" : "Ningún servicio coincide."}
        </Paper>
      )}

      <Stagger key={filter} spacing={1.5}>
        <AnimatePresence initial={false}>
        {visible.map((s) => (
          <LiftCard key={s.id} sx={{ p: 2, opacity: s.active ? 1 : 0.6 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600, overflowWrap: "anywhere" }}>{s.name}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5, alignItems: "center", flexWrap: "wrap" }}>
                  {s.category && <Chip size="small" label={s.category} />}
                  {!s.active && <Chip size="small" label="Inactivo" />}
                </Stack>
              </Box>
              <Typography sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>{formatMoney(s.default_price)}</Typography>
              <IconButton aria-label="Editar" onClick={() => setEditing(s)}>
                <EditIcon />
              </IconButton>
              <IconButton aria-label="Eliminar" color="error" onClick={() => setRemoving(s)}>
                <DeleteIcon />
              </IconButton>
            </Stack>
          </LiftCard>
        ))}
        </AnimatePresence>
      </Stagger>

      <ServiceDialog
        key={editing === null ? "closed" : editing === "new" ? "new" : editing.id}
        editing={editing}
        categories={[...new Set((services ?? []).map((s) => s.category).filter((c): c is string => !!c))]}
        onClose={() => setEditing(null)}
        onSaved={load}
      />

      <ConfirmDialog
        open={removing !== null}
        title="¿Eliminar servicio?"
        message={`"${removing?.name ?? ""}" se eliminará del catálogo. Los presupuestos que ya lo usan conservan su descripción y precio.`}
        pending={pending}
        onCancel={() => setRemoving(null)}
        onConfirm={() =>
          startTransition(async () => {
            if (removing) await deleteService(removing.id);
            setRemoving(null);
            load();
          })
        }
      />
    </Stack>
  );
}

function ServiceDialog({
  editing,
  categories,
  onClose,
  onSaved,
}: {
  editing: Service | "new" | null;
  categories: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const service = editing && editing !== "new" ? editing : null;
  const [name, setName] = useState(service?.name ?? "");
  const [category, setCategory] = useState(service?.category ?? "");
  const [price, setPrice] = useState(String(service?.default_price ?? ""));
  const [active, setActive] = useState(service?.active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveService({
        id: service?.id,
        name,
        category,
        default_price: Number(price || 0),
        active,
      });
      if (res.error) return setError(res.error);
      onSaved();
      onClose();
    });
  }

  return (
    <Dialog open={editing !== null} onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={submit} style={{ display: "contents" }}>
        <DialogTitle>{service ? "Editar servicio" : "Nuevo servicio"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Nombre" required value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            <TextField
              label="Categoría"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              helperText={categories.length ? `Existentes: ${categories.join(", ")}` : "Ej.: Prevención, Cirugía, Prótesis"}
            />
            <TextField
              label="Precio"
              type="number"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              slotProps={{
                input: { startAdornment: <InputAdornment position="start">S/</InputAdornment> },
                htmlInput: { min: 0, step: "0.01" },
              }}
            />
            <FormControlLabel
              control={<Switch checked={active} onChange={(e) => setActive(e.target.checked)} />}
              label="Disponible para nuevos presupuestos"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={pending}>
            {pending ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
