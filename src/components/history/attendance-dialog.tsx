"use client";

import { useState, useTransition } from "react";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { saveAttendance, saveAttendanceBatch, type Attendance, type OpenItem } from "@/app/(app)/clients/clinical-actions";
import { toDateTimeLocal } from "@/lib/appointments";

const normalizeTeeth = (value: string | null) => (value ?? "").replace(/\s+/g, "").toLowerCase();

/**
 * Form to register (or edit) an attendance. Passing `initialItem` pre-links it to a budget
 * treatment: description and teeth are prefilled and saving marks the treatment as done.
 */
export function AttendanceDialog({
  clientId,
  attendance,
  openItems,
  initialItem,
  onClose,
  onSaved,
}: {
  clientId: string;
  attendance: Attendance | null;
  openItems: OpenItem[];
  initialItem?: OpenItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [selected, setSelected] = useState<OpenItem[]>(
    initialItem ? [initialItem] : openItems.filter((i) => i.id === attendance?.item_id),
  );
  const [date, setDate] = useState(attendance?.attended_at ?? toDateTimeLocal(new Date()).slice(0, 10));
  const [teeth, setTeeth] = useState(attendance?.teeth ?? initialItem?.teeth ?? "");
  const [procedure, setProcedure] = useState(attendance?.procedure ?? "");
  const [notes, setNotes] = useState(attendance?.notes ?? "");
  const [markDone, setMarkDone] = useState(!attendance);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const editing = attendance !== null;
  const multiple = selected.length > 1;
  const selectedIds = new Set(selected.map((i) => i.id));
  const groups = [...new Set(openItems.map((i) => i.plan_title))].map((title) => ({
    title,
    items: openItems.filter((i) => i.plan_title === title),
  }));

  function change(next: OpenItem[]) {
    setSelected(next);
    if (next.length === 1) setTeeth((t) => t || next[0].teeth || "");
  }

  // If the typed pieces match exactly one pending treatment, link it automatically.
  function suggestFromTeeth() {
    if (selected.length || !teeth.trim()) return;
    const matches = openItems.filter((i) => normalizeTeeth(i.teeth) === normalizeTeeth(teeth));
    if (matches.length === 1) change(matches);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = multiple
        ? await saveAttendanceBatch({
            client_id: clientId,
            attended_at: date,
            notes,
            items: selected.map((i) => ({ item_id: i.id, procedure: i.description, teeth: i.teeth })),
            markItemsDone: markDone,
          })
        : await saveAttendance({
            id: attendance?.id,
            client_id: clientId,
            item_id: selected[0]?.id ?? null,
            attended_at: date,
            teeth,
            // With a linked treatment the procedure is a snapshot of its description.
            procedure: selected[0] ? selected[0].description : procedure,
            notes,
            markItemDone: markDone,
          });
      if (res.error) return setError(res.error);
      onSaved();
      onClose();
    });
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={submit} style={{ display: "contents" }}>
        <DialogTitle>{attendance ? "Editar atención" : "Registrar atención"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Fecha"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            {editing ? (
              <Autocomplete
                options={openItems}
                value={selected[0] ?? null}
                getOptionLabel={(i) => `${i.description}${i.teeth ? ` (${i.teeth})` : ""}`}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                groupBy={(i) => i.plan_title}
                noOptionsText="No hay tratamientos pendientes"
                onChange={(_, value) => change(value ? [value] : [])}
                renderInput={(params) => <TextField {...params} label="Tratamiento del presupuesto" />}
              />
            ) : openItems.length > 0 ? (
              <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.5 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  Tratamientos pendientes del presupuesto
                </Typography>
                {groups.map((g) => {
                  const chosen = g.items.filter((i) => selectedIds.has(i.id)).length;
                  return (
                    <Box key={g.title} sx={{ mb: 1 }}>
                      <FormControlLabel
                        label={<Typography sx={{ fontWeight: 700 }}>{g.title}</Typography>}
                        control={
                          <Checkbox
                            checked={chosen === g.items.length}
                            indeterminate={chosen > 0 && chosen < g.items.length}
                            onChange={(e) =>
                              change(
                                e.target.checked
                                  ? [...selected, ...g.items.filter((i) => !selectedIds.has(i.id))]
                                  : selected.filter((i) => !g.items.some((x) => x.id === i.id)),
                              )
                            }
                          />
                        }
                      />
                      <Stack sx={{ pl: 4 }}>
                        {g.items.map((i) => (
                          <FormControlLabel
                            key={i.id}
                            label={`${i.description}${i.teeth ? ` (${i.teeth})` : ""}`}
                            control={
                              <Checkbox
                                size="small"
                                checked={selectedIds.has(i.id)}
                                onChange={(e) =>
                                  change(e.target.checked ? [...selected, i] : selected.filter((x) => x.id !== i.id))
                                }
                              />
                            }
                          />
                        ))}
                      </Stack>
                    </Box>
                  );
                })}
                {!selected.length && (
                  <Typography variant="caption" color="text.secondary">
                    Marca uno o varios, o déjalos sin marcar para registrar otra atención.
                  </Typography>
                )}
              </Box>
            ) : (
              <Alert severity="info">No hay tratamientos pendientes en el presupuesto de este paciente.</Alert>
            )}
            {multiple && (
              <Alert severity="info">
                Se registrará una atención por cada tratamiento ({selected.length}), con las piezas de cada uno.
              </Alert>
            )}
            {!selected.length && (
              <TextField
                label="Procedimiento realizado"
                required
                value={procedure}
                onChange={(e) => setProcedure(e.target.value)}
                helperText="Para atenciones fuera del presupuesto: urgencias, controles, consultas."
              />
            )}
            {!multiple && (
              <TextField
                label="Piezas dentales"
                value={teeth}
                onChange={(e) => setTeeth(e.target.value)}
                onBlur={suggestFromTeeth}
                helperText="Ej.: 16, 47-44"
              />
            )}
            <TextField label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={3} />
            {selected.length > 0 && (
              <FormControlLabel
                control={<Checkbox checked={markDone} onChange={(e) => setMarkDone(e.target.checked)} />}
                label={multiple ? "Marcar los tratamientos como realizados" : "Marcar el tratamiento como realizado"}
              />
            )}
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
