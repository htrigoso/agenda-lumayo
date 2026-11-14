"use client";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import EditIcon from "@mui/icons-material/EditOutlined";
import PhoneIcon from "@mui/icons-material/PhoneOutlined";
import type { Client } from "@/components/client-form";
import { ClientAvatar } from "@/components/client-avatar";
import { MotionTableBody, MotionTableRow, containerVariants, itemVariants } from "@/components/motion";
import { DeleteClientButton } from "@/components/delete-client-button";
import { whatsappUrl } from "@/lib/phone";
import { formatRecordNumber } from "@/lib/record";
import { PriorityChip } from "@/components/priority-chip";
import { NewChip } from "@/components/new-chip";
import { NEW_TAG } from "@/lib/clients-query";
import { SaveContactButton } from "@/components/save-contact-button";
import { LastCall } from "@/components/last-call";

type Props = {
  clients: Client[];
  emptyMessage: string;
  /** staff user_id → full name, for "who called". */
  staffNames: Record<string, string>;
  /** Lima calendar day (YYYY-MM-DD). */
  today: string;
  /** Workers get a read-only list: no edit or delete. */
  isAdmin: boolean;
};

export function ClientsTable({ clients, emptyMessage, staffNames, today, isAdmin }: Props) {
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Paciente</TableCell>
            <TableCell>Celular</TableCell>
            <TableCell>WhatsApp</TableCell>
            <TableCell>Última llamada</TableCell>
            <TableCell align="center">Contacto</TableCell>
            {isAdmin && <TableCell align="right">Acciones</TableCell>}
          </TableRow>
        </TableHead>
        <MotionTableBody variants={containerVariants} initial="hidden" animate="show">
          {clients.length === 0 && (
            <TableRow>
              <TableCell colSpan={isAdmin ? 6 : 5} align="center" sx={{ py: 6, color: "text.secondary" }}>
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
          {clients.map((c) => (
            <MotionTableRow key={c.id} variants={itemVariants} hover sx={c.is_priority ? { bgcolor: "rgba(237, 108, 2, 0.06)" } : undefined}>
              <TableCell>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <ClientAvatar id={c.id} firstName={c.first_name} lastName={c.last_name} size={36} />
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>
                      {c.first_name} {c.last_name}
                    </Typography>
                    {c.record_number !== undefined && (
                      <Typography variant="caption" color="text.secondary">
                        H.C. {formatRecordNumber(c.record_number)}
                      </Typography>
                    )}
                  </Box>
                  {c.is_priority && <PriorityChip />}
                  {c.tags?.includes(NEW_TAG) && <NewChip />}
                </Stack>
              </TableCell>
              <TableCell>{c.mobile ?? "—"}</TableCell>
              <TableCell>
                {c.whatsapp ? (
                  <Link href={whatsappUrl(c.whatsapp)} target="_blank" rel="noreferrer" underline="hover">
                    {c.whatsapp}
                  </Link>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                <LastCall call={c} staffNames={staffNames} today={today} maxWidth={220} />
              </TableCell>
              <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                <Tooltip title="Llamadas">
                  <IconButton href={`/clients/${c.id}?tab=llamadas`} aria-label="Llamadas">
                    <PhoneIcon />
                  </IconButton>
                </Tooltip>
                {isAdmin && <SaveContactButton id={c.id} firstName={c.first_name} lastName={c.last_name} mobile={c.mobile} whatsapp={c.whatsapp} savedAt={c.contact_saved_at} />}
              </TableCell>
              {isAdmin && (
                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                  <IconButton href={`/clients/${c.id}`} aria-label="Editar" title="Editar">
                    <EditIcon />
                  </IconButton>
                  <DeleteClientButton id={c.id} name={`${c.first_name} ${c.last_name}`} />
                </TableCell>
              )}
            </MotionTableRow>
          ))}
        </MotionTableBody>
      </Table>
    </TableContainer>
  );
}
