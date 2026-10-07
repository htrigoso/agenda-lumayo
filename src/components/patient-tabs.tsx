"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { HistoryPanel } from "@/components/history/history-panel";
import { OdontogramPanel } from "@/components/odontogram/odontogram-panel";
import { BudgetPanel } from "@/components/budget/budget-panel";
import { ClientForm, type Client } from "@/components/client-form";
import { formatRecordNumber } from "@/lib/record";

export function PatientTabs({ client }: { client: Client }) {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap", mb: 2, rowGap: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {client.first_name} {client.last_name}
        </Typography>
        {client.record_number !== undefined && (
          <Chip color="primary" label={`H.C. N.º ${formatRecordNumber(client.record_number)}`} sx={{ fontWeight: 700 }} />
        )}
        {client.legacy_record_number && (
          <Chip variant="outlined" label={`Historia anterior: ${client.legacy_record_number}`} />
        )}
      </Stack>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}>
        <Tab label="Datos" />
        <Tab label="Odontograma" />
        <Tab label="Historia" />
        <Tab label="Presupuesto y pagos" />
      </Tabs>
      {tab === 0 && <ClientForm client={client} />}
      {tab === 1 && <OdontogramPanel clientId={client.id} />}
      {tab === 2 && <HistoryPanel clientId={client.id} recordNumber={client.record_number} legacyNumber={client.legacy_record_number ?? null} />}
      {tab === 3 && <BudgetPanel clientId={client.id} />}
    </Box>
  );
}
