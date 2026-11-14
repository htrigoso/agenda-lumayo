"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import CallIcon from "@mui/icons-material/Call";
import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalkOutlined";
import { logCall } from "@/app/(app)/clients/actions";
import { type CallSummary, addDays, formatDay, limaToday, outcomeLabel, outcomeOption, outcomesByGroup, validateCall } from "@/lib/calls";
import { contactPhone } from "@/lib/vcard";

type Props = {
  clientId: string;
  name: string;
  mobile: string | null;
  whatsapp: string | null;
  /** Called with the patient's new "last call" columns after a successful save. */
  onLogged?: (summary: CallSummary) => void;
  /** Button style: an icon (lists) or a labelled button (patient file). */
  variant?: "icon" | "button";
};

type FormProps = Omit<Props, "variant" | "name"> & { onClose: () => void };

/** Patient number with a copy button (no tel: link: staff dial from their own phone). */
function PhoneCopy({ phone }: { phone: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(phone.replace(/[^\d+]/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{ alignItems: "center", px: 2, py: 1.25, borderRadius: 2, bgcolor: "success.main", color: "success.contrastText" }}
    >
      <CallIcon />
      <Typography sx={{ flexGrow: 1, fontWeight: 700, fontSize: "1.1rem", letterSpacing: 0.5 }}>{phone}</Typography>
      <Tooltip title={copied ? "¡Copiado!" : "Copiar número"}>
        <IconButton onClick={copy} aria-label="Copiar número" sx={{ color: "inherit" }}>
          {copied ? <CheckIcon /> : <ContentCopyIcon />}
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

/** Mounted only while the dialog is open, so each call starts with a clean form. */
function CallForm({ clientId, mobile, whatsapp, onLogged, onClose }: FormProps) {
  const router = useRouter();
  const [outcome, setOutcome] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpOn, setFollowUpOn] = useState(() => addDays(limaToday(), 1));
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const option = outcomeOption(outcome);
  const phone = contactPhone({ mobile, whatsapp });
  const today = limaToday();

  // The date only matters for outcomes that ask for it.
  const input = { outcome, notes, followUpOn: option?.needsDate ? followUpOn : "" };

  /** Validates the form and asks for confirmation before saving. */
  function review() {
    const invalid = validateCall(input, today);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    setConfirming(true);
  }

  function save() {
    startTransition(async () => {
      try {
        const summary = await logCall(clientId, input);
        onLogged?.(summary);
        setConfirming(false);
        onClose();
        router.refresh();
      } catch (e) {
        setConfirming(false);
        setError(e instanceof Error ? e.message : "No se pudo guardar la llamada.");
      }
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        review();
      }}
    >
      <DialogContent sx={{ pt: 0 }}>
        <Stack spacing={2.5}>
          {phone ? (
            <PhoneCopy phone={phone} />
          ) : (
            <Alert severity="info">Este paciente no tiene celular ni WhatsApp registrado.</Alert>
          )}
          <div>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              ¿Cómo fue la llamada? (opcional)
            </Typography>
            <Stack spacing={1.5} role="radiogroup" aria-label="Resultado de la llamada">
              {outcomesByGroup().map((group) => (
                <div key={group.key}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontWeight: 700, mb: 0.75 }}>
                    {group.label}
                  </Typography>
                  <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75 }}>
                    {group.outcomes.map((o) => {
                      const selected = o.key === outcome;
                      return (
                        <Chip
                          key={o.key}
                          size="small"
                          label={o.label}
                          color={o.color}
                          variant={selected ? "filled" : "outlined"}
                          // Tapping the selected outcome again clears it (the outcome is optional).
                          onClick={() => setOutcome(selected ? "" : o.key)}
                          role="radio"
                          aria-checked={selected}
                          sx={{ fontWeight: selected ? 700 : 500 }}
                        />
                      );
                    })}
                  </Stack>
                </div>
              ))}
            </Stack>
          </div>
          {option?.needsDate && (
            <TextField
              type="date"
              label="Volver a llamar el"
              value={followUpOn}
              onChange={(e) => setFollowUpOn(e.target.value)}
              required
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: today } }}
            />
          )}
          <TextField
            label="Notas"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            minRows={2}
            required={option?.needsNotes}
            helperText={
              option?.needsNotes
                ? "Obligatorio: describe qué pasó en la llamada."
                : option
                  ? "Opcional"
                  : "Si no eliges un resultado, escribe una nota."
            }
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" variant="contained" disabled={pending || (!outcome && !notes.trim())}>
          Guardar
        </Button>
      </DialogActions>

      <Dialog open={confirming} onClose={() => !pending && setConfirming(false)} maxWidth="xs" fullWidth>
        <DialogTitle>¿Registrar esta llamada?</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5}>
            <div>
              <Chip label={outcomeLabel(outcome)} color={option?.color ?? "default"} sx={{ fontWeight: 700 }} />
            </div>
            {input.followUpOn && (
              <Typography variant="body2">
                Volver a llamar el <strong>{formatDay(input.followUpOn)}</strong>
              </Typography>
            )}
            {notes.trim() && (
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                {notes.trim()}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirming(false)} disabled={pending}>
            Revisar
          </Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={pending}
            startIcon={pending ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {pending ? "Registrando..." : "Sí, registrar"}
          </Button>
        </DialogActions>
      </Dialog>
    </form>
  );
}

/** Phone button that opens the "Registrar llamada" dialog for one patient. */
export function CallLogDialog({ variant = "icon", ...props }: Props) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      {variant === "icon" ? (
        <Tooltip title="Registrar llamada">
          <IconButton color="primary" onClick={() => setOpen(true)} aria-label={`Registrar llamada con ${props.name}`}>
            <PhoneInTalkIcon />
          </IconButton>
        </Tooltip>
      ) : (
        <Button variant="contained" startIcon={<PhoneInTalkIcon />} onClick={() => setOpen(true)}>
          Registrar llamada
        </Button>
      )}
      <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
        <DialogTitle>Registrar llamada · {props.name}</DialogTitle>
        {open && <CallForm clientId={props.clientId} mobile={props.mobile} whatsapp={props.whatsapp} onLogged={props.onLogged} onClose={close} />}
      </Dialog>
    </>
  );
}
