import Avatar from "@mui/material/Avatar";
import { AQUA, AZUL } from "@/lib/brand";

// Brand blues and aquas (Brandbook V2, pág. 10), dark enough for white initials to stay readable.
const COLORS = [AZUL[700], AZUL[800], AZUL[900], AZUL[950], AQUA[600], AQUA[700], AQUA[800], AZUL[600]];

function colorFor(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length];
}

export function ClientAvatar({
  id,
  firstName,
  lastName,
  size = 40,
}: {
  id: string;
  firstName: string;
  lastName: string;
  size?: number;
}) {
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
  return (
    <Avatar sx={{ bgcolor: colorFor(id), color: "#fff", width: size, height: size, fontSize: size * 0.4, fontWeight: 600 }}>
      {initials}
    </Avatar>
  );
}
