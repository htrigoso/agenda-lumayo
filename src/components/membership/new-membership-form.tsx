"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { createMembership } from "@/app/(app)/membresias/actions";
import { AdditionalInput, draftDni, draftName, toPayload, type AdditionalDraft } from "@/components/membership/additional-input";
import { PatientPicker, type PatientOption } from "@/components/membership/patient-picker";
import { Eyebrow, MemberAvatar, PLAN_FILL, SeatDots, StepHeader } from "@/components/membership/ui";
import { AnimatePresence, MotionBox } from "@/components/motion";
import { AZUL, GOLD, INK, LINE } from "@/lib/brand";
import { PAYMENT_METHODS, PLANS, type PlanKey, formatDate, formatSoles, todayYmd, validityEnd } from "@/lib/membership";

const PLAN_KEYS: PlanKey[] = ["classic", "gold"];

/** Plan picker as two large tabs with price, seats and renewal fee. */
function PlanTabs({ value, onChange }: { value: PlanKey; onChange: (p: PlanKey) => void }) {
  return (
    <Box role="radiogroup" aria-label="Tipo de tarjeta" sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, p: 0.75, bgcolor: AZUL[50], borderRadius: 2, border: `1px solid ${LINE}` }}>
      {PLAN_KEYS.map((key) => {
        const p = PLANS[key];
        const on = value === key;
        return (
          <Box
            key={key}
            component="button"
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(key)}
            sx={{
              all: "unset",
              cursor: "pointer",
              borderRadius: 1.5,
              px: { xs: 1.5, sm: 2.5 },
              py: 1.5,
              background: on ? PLAN_FILL[key] : "transparent",
              color: on ? "#fff" : INK[600],
              textShadow: on && key === "gold" ? "0 1px 2px rgba(60,40,5,0.45)" : undefined,
              boxShadow: on ? "0 6px 16px -8px rgba(26,47,81,0.45)" : "none",
              transition: "background .25s ease, color .25s ease, box-shadow .25s ease",
              "&:hover": on ? undefined : { bgcolor: "#fff" },
              "&:focus-visible": { outline: `2px solid ${AZUL[600]}`, outlineOffset: 2 },
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: { xs: 15, sm: 17 } }}>{p.label}</Typography>
            <Typography sx={{ fontWeight: 700, fontSize: { xs: 14, sm: 15 } }}>{formatSoles(p.annualFee)} <Box component="span" sx={{ fontWeight: 500, opacity: 0.85 }}>/ año</Box></Typography>
            <Typography sx={{ fontSize: 12, opacity: 0.9, mt: 0.5 }}>
              Titular + {p.maxAdditional} adicionales · Re-afiliación {formatSoles(p.reaffiliationFee)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack direction="row" sx={{ justifyContent: "space-between", gap: 2, py: 0.75 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, textAlign: "right", minWidth: 0 }}>{children}</Typography>
    </Stack>
  );
}

export function NewMembershipForm() {
  const router = useRouter();
  const [plan, setPlan] = useState<PlanKey>("classic");
  const [holder, setHolder] = useState<PatientOption | null>(null);
  const [additional, setAdditional] = useState<AdditionalDraft[]>([]);
  const [startsOn, setStartsOn] = useState(todayYmd());
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const saved = useRef(false);

  const info = PLANS[plan];
  const full = additional.length >= info.maxAdditional;
  const over = additional.length > info.maxAdditional;
  const free = Math.max(0, info.maxAdditional - additional.length);
  const patientIds = additional.flatMap((a) => (a.kind === "patient" ? [a.patient.id] : []));
  const taken = holder ? [holder.id, ...patientIds] : patientIds;
  const dirty = holder !== null || additional.length > 0 || notes.trim() !== "";

  // Warn before closing the tab with an unsaved membership.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      if (!saved.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function addAdditional(d: AdditionalDraft) {
    const dni = draftDni(d);
    const dnis = [holder?.dni, ...additional.map(draftDni)].filter(Boolean);
    if (dni && dnis.includes(dni)) return "Esa persona ya está en esta membresía.";
    setAdditional((list) => [...list, d]);
  }

  function submit() {
    setError(null);
    if (!holder) return setError("Elige al titular.");
    startTransition(async () => {
      const res = await createMembership({
        plan,
        holder: holder.id,
        additional: additional.map(toPayload),
        starts_on: startsOn,
        fee: info.annualFee,
        method,
        notes,
      });
      if (res.error) return setError(res.error);
      saved.current = true;
      router.push(`/membresias/${res.id}`);
    });
  }

  return (
    <Grid container spacing={3} sx={{ alignItems: "flex-start" }}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Stack spacing={2.5}>
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <StepHeader n={1} title="Tarjeta" done />
            <PlanTabs value={plan} onChange={setPlan} />
          </Paper>

          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <StepHeader n={2} title="Titular" done={holder !== null} />
            <PatientPicker value={holder} onChange={setHolder} excludeIds={patientIds} placeholder="Buscar paciente por nombre, DNI o celular" />
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              El titular debe tener ficha de paciente. Si es nuevo, escribe su nombre completo y créalo aquí.
            </Typography>
          </Paper>

          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <StepHeader
              n={3}
              title="Adicionales"
              done={additional.length > 0 && !over}
              aside={
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <SeatDots used={Math.min(additional.length, info.maxAdditional)} max={info.maxAdditional} plan={plan} />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: over ? "error.main" : "text.secondary" }}>
                    {additional.length}/{info.maxAdditional}
                  </Typography>
                </Stack>
              }
            />
            <Stack spacing={1}>
              <AnimatePresence initial={false}>
                {additional.map((a, i) => (
                  <MotionBox
                    key={`${draftName(a)}-${draftDni(a) ?? i}`}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.25, border: `1px solid ${LINE}`, borderRadius: 1.5 }}
                  >
                    <MemberAvatar name={draftName(a)} role="additional" external={a.kind === "person"} />
                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                      <Typography sx={{ fontWeight: 600 }} noWrap>{draftName(a)}</Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {a.relationship}{draftDni(a) ? ` · DNI ${draftDni(a)}` : ""}
                      </Typography>
                    </Box>
                    {a.kind === "person" && <Chip size="small" variant="outlined" label="Sin ficha" />}
                    <Tooltip title="Quitar">
                      <IconButton size="small" aria-label={`Quitar a ${draftName(a)}`} onClick={() => setAdditional((list) => list.filter((_, j) => j !== i))}>
                        <CloseRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </MotionBox>
                ))}
              </AnimatePresence>

              {over && (
                <Alert severity="error">
                  La {info.label} admite máximo {info.maxAdditional} adicionales. Quita {additional.length - info.maxAdditional} o cambia a Dorada.
                </Alert>
              )}

              {full ? (
                !over && <Alert severity="info">Cupos completos: {info.maxAdditional} de {info.maxAdditional} adicionales.</Alert>
              ) : (
                <Box sx={{ p: { xs: 1.5, sm: 2 }, border: `1.5px dashed ${LINE}`, borderRadius: 2, bgcolor: AZUL[50] }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {free === 1 ? "Queda 1 cupo libre." : `Quedan ${free} cupos libres.`} Los adicionales son opcionales y se pueden agregar después.
                  </Typography>
                  <AdditionalInput excludeIds={taken} onAdd={addAdditional} />
                </Box>
              )}
            </Stack>
          </Paper>

          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <StepHeader n={4} title="Pago y vigencia" done={holder !== null} />
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Inicio de vigencia" type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value || todayYmd())} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select label="Método de pago" value={method} onChange={(e) => setMethod(e.target.value)} fullWidth>
                  {PAYMENT_METHODS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={12}>
                <TextField label="Notas (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={2} fullWidth />
              </Grid>
            </Grid>
          </Paper>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }} sx={{ position: { md: "sticky" }, top: { md: 88 } }}>
        <Paper sx={{ overflow: "hidden" }}>
          <Box sx={{ height: 6, background: PLAN_FILL[plan] }} />
          <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Eyebrow>Resumen</Eyebrow>
            <Typography variant="h6" sx={{ mt: 0.5, color: plan === "gold" ? GOLD.dark : AZUL[700] }}>
              Lumayo Card {info.label}
            </Typography>
            <Divider sx={{ my: 1.5 }} />
            <SummaryRow label="Titular">{holder ? `${holder.first_name} ${holder.last_name}` : "—"}</SummaryRow>
            <SummaryRow label="Adicionales">{additional.length} de {info.maxAdditional}</SummaryRow>
            <SummaryRow label="Vigencia">{formatDate(startsOn)} – {formatDate(validityEnd(startsOn))}</SummaryRow>
            <SummaryRow label="Método">{method}</SummaryRow>
            <Divider sx={{ my: 1.5 }} />
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "baseline" }}>
              <Typography sx={{ fontWeight: 600 }}>Afiliación anual</Typography>
              <Typography variant="h5" sx={{ color: AZUL[700] }}>{formatSoles(info.annualFee)}</Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">Renovación al año: {formatSoles(info.reaffiliationFee)}</Typography>

            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            <Button variant="contained" size="large" fullWidth onClick={submit} disabled={pending || !holder || over} sx={{ mt: 2, py: 1.25 }}>
              {pending ? "Registrando..." : "Registrar membresía"}
            </Button>
            {!holder && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mt: 1 }}>
                Elige al titular para continuar.
              </Typography>
            )}
            <Button color="inherit" fullWidth onClick={() => router.push("/membresias")} sx={{ mt: 1 }}>Cancelar</Button>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}
