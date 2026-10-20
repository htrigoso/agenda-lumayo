"use client";

import { useEffect, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import { createPatient, searchPatients, type PatientOption } from "@/app/(app)/membresias/actions";
import { formatRecordNumber } from "@/lib/record";

export type { PatientOption };

const label = (p: PatientOption) => `${p.first_name} ${p.last_name}${p.dni ? ` · DNI ${p.dni}` : ""}`;

/** Search an existing patient, or create one on the spot when the person is new. */
export function PatientPicker({
  value,
  onChange,
  excludeIds = [],
  placeholder,
}: {
  value: PatientOption | null;
  onChange: (p: PatientOption | null) => void;
  excludeIds?: string[];
  placeholder: string;
}) {
  const [input, setInput] = useState("");
  const [options, setOptions] = useState<PatientOption[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchPatients(input).then(setOptions).catch(() => setOptions([]));
    }, 200);
    return () => clearTimeout(timer);
  }, [input]);

  async function quickCreate() {
    const name = input.trim().split(/\s+/);
    if (name.length < 2) return setError("Escribe nombres y apellidos para crear el paciente.");
    setCreating(true);
    const res = await createPatient({ first_name: name.slice(0, -1).join(" "), last_name: name.at(-1) ?? "", dni: "", mobile: "" });
    setCreating(false);
    if (res.error) return setError(res.error);
    if (res.patient) onChange(res.patient);
  }

  return (
    <Stack spacing={1}>
      <Autocomplete
        options={options.filter((o) => !excludeIds.includes(o.id))}
        value={value}
        inputValue={input}
        onInputChange={(_, v) => setInput(v)}
        onChange={(_, v) => onChange(v)}
        getOptionLabel={label}
        // Someone already in an active membership cannot join another one, as holder or additional.
        getOptionDisabled={(o) => o.membership_code !== null}
        renderOption={(props, o) => {
          // Key by patient id: two patients can share name and DNI, and the label is not unique.
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { key: _label, ...rest } = props;
          return (
            <li key={o.id} {...rest}>
              <Stack direction="row" spacing={1} sx={{ width: "100%", justifyContent: "space-between" }}>
                <span>
                  {label(o)}
                  {o.record_number !== null && <Typography component="span" variant="caption" color="text.secondary"> · H.C. {formatRecordNumber(o.record_number)}</Typography>}
                </span>
                {o.membership_code && <Typography variant="caption" color="text.secondary">Ya está en {o.membership_code}</Typography>}
              </Stack>
            </li>
          );
        }}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        filterOptions={(x) => x}
        noOptionsText="Sin resultados"
        renderInput={(params) => <TextField {...params} label={placeholder} />}
      />
      {!value && input.trim() && (
        <Button size="small" onClick={quickCreate} disabled={creating} sx={{ alignSelf: "flex-start" }}>
          {creating ? "Creando..." : `Crear paciente "${input.trim()}"`}
        </Button>
      )}
      {error && <Typography color="error" variant="body2">{error}</Typography>}
    </Stack>
  );
}
