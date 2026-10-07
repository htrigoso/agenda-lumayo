"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import SaveIcon from "@mui/icons-material/SaveOutlined";
import { getOdontograms, saveOdontogram, type OdontogramKind } from "@/app/clients/clinical-actions";
import { OdontogramEditor } from "@/components/odontogram/odontogram-editor";
import { EMPTY_ODONTOGRAM, isEmptyOdontogram, type OdontogramData } from "@/lib/odontogram";

type State = Record<OdontogramKind, { data: OdontogramData; saved: string | null; updatedAt: string | null }>;

const LABEL: Record<OdontogramKind, string> = { initial: "Inicial", current: "Actual" };

export function OdontogramPanel({ clientId }: { clientId: string }) {
  const [state, setState] = useState<State | null>(null);
  const [kind, setKind] = useState<OdontogramKind>("current");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    getOdontograms(clientId)
      .then((rows) => {
        const make = (k: OdontogramKind) => ({
          data: rows[k]?.data ?? EMPTY_ODONTOGRAM,
          saved: JSON.stringify(rows[k]?.data ?? EMPTY_ODONTOGRAM),
          updatedAt: rows[k]?.updated_at ?? null,
        });
        setState({ initial: make("initial"), current: make("current") });
      })
      .catch(() => setError("No se pudo cargar el odontograma."));
  }, [clientId]);

  const change = useCallback(
    (data: OdontogramData) => setState((s) => (s ? { ...s, [kind]: { ...s[kind], data } } : s)),
    [kind],
  );

  if (error && !state) return <Alert severity="error">{error}</Alert>;
  if (!state) return <Skeleton variant="rounded" height={420} />;

  const active = state[kind];
  const dirty = JSON.stringify(active.data) !== active.saved;
  const isEmpty = isEmptyOdontogram(active.data);
  const canCopy = kind === "current" && isEmpty && !isEmptyOdontogram(state.initial.data);

  function save() {
    startTransition(async () => {
      const res = await saveOdontogram(clientId, kind, active.data);
      if (res.error) return setError(res.error);
      setError(null);
      setState((s) =>
        s
          ? { ...s, [kind]: { ...s[kind], saved: JSON.stringify(active.data), updatedAt: new Date().toISOString() } }
          : s,
      );
      setToast(true);
    });
  }

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
      >
        <ToggleButtonGroup
          exclusive
          size="small"
          value={kind}
          onChange={(_, v) => v && setKind(v)}
          color="primary"
        >
          <ToggleButton value="current" sx={{ px: 2.5, fontWeight: 600 }}>
            Actual
          </ToggleButton>
          <ToggleButton value="initial" sx={{ px: 2.5, fontWeight: 600 }}>
            Inicial
          </ToggleButton>
        </ToggleButtonGroup>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Typography variant="caption" color="text.secondary">
            {dirty
              ? "Cambios sin guardar"
              : active.updatedAt
                ? `Guardado: ${new Date(active.updatedAt).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}`
                : "Sin guardar todavía"}
          </Typography>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={save} disabled={!dirty || pending}>
            {pending ? "Guardando..." : `Guardar ${LABEL[kind].toLowerCase()}`}
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      {canCopy && (
        <Alert
          severity="info"
          action={
            <Button color="inherit" size="small" onClick={() => change(state.initial.data)}>
              Copiar inicial
            </Button>
          }
        >
          El odontograma actual está vacío. Puedes partir desde el inicial.
        </Alert>
      )}

      <OdontogramEditor key={kind} data={active.data} onChange={change} />

      <Snackbar
        open={toast}
        autoHideDuration={2500}
        onClose={() => setToast(false)}
        message="Odontograma guardado"
      />
    </Stack>
  );
}
