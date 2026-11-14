"use client";

import { useState } from "react";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import type { CallLog } from "@/app/(app)/clients/actions";
import { CallHistory } from "@/components/call-history";
import { ClientForm, type Client } from "@/components/client-form";
import { LastCall } from "@/components/last-call";
import { Reveal } from "@/components/motion";
import { AZUL, GOLD } from "@/lib/brand";
import { formatRecordNumber } from "@/lib/record";

type Props = {
  client: Client;
  calls: CallLog[];
  /** Lima calendar day (YYYY-MM-DD). */
  today: string;
  /** Workers only see the call history: no file form, no tabs. */
  isAdmin: boolean;
  initialTab: "ficha" | "llamadas";
};

export function PatientTabs({ client, calls, today, isAdmin, initialTab }: Props) {
  const [tab, setTab] = useState<"ficha" | "llamadas">(initialTab);
  const name = `${client.first_name} ${client.last_name}`;
  // The newest call in the history is the one summarized on the patient row.
  const lastCaller: Record<string, string> =
    client.last_call_by && calls[0]?.staff_name ? { [client.last_call_by]: calls[0].staff_name } : {};
  const callsLabel = calls.length > 0 ? `Llamadas (${calls.length})` : "Llamadas";
  const history = <CallHistory clientId={client.id} name={name} mobile={client.mobile} whatsapp={client.whatsapp} calls={calls} isAdmin={isAdmin} />;
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
          {(client.last_call_at || client.next_call_on) && (
            <LastCall call={client} staffNames={lastCaller} today={today} />
          )}
        </Stack>
      </Reveal>
      {isAdmin ? (
        <>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}>
            <Tab value="ficha" label="Ficha" />
            <Tab value="llamadas" label={callsLabel} />
          </Tabs>
          {/* Both stay mounted so unsaved form edits survive a tab switch. */}
          <Box hidden={tab !== "ficha"}>
            <ClientForm client={client} />
          </Box>
          <Box hidden={tab !== "llamadas"}>{history}</Box>
        </>
      ) : (
        <>
          <Tabs value="llamadas" sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}>
            <Tab value="llamadas" label={callsLabel} />
          </Tabs>
          {history}
        </>
      )}
    </Box>
  );
}
