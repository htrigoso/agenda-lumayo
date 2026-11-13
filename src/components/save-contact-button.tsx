import IconButton from "@mui/material/IconButton";
import ContactPhoneIcon from "@mui/icons-material/ContactPhoneOutlined";

/** Downloads the patient's .vcf; phones open it as a pre-filled "new contact" screen. */
export function SaveContactButton({ id, mobile }: { id: string; mobile: string | null }) {
  if (!mobile) {
    return (
      <span title="Sin celular registrado">
        <IconButton disabled aria-label="Sin celular registrado">
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
