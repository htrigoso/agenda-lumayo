import Avatar from "@mui/material/Avatar";

// Dark enough for white initials to stay readable.
const COLORS = [
  "#c62828",
  "#ad1457",
  "#6a1b9a",
  "#4527a0",
  "#283593",
  "#1565c0",
  "#00838f",
  "#00695c",
  "#2e7d32",
  "#bf360c",
  "#4e342e",
  "#37474f",
];

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
