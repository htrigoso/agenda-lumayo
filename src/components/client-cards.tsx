"use client";

import { useState, useTransition } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { loadMoreClients } from "@/app/(app)/clients/actions";
import type { Client } from "@/components/client-form";
import { ClientAvatar } from "@/components/client-avatar";
import { AnimatePresence, LiftCard, Stagger } from "@/components/motion";
import { whatsappUrl } from "@/lib/phone";
import { NewChip } from "@/components/new-chip";
import { NEW_TAG } from "@/lib/clients-query";
import { ClientCardMenu } from "@/components/client-card-menu";
import { shortName } from "@/lib/names";
import { LastCallIcon } from "@/components/last-call";

type Props = {
  initial: Client[];
  /** Total rows matching the current search/filter across all pages. */
  total: number;
  /** Page number that `initial` was loaded from. */
  page: number;
  /** Patients per page (150 on phones, 250 on desktop). */
  pageSize: number;
  term: string;
  onlyPriority: boolean;
  onlyNew: boolean;
  onlyDue: boolean;
  /** staff user_id → full name, for "who called". */
  staffNames: Record<string, string>;
  /** Lima calendar day (YYYY-MM-DD). */
  today: string;
  /** Workers get a read-only list: no edit or delete. */
  isAdmin: boolean;
};

export function ClientCards({ initial, total, page, pageSize, term, onlyPriority, onlyNew, onlyDue, staffNames, today, isAdmin }: Props) {
  const [items, setItems] = useState(initial);
  const [lastPage, setLastPage] = useState(page);
  const [removed, setRemoved] = useState(0);
  const [pending, startTransition] = useTransition();

  const remaining = total - removed - items.length - (page - 1) * pageSize > 0;

  function loadMore() {
    startTransition(async () => {
      const next = await loadMoreClients(lastPage + 1, term, onlyPriority, onlyNew, onlyDue, pageSize);
      setItems((prev) => [...prev, ...next.filter((n) => !prev.some((p) => p.id === n.id))]);
      setLastPage((p) => p + 1);
    });
  }

  if (items.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
        {term || onlyPriority || onlyNew || onlyDue ? "Ningún paciente coincide con tu búsqueda." : "Aún no hay pacientes. ¡Agrega el primero!"}
      </Paper>
    );
  }

  return (
    // As many 250px+ columns as fit: 1 on phones, 4 with the sidebar expanded, 5 when it is collapsed.
    <Stagger
      sx={{
        display: "grid",
        gap: 1.25,
        gridTemplateColumns: "repeat(auto-fill, minmax(min(250px, 100%), 1fr))",
        // Every card in a row stretches to the same height.
        alignItems: "stretch",
        // Footer (count and "Ver más") spans the whole row.
        "& > .cards-footer": { gridColumn: "1 / -1" },
      }}
    >
      <AnimatePresence initial={false}>
      {items.map((c) => {
        const chips = c.tags?.includes(NEW_TAG) && <NewChip />;
        return (
        <LiftCard
          key={c.id}
          sx={{
            px: 1.5,
            py: 1.25,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            ...(c.is_priority && { borderLeft: 4, borderColor: "warning.main" }),
          }}
        >
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
            <ClientAvatar id={c.id} firstName={c.first_name} lastName={c.last_name} size={32} />
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="body2" title={`${c.first_name} ${c.last_name}`} sx={{ fontWeight: 600, lineHeight: 1.3, overflowWrap: "anywhere" }}>
                {shortName(c.first_name, c.last_name)}
              </Typography>
            </Box>
            {/* Top-right corner: the "⋮" menu (potential patients have the orange left border). */}
            <Stack direction="row" spacing={0.25} sx={{ alignItems: "center", flexShrink: 0, mt: -0.5, mr: -1 }}>
              <ClientCardMenu
                client={c}
                isAdmin={isAdmin}
                onDeleted={() => {
                  setItems((prev) => prev.filter((p) => p.id !== c.id));
                  setRemoved((n) => n + 1);
                }}
              />
            </Stack>
          </Stack>
          {(c.whatsapp || c.last_call_at || c.next_call_on) && <Divider sx={{ my: 0.75 }} />}
          <Stack spacing={0.75}>
            {(c.whatsapp || c.last_call_at || c.next_call_on) && (
              // WhatsApp number on the left, last-call marker (opens a popover) on the right.
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                {c.whatsapp && (
                  <>
                    <WhatsAppIcon sx={{ color: "#25d366", fontSize: 16 }} />
                    <Link href={whatsappUrl(c.whatsapp)} target="_blank" rel="noreferrer" underline="hover" variant="body2">
                      {c.whatsapp}
                    </Link>
                  </>
                )}
                <Box sx={{ ml: "auto !important" }}>
                  <LastCallIcon call={c} staffNames={staffNames} today={today} />
                </Box>
              </Stack>
            )}
          </Stack>
          {chips && (
            // Pinned to the bottom so cards in a row line up.
            <Stack direction="row" sx={{ justifyContent: "flex-end", mt: "auto", pt: 0.75 }}>
              {chips}
            </Stack>
          )}
        </LiftCard>
        );
      })}
      </AnimatePresence>

      <Typography className="cards-footer" variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
        Mostrando {items.length} de {total - removed}
      </Typography>
      {remaining && (
        <Button className="cards-footer" variant="outlined" size="large" onClick={loadMore} disabled={pending}>
          {pending ? "Cargando..." : "Ver más"}
        </Button>
      )}
    </Stagger>
  );
}
