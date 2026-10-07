"use client";

import { useState, useTransition } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import EditIcon from "@mui/icons-material/EditOutlined";
import EmailIcon from "@mui/icons-material/EmailOutlined";
import PhoneIcon from "@mui/icons-material/PhoneOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { loadMoreClients } from "@/app/clients/actions";
import type { Client } from "@/components/client-form";
import { ClientAvatar } from "@/components/client-avatar";
import { DeleteClientButton } from "@/components/delete-client-button";
import { whatsappUrl } from "@/lib/phone";
import { formatRecordNumber } from "@/lib/record";
import { PriorityChip } from "@/components/priority-chip";

type Props = {
  initial: Client[];
  /** Total rows matching the current search/filter across all pages. */
  total: number;
  /** Page number that `initial` was loaded from. */
  page: number;
  term: string;
  onlyPriority: boolean;
};

export function ClientCards({ initial, total, page, term, onlyPriority }: Props) {
  const [items, setItems] = useState(initial);
  const [lastPage, setLastPage] = useState(page);
  const [removed, setRemoved] = useState(0);
  const [pending, startTransition] = useTransition();

  const remaining = total - removed - items.length - (page - 1) * 50 > 0;

  function loadMore() {
    startTransition(async () => {
      const next = await loadMoreClients(lastPage + 1, term, onlyPriority);
      setItems((prev) => [...prev, ...next.filter((n) => !prev.some((p) => p.id === n.id))]);
      setLastPage((p) => p + 1);
    });
  }

  if (items.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
        {term || onlyPriority ? "Ningún paciente coincide con tu búsqueda." : "Aún no hay pacientes. ¡Agrega el primero!"}
      </Paper>
    );
  }

  return (
    <Stack spacing={1.5}>
      {items.map((c) => (
        <Paper key={c.id} sx={{ p: 2, ...(c.is_priority && { borderLeft: 4, borderColor: "warning.main" }) }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <ClientAvatar id={c.id} firstName={c.first_name} lastName={c.last_name} size={40} />
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 600, overflowWrap: "anywhere" }}>
                {c.first_name} {c.last_name}
              </Typography>
              {c.record_number !== undefined && (
                <Typography variant="caption" color="text.secondary">
                  H.C. {formatRecordNumber(c.record_number)}
                </Typography>
              )}
            </Box>
            <IconButton href={`/clients/${c.id}`} aria-label="Editar">
              <EditIcon />
            </IconButton>
            <DeleteClientButton
              id={c.id}
              name={`${c.first_name} ${c.last_name}`}
              onDeleted={() => {
                setItems((prev) => prev.filter((p) => p.id !== c.id));
                setRemoved((n) => n + 1);
              }}
            />
          </Stack>
          {(c.mobile || c.whatsapp || c.email || c.description) && <Divider sx={{ my: 1.5 }} />}
          <Stack spacing={0.75}>
            {c.mobile && (
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <PhoneIcon fontSize="small" color="action" />
                <Link href={`tel:${c.mobile}`} underline="hover" color="inherit">
                  {c.mobile}
                </Link>
              </Stack>
            )}
            {c.whatsapp && (
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <WhatsAppIcon fontSize="small" sx={{ color: "#25d366" }} />
                <Link href={whatsappUrl(c.whatsapp)} target="_blank" rel="noreferrer" underline="hover">
                  {c.whatsapp}
                </Link>
              </Stack>
            )}
            {c.email && (
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <EmailIcon fontSize="small" color="action" />
                <Link href={`mailto:${c.email}`} underline="hover" color="inherit" sx={{ overflowWrap: "anywhere" }}>
                  {c.email}
                </Link>
              </Stack>
            )}
            {c.description && (
              <Typography variant="body2" color="text.secondary" sx={{ pt: 0.5 }}>
                {c.description}
              </Typography>
            )}
          </Stack>
          {c.is_priority && (
            <Stack direction="row" sx={{ justifyContent: "flex-end", mt: 1.5 }}>
              <PriorityChip />
            </Stack>
          )}
        </Paper>
      ))}

      <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
        Mostrando {items.length} de {total - removed}
      </Typography>
      {remaining && (
        <Button variant="outlined" size="large" onClick={loadMore} disabled={pending}>
          {pending ? "Cargando..." : "Ver más"}
        </Button>
      )}
    </Stack>
  );
}
