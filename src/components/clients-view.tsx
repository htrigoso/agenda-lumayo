"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
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
};

const subscribe = () => () => {};

/**
 * Desktop (md+) renders the table with page-based pagination; mobile renders
 * only cards with a "Ver más" button. Before hydration both are in the HTML
 * (hidden with CSS, so there is no layout flash); after hydration only the one
 * matching the viewport stays mounted.
 */
export function ClientsView({ clients, matches, page, pageCount, from, to, term, onlyPriority }: Props) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);

  const showTable = hydrated ? isDesktop : true;
  const showCards = hydrated ? !isDesktop : true;
  const emptyMessage =
    term || onlyPriority ? "Ningún cliente coincide con tu búsqueda." : "Aún no hay clientes. ¡Agrega el primero!";

  return (
    <>
      {showTable && (
        <Stack spacing={3} sx={{ display: hydrated ? "flex" : { xs: "none", md: "flex" } }}>
          <ClientsTable clients={clients} emptyMessage={emptyMessage} />
          <ClientsPagination page={page} pageCount={pageCount} from={from} to={to} total={matches} />
        </Stack>
      )}
      {showCards && (
        <Box sx={{ display: hydrated ? "block" : { xs: "block", md: "none" } }}>
          <ClientCards
            key={`${term}|${onlyPriority}|${page}|${clients.map((c) => c.id).join(",")}`}
            initial={clients}
            total={matches}
            page={page}
            term={term}
            onlyPriority={onlyPriority}
          />
        </Box>
      )}
    </>
  );
}
