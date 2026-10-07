"use client";

import { useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import AddIcon from "@mui/icons-material/Add";
import { AppointmentDialog, type DialogState } from "@/components/agenda/appointment-dialog";
import { DayList } from "@/components/agenda/day-list";

const CalendarDesktop = dynamic(() => import("@/components/agenda/calendar-desktop"), {
  ssr: false,
  loading: () => <Skeleton variant="rounded" height={600} />,
});

const subscribe = () => () => {};

export function AgendaView() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);

  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const bump = () => setRefreshKey((k) => k + 1);

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Agenda
        </Typography>
        {isDesktop && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ startsAt: new Date() })}>
            Nueva cita
          </Button>
        )}
      </Stack>

      {!hydrated ? (
        <Skeleton variant="rounded" height={400} />
      ) : isDesktop ? (
        <CalendarDesktop
          refreshKey={refreshKey}
          onCreate={(startsAt) => setDialog({ startsAt })}
          onSelect={(appointment) => setDialog({ appointment })}
        />
      ) : (
        <Box>
          <DayList
            refreshKey={refreshKey}
            onCreate={(startsAt) => setDialog({ startsAt })}
            onSelect={(appointment) => setDialog({ appointment })}
          />
        </Box>
      )}

      <AppointmentDialog state={dialog} onClose={() => setDialog(null)} onChanged={bump} />
    </Stack>
  );
}
