"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import type { AdditionalInput as AdditionalPayload } from "@/app/(app)/membresias/actions";
import { PatientPicker, type PatientOption } from "@/components/membership/patient-picker";
import { EMPTY_PERSON, RELATIONSHIPS, personError, type PersonInput } from "@/lib/membership";

/** An additional member being added, with what the UI needs to display it. */
export type AdditionalDraft = { relationship: string } & ({ kind: "patient"; patient: PatientOption } | { kind: "person"; person: PersonInput });

export const draftName = (d: AdditionalDraft) =>
  d.kind === "patient" ? `${d.patient.first_name} ${d.patient.last_name}` : `${d.person.first_name.trim()} ${d.person.last_name.trim()}`;

export const draftDni = (d: AdditionalDraft) => (d.kind === "patient" ? d.patient.dni : d.person.dni.trim().toUpperCase());

export const toPayload = (d: AdditionalDraft): AdditionalPayload =>
  d.kind === "patient" ? { client_id: d.patient.id, relationship: d.relationship } : { person: d.person, relationship: d.relationship };

/**
 * Adds an additional member: pick an existing patient, or register a person with DNI and personal data.
 * `onAdd` returns an error message to show, or nothing when the member was accepted.
 */
export function AdditionalInput({
  excludeIds,
  onAdd,
  disabled,
}: {
  excludeIds: string[];
  onAdd: (d: AdditionalDraft) => string | undefined | Promise<string | undefined>;
  disabled?: boolean;
}) {
  const [mode, setMode] = useState<"patient" | "person">("patient");
  const [patient, setPatient] = useState<PatientOption | null>(null);
  const [person, setPerson] = useState<PersonInput>(EMPTY_PERSON);
  const [relationship, setRelationship] = useState(RELATIONSHIPS[0]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (field: keyof PersonInput) => (e: React.ChangeEvent<HTMLInputElement>) => setPerson((p) => ({ ...p, [field]: e.target.value }));

  async function add() {
    setError(null);
    let draft: AdditionalDraft;
    if (mode === "patient") {
      if (!patient) return setError("Elige un paciente.");
      draft = { kind: "patient", patient, relationship };
    } else {
      const invalid = personError(person);
      if (invalid) return setError(invalid);
      draft = { kind: "person", person, relationship };
    }
    setBusy(true);
    const problem = await onAdd(draft);
    setBusy(false);
    if (problem) return setError(problem);
    setPatient(null);
    setPerson(EMPTY_PERSON);
  }

  return (
    <Stack spacing={1.5}>
      <ToggleButtonGroup exclusive size="small" value={mode} onChange={(_, v) => v && (setMode(v), setError(null))}>
        <ToggleButton value="patient" sx={{ px: 2 }}>Paciente</ToggleButton>
        <ToggleButton value="person" sx={{ px: 2 }}>Sin ficha (con DNI)</ToggleButton>
      </ToggleButtonGroup>

      {mode === "patient" ? (
        <PatientPicker value={patient} onChange={setPatient} excludeIds={excludeIds} placeholder="Buscar paciente adicional" />
      ) : (
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Nombres" value={person.first_name} onChange={set("first_name")} required fullWidth />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Apellidos" value={person.last_name} onChange={set("last_name")} required fullWidth />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="DNI" value={person.dni} onChange={set("dni")} required fullWidth slotProps={{ htmlInput: { maxLength: 12 } }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Fecha de nacimiento" type="date" value={person.birth_date} onChange={set("birth_date")} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Celular" value={person.mobile} onChange={set("mobile")} fullWidth slotProps={{ htmlInput: { inputMode: "tel" } }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Correo" type="email" value={person.email} onChange={set("email")} fullWidth />
          </Grid>
        </Grid>
      )}

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <TextField select label="Parentesco" value={relationship} onChange={(e) => setRelationship(e.target.value)} sx={{ minWidth: 180 }}>
          {RELATIONSHIPS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
        </TextField>
        <Button variant="outlined" onClick={add} disabled={disabled || busy} sx={{ height: 56, whiteSpace: "nowrap" }}>
          {busy ? "Agregando..." : "Agregar adicional"}
        </Button>
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
    </Stack>
  );
}
