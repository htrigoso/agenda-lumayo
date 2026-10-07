import { Suspense } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import StarIcon from "@mui/icons-material/Star";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import PhoneIcon from "@mui/icons-material/PhoneOutlined";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/EditOutlined";
import EmailIcon from "@mui/icons-material/EmailOutlined";
import GroupIcon from "@mui/icons-material/GroupOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { AppShell } from "@/components/app-shell";
import { DeleteClientButton } from "@/components/delete-client-button";
import { SearchBox } from "@/components/search-box";
import { createClient } from "@/lib/supabase/server";

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Paper
      sx={{
        p: { xs: 1.5, sm: 2.5 },
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-start", sm: "center" },
        gap: { xs: 1, sm: 2 },
        height: "100%",
      }}
    >
      <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText", width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}>
        {icon}
      </Avatar>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: 12, sm: 14 } }}>
          {label}
        </Typography>
      </Box>
    </Paper>
  );
}

function PriorityChip() {
  return <Chip size="small" color="warning" icon={<StarIcon />} label="Potencial" sx={{ fontWeight: 600 }} />;
}

async function Dashboard({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const { q } = await searchParams;
  const term = typeof q === "string" ? q.trim().replace(/[,()%]/g, "") : "";

  const supabase = await createClient();
  const { data: all } = await supabase.from("clients").select("id, whatsapp, email");
  let query = supabase.from("clients").select("*").order("is_priority", { ascending: false }).order("first_name");
  if (term) {
    query = query.or(
      `first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,mobile.ilike.%${term}%`,
    );
  }
  const { data: clients } = await query;

  const total = all?.length ?? 0;
  const withWhatsapp = all?.filter((c) => c.whatsapp).length ?? 0;
  const withEmail = all?.filter((c) => c.email).length ?? 0;

  return (
    <Stack spacing={3}>
      <Grid container spacing={{ xs: 1, sm: 2 }}>
        <Grid size={4}>
          <StatCard label="Total de clientes" value={total} icon={<GroupIcon />} />
        </Grid>
        <Grid size={4}>
          <StatCard label="Con WhatsApp" value={withWhatsapp} icon={<WhatsAppIcon />} />
        </Grid>
        <Grid size={4}>
          <StatCard label="Con correo" value={withEmail} icon={<EmailIcon />} />
        </Grid>
      </Grid>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <SearchBox initial={term} />
        <Button href="/clients/new" variant="contained" startIcon={<AddIcon />}>
          Nuevo cliente
        </Button>
      </Stack>

      <TableContainer component={Paper} sx={{ display: { xs: "none", md: "block" } }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cliente</TableCell>
              <TableCell>Celular</TableCell>
              <TableCell>WhatsApp</TableCell>
              <TableCell>Correo</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                  {term ? "Ningún cliente coincide con tu búsqueda." : "Aún no hay clientes. ¡Agrega el primero!"}
                </TableCell>
              </TableRow>
            )}
            {clients?.map((c) => (
              <TableRow key={c.id} hover sx={c.is_priority ? { bgcolor: "rgba(237, 108, 2, 0.06)" } : undefined}>
                <TableCell>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <Avatar sx={{ bgcolor: "primary.light", width: 36, height: 36, fontSize: 14 }}>
                      {(c.first_name[0] ?? "").toUpperCase()}
                      {(c.last_name[0] ?? "").toUpperCase()}
                    </Avatar>
                    <Typography sx={{ fontWeight: 600 }}>
                      {c.first_name} {c.last_name}
                    </Typography>
                    {c.is_priority && <PriorityChip />}
                  </Stack>
                </TableCell>
                <TableCell>{c.mobile ?? "—"}</TableCell>
                <TableCell>
                  {c.whatsapp ? (
                    <Link href={`https://wa.me/${c.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" underline="hover">
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack spacing={1.5} sx={{ display: { xs: "flex", md: "none" } }}>
        {clients?.length === 0 && (
          <Paper sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
            {term ? "Ningún cliente coincide con tu búsqueda." : "Aún no hay clientes. ¡Agrega el primero!"}
          </Paper>
        )}
        {clients?.map((c) => (
          <Paper key={c.id} sx={{ p: 2, ...(c.is_priority && { borderLeft: 4, borderColor: "warning.main" }) }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Avatar sx={{ bgcolor: "primary.light", width: 40, height: 40, fontSize: 14 }}>
                {(c.first_name[0] ?? "").toUpperCase()}
                {(c.last_name[0] ?? "").toUpperCase()}
              </Avatar>
              <Typography sx={{ fontWeight: 600, flexGrow: 1, minWidth: 0, overflowWrap: "anywhere" }}>
                {c.first_name} {c.last_name}
              </Typography>
              {c.is_priority && <PriorityChip />}
              <IconButton href={`/clients/${c.id}`} aria-label="Editar">
                <EditIcon />
              </IconButton>
              <DeleteClientButton id={c.id} name={`${c.first_name} ${c.last_name}`} />
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
                  <Link href={`https://wa.me/${c.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" underline="hover">
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
          </Paper>
        ))}
      </Stack>
    </Stack>
  );
}

export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <AppShell>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Clientes
      </Typography>
      <Suspense fallback={<Skeleton variant="rounded" height={320} />}>
        <Dashboard searchParams={searchParams} />
      </Suspense>
    </AppShell>
  );
}
