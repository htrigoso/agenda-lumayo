/** Spanish surname particles that belong to the surname that follows ("De la Cruz", "del Águila"). */
const PARTICLES = new Set(["de", "del", "la", "las", "los", "san", "santa", "y"]);

function words(s: string) {
  return s.trim().split(/\s+/).filter(Boolean);
}

/** First surname, keeping leading particles: "De la Cruz Pérez" → "De la Cruz". */
function firstSurname(lastName: string) {
  const parts = words(lastName);
  const taken: string[] = [];
  for (const part of parts) {
    taken.push(part);
    if (!PARTICLES.has(part.toLowerCase())) break;
  }
  return taken.join(" ");
}

/** Short display name for compact UI: first given name + first surname ("Jack Izquierdo"). */
export function shortName(firstName: string, lastName: string) {
  return [words(firstName)[0] ?? "", firstSurname(lastName)].filter(Boolean).join(" ");
}
