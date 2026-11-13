/** Only the contact fields go into the card: clinical data must never reach a personal phone book. */
export type VCardContact = {
  first_name: string;
  last_name: string;
  mobile: string | null;
  email: string | null;
};

/** Peruvian mobiles (9 digits starting with 9) get +51; anything else is returned untouched. */
export function toE164(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("51")) digits = digits.slice(2);
  return digits.length === 9 && digits.startsWith("9") ? `+51${digits}` : digits;
}

/** RFC 6350 text escaping: backslash, comma, semicolon and newlines. */
function escape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\r?\n/g, "\\n");
}

export function buildVCard(c: VCardContact) {
  const first = c.first_name.trim();
  const last = c.last_name.trim();
  const fullName = [first, last].filter(Boolean).join(" ") || c.mobile?.trim() || "Paciente";

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escape(last)};${escape(first)};;;`,
    `FN:${escape(fullName)}`,
  ];
  if (c.mobile) lines.push(`TEL;TYPE=CELL:${toE164(c.mobile)}`);
  if (c.email) lines.push(`EMAIL;TYPE=INTERNET:${escape(c.email.trim())}`);
  lines.push("END:VCARD");
  return lines.join("\r\n") + "\r\n";
}

export function vcardFileName(c: Pick<VCardContact, "first_name" | "last_name">) {
  const slug = `${c.first_name} ${c.last_name}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "contacto"}.vcf`;
}
