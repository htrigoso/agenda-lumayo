"use client";

import { useState, useTransition } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import PersonRemoveRoundedIcon from "@mui/icons-material/PersonRemoveRounded";
import { addAdditional, cancelMembership, removeAdditional, renewMembership, type MemberRow, type MembershipRow } from "@/app/(app)/membresias/actions";
import { AdditionalInput, toPayload, type AdditionalDraft } from "@/components/membership/additional-input";
import { CardFace } from "@/components/membership/card-face";
import { Eyebrow, MemberAvatar, SeatDots, StatusChip, ValidityBar } from "@/components/membership/ui";
import { Reveal } from "@/components/motion";
import { AQUA, AZUL, GOLD, INK, LINE } from "@/lib/brand";
import {
  PAYMENT_METHODS,
  PLANS,
  formatDate,
  formatSoles,
  memberDni,
  memberName,
  statusOf,
  suggestedRenewalStart,
  validityEnd,
} from "@/lib/membership";

type DialogKind = null | "add" | "renew" | "cancel";

function MemberItem({
  m,
  locked,
  pending,
  onRemove,
  onCopy,
}: {
  m: MemberRow;
  locked: boolean;
  pending: boolean;
  onRemove: (m: MemberRow) => void;
  onCopy: (code: string) => void;
}) {
  const external = !m.client_id;
  const dni = memberDni(m);
  const details = [m.role === "holder" ? "Titular" : m.relationship, dni ? `DNI ${dni}` : null, external && m.birth_date ? `Nac. ${formatDate(m.birth_date)}` : null, external ? m.mobile : null]
    .filter(Boolean)
    .join(" · ");
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", p: 1.25, border: `1px solid ${LINE}`, borderRadius: 1.5 }}>
      <MemberAvatar name={memberName(m)} role={m.role} external={external} />
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 0.5 }}>
          {m.client_id ? (
            <Link component={NextLink} href={`/clients/${m.client_id}`} underline="hover" sx={{ fontWeight: 600, color: "text.primary" }}>
              {memberName(m)}
            </Link>
          ) : (
            <Typography sx={{ fontWeight: 600 }}>{memberName(m)}</Typography>
          )}
          {m.role === "holder" && <Chip size="small" label="Titular" sx={{ bgcolor: AZUL[100], color: AZUL[700], height: 22 }} />}
          {external && <Chip size="small" variant="outlined" label="Sin ficha" sx={{ height: 22 }} />}
        </Stack>
        <Typography variant="body2" color="text.secondary" noWrap>{details}</Typography>
      </Box>
      {m.member_code && (
        <Tooltip title="Copiar código">
          <Chip
            size="small"
            label={m.member_code}
            onClick={() => onCopy(m.member_code!)}
            onDelete={() => onCopy(m.member_code!)}
            deleteIcon={<ContentCopyRoundedIcon />}
            sx={{ display: { xs: "none", sm: "inline-flex" }, fontFamily: "var(--font-geist-mono), monospace", bgcolor: AZUL[50] }}
          />
        </Tooltip>
      )}
      {m.role === "additional" && !locked && (
        <Tooltip title="Quitar de la membresía">
          <IconButton size="small" aria-label={`Quitar a ${memberName(m)}`} disabled={pending} onClick={() => onRemove(m)}>
            <PersonRemoveRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
}

export function MembershipDetail({ membership }: { membership: MembershipRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [removing, setRemoving] = useState<MemberRow | null>(null);

  const info = PLANS[membership.plan];
  const holder = membership.members.find((m) => m.role === "holder");
  const additional = membership.members.filter((m) => m.role === "additional");
  const members = holder ? [holder, ...additional] : additional;
  const period = membership.periods[0] ?? null;
  const current = period?.ends_on ?? null;
  const status = statusOf(current, membership.cancelled_at !== null);
  const full = additional.length >= info.maxAdditional;
  const free = Math.max(0, info.maxAdditional - additional.length);
  const taken = membership.members.flatMap((m) => (m.client_id ? [m.client_id] : []));
  const locked = status === "cancelled";
  const gold = membership.plan === "gold";

  const [renewOn, setRenewOn] = useState(() => suggestedRenewalStart(current));
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);

  function run(task: () => Promise<{ error?: string }>, done: string, after?: () => void) {
    setError(null);
    startTransition(async () => {
      const res = await task();
      if (res.error) return setError(res.error);
      after?.();
      setToast(done);
      router.refresh();
    });
  }

  async function add(d: AdditionalDraft) {
    const res = await addAdditional(membership.id, toPayload(d));
    if (res.error) return res.error;
    setDialog(null);
    setToast("Adicional agregado");
    router.refresh();
  }

  function copy(code: string) {
    navigator.clipboard?.writeText(code).then(() => setToast(`Código ${code} copiado`)).catch(() => undefined);
  }

  function openRenew() {
    setRenewOn(suggestedRenewalStart(current));
    setDialog("renew");
  }

  return (
    <Stack spacing={3}>
      <Breadcrumbs>
        <Link component={NextLink} href="/membresias" underline="hover" color="text.secondary">Membresías</Link>
        <Typography color="text.primary" sx={{ fontWeight: 600 }}>{membership.code}</Typography>
      </Breadcrumbs>

      <Reveal y={10}>
        <Paper sx={{ p: { xs: 2, sm: 3 }, overflow: "hidden", position: "relative" }}>
          <Box
            aria-hidden
            sx={{ position: "absolute", inset: 0, background: gold ? `linear-gradient(120deg, ${GOLD.soft} 0%, #fff 55%)` : `linear-gradient(120deg, ${AZUL[50]} 0%, #fff 55%)`, pointerEvents: "none" }}
          />
          <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 2.5, md: 4 }} sx={{ position: "relative", alignItems: { md: "center" } }}>
            <Box sx={{ width: { xs: "100%", md: 380 }, flexShrink: 0 }}>
              <CardFace plan={membership.plan} code={membership.code} additional={additional.length} />
            </Box>
            <Stack spacing={2} sx={{ flexGrow: 1, minWidth: 0 }}>
              <div>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1 }}>
                  <Typography variant="h5">Membresía {info.label}</Typography>
                  <StatusChip status={status} size="medium" />
                </Stack>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  Titular: <b style={{ color: INK[900] }}>{holder ? memberName(holder) : "—"}</b>
                </Typography>
              </div>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 7 }}>
                  <Eyebrow>Vigencia</Eyebrow>
                  <Typography sx={{ fontWeight: 600, mb: 0.75 }}>
                    {period ? `${formatDate(period.starts_on)} – ${formatDate(period.ends_on)}` : "Sin vigencia"}
                  </Typography>
                  <ValidityBar startsOn={period?.starts_on ?? null} endsOn={current} status={status} />
                </Grid>
                <Grid size={{ xs: 12, sm: 5 }}>
                  <Eyebrow>Cupos</Eyebrow>
                  <Typography sx={{ fontWeight: 600, mb: 0.75 }}>Titular + {additional.length} de {info.maxAdditional}</Typography>
                  <SeatDots used={additional.length} max={info.maxAdditional} plan={membership.plan} />
                </Grid>
              </Grid>

              {!locked && (
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                  <Button variant="contained" startIcon={<AutorenewRoundedIcon />} onClick={openRenew} disabled={pending}>
                    Renovar · {formatSoles(info.reaffiliationFee)}
                  </Button>
                  <Button variant="outlined" startIcon={<AddRoundedIcon />} onClick={() => setDialog("add")} disabled={full || pending}>
                    {full ? "Cupos completos" : "Agregar adicional"}
                  </Button>
                  <Button color="error" startIcon={<BlockRoundedIcon />} onClick={() => setDialog("cancel")} disabled={pending} sx={{ ml: { sm: "auto !important" } }}>
                    Anular
                  </Button>
                </Stack>
              )}
              {locked && membership.cancelled_at && (
                <Alert severity="warning" variant="outlined">
                  Anulada el {formatDate(membership.cancelled_at.slice(0, 10))}. Sus miembros ya pueden unirse a otra membresía.
                </Alert>
              )}
            </Stack>
          </Stack>
        </Paper>
      </Reveal>

      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

      <Grid container spacing={3} sx={{ alignItems: "flex-start" }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Titular y adicionales</Typography>
              <Typography variant="body2" color="text.secondary">{members.length} {members.length === 1 ? "persona" : "personas"}</Typography>
            </Stack>
            <Stack spacing={1}>
              {members.map((m) => (
                <MemberItem key={m.id} m={m} locked={locked} pending={pending} onRemove={setRemoving} onCopy={copy} />
              ))}
              {!locked && free > 0 && (
                <Box
                  component="button"
                  type="button"
                  onClick={() => setDialog("add")}
                  disabled={pending}
                  sx={{
                    all: "unset",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    p: 1.25,
                    borderRadius: 1.5,
                    border: `1.5px dashed ${LINE}`,
                    color: INK[600],
                    transition: "background-color .2s ease, border-color .2s ease",
                    "&:hover": { bgcolor: AQUA[50], borderColor: AQUA[300], color: AQUA[700] },
                    "&:focus-visible": { outline: `2px solid ${AZUL[600]}`, outlineOffset: 2 },
                  }}
                >
                  <Box sx={{ width: 40, height: 40, borderRadius: "50%", display: "grid", placeItems: "center", border: `1.5px dashed currentColor` }}>
                    <AddRoundedIcon fontSize="small" />
                  </Box>
                  <Typography sx={{ fontWeight: 600 }}>
                    Agregar adicional · {free === 1 ? "1 cupo libre" : `${free} cupos libres`}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Historial de pagos</Typography>
            <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0 }}>
              {membership.periods.map((p, i) => (
                <Box component="li" key={p.id} sx={{ position: "relative", pl: 3, pb: i === membership.periods.length - 1 ? 0 : 2 }}>
                  <Box sx={{ position: "absolute", left: 0, top: 5, width: 12, height: 12, borderRadius: "50%", bgcolor: i === 0 ? AQUA[500] : "#fff", border: `2px solid ${i === 0 ? AQUA[500] : LINE}` }} />
                  {i < membership.periods.length - 1 && <Box sx={{ position: "absolute", left: 5, top: 19, bottom: 0, width: 2, bgcolor: LINE }} />}
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {p.kind === "affiliation" ? "Afiliación" : "Renovación"} · {formatSoles(Number(p.fee))}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(p.starts_on)} – {formatDate(p.ends_on)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Pagado el {formatDate(p.paid_at)}{p.method ? ` · ${p.method}` : ""}
                  </Typography>
                </Box>
              ))}
            </Box>
            {membership.notes && (
              <Box sx={{ mt: 2.5, p: 1.5, borderRadius: 2, bgcolor: AZUL[50] }}>
                <Eyebrow>Notas</Eyebrow>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{membership.notes}</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={dialog === "add"} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>Agregar adicional</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {free === 1 ? "Queda 1 cupo libre" : `Quedan ${free} cupos libres`} en esta {info.label}.
          </Typography>
          <AdditionalInput excludeIds={taken} onAdd={add} disabled={pending} />
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setDialog(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={removing !== null} onClose={() => setRemoving(null)} fullWidth maxWidth="xs">
        <DialogTitle>¿Quitar a {removing ? memberName(removing) : ""}?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Deja de tener los beneficios de esta membresía y se libera un cupo. Podrá unirse a otra membresía.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setRemoving(null)}>Volver</Button>
          <Button
            color="error"
            variant="contained"
            disabled={pending}
            onClick={() => removing && run(() => removeAdditional(membership.id, removing.id), "Adicional quitado", () => setRemoving(null))}
          >
            Quitar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === "renew"} onClose={() => setDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle>Renovar membresía</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Inicio de la nueva vigencia"
              type="date"
              value={renewOn}
              onChange={(e) => setRenewOn(e.target.value || suggestedRenewalStart(current))}
              slotProps={{ inputLabel: { shrink: true } }}
              helperText={current && status !== "expired" ? "Continúa al día siguiente del vencimiento actual." : "La membresía venció: la nueva vigencia empieza hoy."}
            />
            <TextField select label="Método de pago" value={method} onChange={(e) => setMethod(e.target.value)}>
              {PAYMENT_METHODS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </TextField>
            <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: AZUL[50], border: `1px solid ${LINE}` }}>
              <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">Nueva vigencia</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDate(renewOn)} – {formatDate(validityEnd(renewOn))}</Typography>
              </Stack>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "baseline", mt: 1 }}>
                <Typography variant="body2" color="text.secondary">Re-afiliación</Typography>
                <Typography variant="h6" sx={{ color: AZUL[700] }}>{formatSoles(info.reaffiliationFee)}</Typography>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setDialog(null)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={pending}
            onClick={() => run(() => renewMembership(membership.id, renewOn, info.reaffiliationFee, method), "Membresía renovada", () => setDialog(null))}
          >
            Confirmar renovación
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === "cancel"} onClose={() => setDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle>¿Anular la membresía {membership.code}?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Deja de estar vigente y sus {members.length} miembros quedan libres para otra membresía. El historial se conserva. Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setDialog(null)}>Volver</Button>
          <Button color="error" variant="contained" disabled={pending} onClick={() => run(() => cancelMembership(membership.id), "Membresía anulada", () => setDialog(null))}>
            Anular membresía
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast !== null}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled" onClose={() => setToast(null)} sx={{ bgcolor: AQUA[600] }}>
          {toast}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
