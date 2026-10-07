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
import Typography from "@mui/material/Typography";
import EditIcon from "@mui/icons-material/EditOutlined";
import type { Client } from "@/components/client-form";
import { ClientAvatar } from "@/components/client-avatar";
import { MotionTableBody, MotionTableRow, containerVariants, itemVariants } from "@/components/motion";
import { DeleteClientButton } from "@/components/delete-client-button";
import { whatsappUrl } from "@/lib/phone";
import { formatRecordNumber } from "@/lib/record";
import { PriorityChip } from "@/components/priority-chip";

export function ClientsTable({ clients, emptyMessage }: { clients: Client[]; emptyMessage: string }) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Paciente</TableCell>
            <TableCell>Celular</TableCell>
            <TableCell>WhatsApp</TableCell>
            <TableCell>Correo</TableCell>
            <TableCell>Descripción</TableCell>
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <MotionTableBody variants={containerVariants} initial="hidden" animate="show">
          {clients.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
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
              <TableCell>{c.email ?? "—"}</TableCell>
              <TableCell sx={{ maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.description ?? "—"}
              </TableCell>
              <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                <IconButton href={`/clients/${c.id}`} aria-label="Editar" title="Editar">
                  <EditIcon />
                </IconButton>
                <DeleteClientButton id={c.id} name={`${c.first_name} ${c.last_name}`} />
              </TableCell>
            </MotionTableRow>
          ))}
        </MotionTableBody>
      </Table>
    </TableContainer>
  );
}
