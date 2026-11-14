/** Only the contact fields go into the card: clinical data must never reach a personal phone book. */
export type VCardContact = {
  first_name: string;
  last_name: string;
  mobile: string | null;
  whatsapp?: string | null;
  email: string | null;
};

/** The number saved on the phone: the mobile, or the WhatsApp number when there is no mobile. */
export function contactPhone(c: { mobile: string | null; whatsapp?: string | null }) {
  return c.mobile?.trim() || c.whatsapp?.trim() || null;
}

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
  const phone = contactPhone(c);
  const fullName = [first, last].filter(Boolean).join(" ") || phone || "Paciente";

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escape(last)};${escape(first)};;;`,
    `FN:${escape(fullName)}`,
  ];
  if (phone) lines.push(`TEL;TYPE=CELL:${toE164(phone)}`);
  if (c.email) lines.push(`EMAIL;TYPE=INTERNET:${escape(c.email.trim())}`);
  lines.push("END:VCARD");
  return lines.join("\r\n") + "\r\n";
}

/**
 * Chrome-on-Android intent that opens the phone's native "new contact" form pre-filled
 * (ContactsContract.Intents.Insert). If no app can handle it, Chrome follows `fallbackUrl`.
 */
export function androidContactIntent(c: VCardContact, fallbackUrl: string) {
  const phone = contactPhone(c);
  const name = [c.first_name.trim(), c.last_name.trim()].filter(Boolean).join(" ") || phone || "Paciente";
  const parts = [
    "action=android.intent.action.INSERT",
    "type=vnd.android.cursor.dir/raw_contact",
    `S.name=${encodeURIComponent(name)}`,
  ];
  if (phone) parts.push(`S.phone=${encodeURIComponent(toE164(phone))}`, "i.phone_type=2");
  if (c.email) parts.push(`S.email=${encodeURIComponent(c.email.trim())}`);
  parts.push(`S.browser_fallback_url=${encodeURIComponent(fallbackUrl)}`);
  return `intent:#Intent;${parts.join(";")};end`;
}

export function vcardFileName(c: Pick<VCardContact, "first_name" | "last_name">) {
  const slug = `${c.first_name} ${c.last_name}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "contacto"}.vcf`;
}
