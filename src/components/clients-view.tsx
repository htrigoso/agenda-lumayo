"use client";

import type { Client } from "@/components/client-form";
import { type ListFilters, filtersHref } from "@/lib/list-filters";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import { useListNavigation } from "@/components/list-navigation";
import { ClientCards } from "@/components/client-cards";

type Props = {
  clients: Client[];
  matches: number;
  page: number;
  pageSize: number;
  filters: ListFilters;
  staffNames: Record<string, string>;
  today: string;
  isAdmin: boolean;
};

/** Patient list: a responsive grid of cards on every screen size, with "Ver más" to load the next page. */
export function ClientsView({ clients, matches, page, pageSize, filters, staffNames, today, isAdmin }: Props) {
  const { pending } = useListNavigation();
  return (
    // While a search/filter loads, the current cards stay dimmed under a progress bar and spinner.
    <Box sx={{ position: "relative" }} aria-busy={pending}>
      {pending && <LinearProgress sx={{ position: "absolute", top: -8, left: 0, right: 0, zIndex: 2, borderRadius: 1 }} />}
      <Box sx={{ opacity: pending ? 0.4 : 1, transition: "opacity 150ms", pointerEvents: pending ? "none" : "auto" }}>
    <ClientCards
      // Remount (reset loaded pages) whenever the search, filters or first page change.
      key={`${filtersHref(filters, page)}|${clients.map((c) => c.id).join(",")}`}
      initial={clients}
      total={matches}
      page={page}
      pageSize={pageSize}
      filters={filters}
      staffNames={staffNames}
      today={today}
      isAdmin={isAdmin}
    />
      </Box>
      {pending && (
        <Box
          role="status"
          aria-label="Cargando pacientes"
          sx={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "flex-start", pt: 10, zIndex: 1 }}
        >
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
}
