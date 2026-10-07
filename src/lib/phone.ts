/** Builds a wa.me link. Peruvian mobiles (9 digits starting with 9) get the 51 prefix. */
export function whatsappUrl(phone: string, text?: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 9 && digits.startsWith("9")) digits = `51${digits}`;
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${query}`;
}
