"use client";

import { useSyncExternalStore, useTransition } from "react";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { Client } from "@/components/client-form";
import { ClientCards } from "@/components/client-cards";
import { ClientsPagination } from "@/components/clients-pagination";
import { ClientsTable } from "@/components/clients-table";

type Props = {
  clients: Client[];
  matches: number;
  page: number;
  pageCount: number;
  from: number;
  to: number;
  term: string;
  onlyPriority: boolean;
  onlyNew: boolean;
  onlyDue: boolean;
  staffNames: Record<string, string>;
  today: string;
  /** Workers get a read-only list: no edit or delete. */
  isAdmin: boolean;
};

const subscribe = () => () => {};

/**
 * Desktop (md+) renders the table with page-based pagination; mobile renders
 * only cards with a "Ver más" button. Before hydration both are in the HTML
 * (hidden with CSS, so there is no layout flash); after hydration only the one
 * matching the viewport stays mounted.
 */
export function ClientsView({
  clients,
  matches,
  page,
  pageCount,
  from,
  to,
  term,
  onlyPriority,
  onlyNew,
  onlyDue,
  staffNames,
  today,
  isAdmin,
}: Props) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  // Page changes run inside a transition so the current table stays visible (dimmed) until the next one arrives.
  const [pending, startTransition] = useTransition();

  const showTable = hydrated ? isDesktop : true;
  const showCards = hydrated ? !isDesktop : true;
  const emptyMessage =
    term || onlyPriority || onlyNew || onlyDue ? "Ningún paciente coincide con tu búsqueda." : "Aún no hay pacientes. ¡Agrega el primero!";

  return (
    <>
      {showTable && (
        <Stack spacing={3} sx={{ display: hydrated ? "flex" : { xs: "none", md: "flex" } }}>
          <Box sx={{ position: "relative" }} aria-busy={pending}>
            {pending && (
              <LinearProgress sx={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 2, borderRadius: 1 }} />
            )}
            <Box sx={{ opacity: pending ? 0.4 : 1, transition: "opacity 150ms", pointerEvents: pending ? "none" : "auto" }}>
              <ClientsTable clients={clients} emptyMessage={emptyMessage} staffNames={staffNames} today={today} isAdmin={isAdmin} />
            </Box>
            {pending && (
              <Box
                role="status"
                aria-label="Cargando página"
                sx={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", pt: 12, zIndex: 1 }}
              >
                <CircularProgress />
              </Box>
            )}
          </Box>
          <ClientsPagination
            page={page}
            pageCount={pageCount}
            from={from}
            to={to}
            total={matches}
            pending={pending}
            onNavigate={(navigate) => startTransition(navigate)}
          />
        </Stack>
      )}
      {showCards && (
        <Box sx={{ display: hydrated ? "block" : { xs: "block", md: "none" } }}>
          <ClientCards
            key={`${term}|${onlyPriority}|${onlyNew}|${onlyDue}|${page}|${clients.map((c) => c.id).join(",")}`}
            initial={clients}
            total={matches}
            page={page}
            term={term}
            onlyPriority={onlyPriority}
            onlyNew={onlyNew}
            onlyDue={onlyDue}
            staffNames={staffNames}
            today={today}
            isAdmin={isAdmin}
          />
        </Box>
      )}
    </>
  );
}
