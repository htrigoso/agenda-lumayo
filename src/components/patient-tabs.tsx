"use client";

import NextLink from "next/link";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ClientForm, type Client } from "@/components/client-form";
import { Reveal } from "@/components/motion";
import { AZUL, GOLD } from "@/lib/brand";
import { formatRecordNumber } from "@/lib/record";

export function PatientTabs({ client }: { client: Client }) {
  return (
    <Box>
      <Reveal y={10}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap", mb: 3, rowGap: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {client.first_name} {client.last_name}
          </Typography>
          {client.record_number !== undefined && (
            <Chip color="primary" label={`H.C. N.º ${formatRecordNumber(client.record_number)}`} sx={{ fontWeight: 700 }} />
          )}
          {client.legacy_record_number && <Chip variant="outlined" label={`Historia anterior: ${client.legacy_record_number}`} />}
          {client.membership && (
            <Chip
              component={NextLink}
              href={`/membresias/${client.membership.id}`}
              clickable
              label={`Membresía ${client.membership.plan === "gold" ? "Dorada" : "Clásica"} · ${client.membership.code}`}
              sx={{
                fontWeight: 700,
                color: "#fff",
                background: client.membership.plan === "gold" ? GOLD.gradient : AZUL[700],
                textShadow: client.membership.plan === "gold" ? "0 1px 2px rgba(60,40,5,0.45)" : undefined,
              }}
            />
          )}
        </Stack>
      </Reveal>
      <ClientForm client={client} />
    </Box>
  );
}
