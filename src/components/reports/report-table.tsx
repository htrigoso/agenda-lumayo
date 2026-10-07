"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

export type Column<T> = {
  label: string;
  align?: "left" | "right";
  render: (row: T) => React.ReactNode;
};

/** Table on desktop, one card per row on phones (first column is the card title). */
export function ReportTable<T>({
  columns,
  rows,
  rowKey,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  empty: string;
}) {
  if (rows.length === 0) {
    return <Paper sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>{empty}</Paper>;
  }
  const [title, ...rest] = columns;
  return (
    <>
      <TableContainer component={Paper} sx={{ display: { xs: "none", md: "block" } }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableCell key={c.label} align={c.align} sx={{ fontWeight: 700 }}>
                  {c.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={rowKey(row, i)} hover>
                {columns.map((c) => (
                  <TableCell key={c.label} align={c.align} sx={{ fontVariantNumeric: c.align === "right" ? "tabular-nums" : undefined }}>
                    {c.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack spacing={1.5} sx={{ display: { xs: "flex", md: "none" } }}>
        {rows.map((row, i) => (
          <Paper key={rowKey(row, i)} sx={{ p: 2 }}>
            <Box sx={{ fontWeight: 700, mb: 1, overflowWrap: "anywhere" }}>{title.render(row)}</Box>
            <Stack spacing={0.5}>
              {rest.map((c) => (
                <Stack key={c.label} direction="row" sx={{ justifyContent: "space-between", gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {c.label}
                  </Typography>
                  <Typography variant="body2" sx={{ textAlign: "right", overflowWrap: "anywhere" }}>
                    {c.render(row)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>
        ))}
      </Stack>
    </>
  );
}
