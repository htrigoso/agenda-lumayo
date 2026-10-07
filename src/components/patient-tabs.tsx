"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { HistoryPanel } from "@/components/history/history-panel";
import { OdontogramPanel } from "@/components/odontogram/odontogram-panel";
import { BudgetPanel } from "@/components/budget/budget-panel";
import { ClientForm, type Client } from "@/components/client-form";

export function PatientTabs({ client }: { client: Client }) {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}>
        <Tab label="Datos" />
        <Tab label="Odontograma" />
        <Tab label="Historia" />
        <Tab label="Presupuesto y pagos" />
      </Tabs>
      {tab === 0 && <ClientForm client={client} />}
      {tab === 1 && <OdontogramPanel clientId={client.id} />}
      {tab === 2 && <HistoryPanel clientId={client.id} />}
      {tab === 3 && <BudgetPanel clientId={client.id} />}
    </Box>
  );
}
