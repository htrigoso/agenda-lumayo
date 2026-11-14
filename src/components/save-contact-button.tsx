import IconButton from "@mui/material/IconButton";
import ContactPhoneIcon from "@mui/icons-material/ContactPhoneOutlined";
import { contactPhone } from "@/lib/vcard";

/** Downloads the patient's .vcf; phones open it as a pre-filled "new contact" screen. Falls back to the WhatsApp number. */
export function SaveContactButton({ id, mobile, whatsapp }: { id: string; mobile: string | null; whatsapp: string | null }) {
  if (!contactPhone({ mobile, whatsapp })) {
    return (
      <span title="Sin celular ni WhatsApp registrado">
        <IconButton disabled aria-label="Sin celular ni WhatsApp registrado">
          <ContactPhoneIcon />
        </IconButton>
      </span>
    );
  }
  return (
    <IconButton href={`/clients/${id}/vcf`} aria-label="Guardar en el teléfono" title="Guardar en el teléfono" color="primary">
      <ContactPhoneIcon />
    </IconButton>
  );
}
