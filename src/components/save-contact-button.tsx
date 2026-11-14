"use client";

import { useState, useSyncExternalStore } from "react";
import Badge from "@mui/material/Badge";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContactPhoneIcon from "@mui/icons-material/ContactPhoneOutlined";
import { markContactSaved } from "@/app/(app)/clients/actions";
import { androidContactIntent, contactPhone } from "@/lib/vcard";

type Props = {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string | null;
  whatsapp: string | null;
  savedAt?: string | null;
};

/** The user agent never changes, so there is nothing to subscribe to. */
const subscribe = () => () => {};

/** Short visual feedback so staff notice the tap was registered. */
const FEEDBACK_MS = 600;

function savedLabel(savedAt: string) {
  return `Contacto descargado el ${new Date(savedAt).toLocaleDateString("es-PE")} · Para desmarcar, edita el paciente`;
}

/**
 * Saves the patient on the phone. Android opens the native "new contact" form directly (intent);
 * other devices download the .vcf. A tap marks the patient as "contacto descargado".
 */
export function SaveContactButton({ id, firstName, lastName, mobile, whatsapp, savedAt = null }: Props) {
  const vcfPath = `/clients/${id}/vcf`;
  const [saved, setSaved] = useState(savedAt);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  // Server render (and non-Android) uses the .vcf link; Android switches to the native intent after hydration.
  const isAndroid = useSyncExternalStore(subscribe, () => /Android/i.test(navigator.userAgent), () => false);
  const href = isAndroid
    ? androidContactIntent(
        { first_name: firstName, last_name: lastName, mobile, whatsapp, email: null },
        `${window.location.origin}${vcfPath}`,
      )
    : vcfPath;

  if (!contactPhone({ mobile, whatsapp })) {
    return (
      <span title="Sin celular ni WhatsApp registrado">
        <IconButton disabled aria-label="Sin celular ni WhatsApp registrado">
          <ContactPhoneIcon />
        </IconButton>
      </span>
    );
  }

  // Runs in the same tap as the confirm link, so the browser still treats the navigation as user-initiated.
  function handleConfirm() {
    setOpen(false);
    setLoading(true);
    const optimistic = new Date().toISOString();
    const done = new Promise((resolve) => setTimeout(resolve, FEEDBACK_MS));
    markContactSaved(id)
      .catch(() => null)
      .then((stored) => done.then(() => {
        setSaved(stored ?? optimistic);
        setLoading(false);
      }));
  }

  const label = saved ? savedLabel(saved) : "Guardar en el teléfono";
  const name = [firstName, lastName].filter(Boolean).join(" ") || "este paciente";
  const phone = contactPhone({ mobile, whatsapp });
  return (
    <>
      <IconButton
        onClick={() => setOpen(true)}
        disabled={loading}
        aria-label={label}
        title={label}
        color={saved ? "success" : "primary"}
        aria-busy={loading}
      >
        {loading ? (
          <CircularProgress size={22} color="inherit" />
        ) : (
          <Badge
            invisible={!saved}
            overlap="circular"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            badgeContent={<CheckCircleIcon sx={{ fontSize: 14, color: "success.main", bgcolor: "background.paper", borderRadius: "50%" }} />}
          >
            <ContactPhoneIcon />
          </Badge>
        )}
      </IconButton>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>¿Guardar contacto en el teléfono?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Se abrirá la ficha de contacto de <strong>{name}</strong> ({phone}) para guardarla en el teléfono.
            {saved && ` Ya se descargó el ${new Date(saved).toLocaleDateString("es-PE")}.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button href={href} onClick={handleConfirm} variant="contained" startIcon={<ContactPhoneIcon />}>
            Guardar contacto
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
