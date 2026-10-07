"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import EditIcon from "@mui/icons-material/EditOutlined";
import EventAvailableIcon from "@mui/icons-material/EventAvailableOutlined";
import PaymentsIcon from "@mui/icons-material/PaymentsOutlined";
import {
  deleteItem,
  deletePayment,
  deletePlan,
  getBudget,
  setItemStatus,
} from "@/app/(app)/clients/budget-actions";
import type { OpenItem } from "@/app/(app)/clients/clinical-actions";
import { listServices } from "@/app/(app)/servicios/actions";
import {
  ITEM_STATUS,
  itemTotal,
  planTotals,
  type ItemStatus,
  type Payment,
  type Service,
  type TreatmentItem,
  type TreatmentPlan,
} from "@/lib/budget";
import { formatMoney } from "@/lib/money";
import { EASE, MotionPaper, MotionStack } from "@/components/motion";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { AttendanceDialog } from "@/components/history/attendance-dialog";
import { ItemDialog, PaymentDialog, PlanDialog } from "@/components/budget/budget-dialogs";

type Dialog =
  | { type: "plan"; plan: TreatmentPlan | null }
  | { type: "item"; plan: TreatmentPlan; item: TreatmentItem | null }
  | { type: "payment"; plan: TreatmentPlan; payment: Payment | null }
  | { type: "attend"; plan: TreatmentPlan; item: TreatmentItem }
  | { type: "done-prompt"; plan: TreatmentPlan; item: TreatmentItem }
  | { type: "delete"; kind: "plan" | "item" | "payment"; id: string; label: string };

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 700, fontSize: { xs: 15, sm: 18 }, color }}>{value}</Typography>
    </Box>
  );
}

export function BudgetPanel({ clientId }: { clientId: string }) {
  const [plans, setPlans] = useState<TreatmentPlan[] | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState(false);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [pending, startTransition] = useTransition();

  const load = useCallback(() => {
    getBudget(clientId)
      .then((list) => {
        setPlans(list);
        setError(false);
      })
      .catch(() => setError(true));
  }, [clientId]);

  useEffect(() => {
    load();
    listServices()
      .then(setServices)
      .catch(() => setServices([]));
  }, [load]);

  function changeStatus(plan: TreatmentPlan, item: TreatmentItem, status: ItemStatus) {
    // Marking as done without a recorded attendance: offer to register it in the history.
    if (status === "done" && !item.attendances?.length) return setDialog({ type: "done-prompt", plan, item });
    startTransition(async () => {
      await setItemStatus(item.id, status);
      load();
    });
  }

  const asOpenItem = (plan: TreatmentPlan, item: TreatmentItem): OpenItem => ({
    id: item.id,
    description: item.description,
    teeth: item.teeth,
    plan_title: plan.title,
  });

  function confirmDelete() {
    if (dialog?.type !== "delete") return;
    const { kind, id } = dialog;
    startTransition(async () => {
      if (kind === "plan") await deletePlan(id);
      if (kind === "item") await deleteItem(id);
      if (kind === "payment") await deletePayment(id);
      setDialog(null);
      load();
    });
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Presupuesto y pagos
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog({ type: "plan", plan: null })}>
          Nuevo plan
        </Button>
      </Stack>

      {error && <Alert severity="error">No se pudo cargar el presupuesto.</Alert>}
      {plans === null && !error && <Skeleton variant="rounded" height={260} />}
      {plans?.length === 0 && (
        <Paper sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
          Este paciente aún no tiene planes de tratamiento.
        </Paper>
      )}

      {plans?.map((plan, planIndex) => {
        const { total, paid, balance } = planTotals(plan);
        const progress = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
        return (
          <MotionPaper
            key={plan.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE, delay: planIndex * 0.08 }}
            sx={{ p: { xs: 2, sm: 3 } }}
          >
            <Stack spacing={2}>
              <Stack direction="row" sx={{ alignItems: "flex-start", gap: 1 }}>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 18, overflowWrap: "anywhere" }}>{plan.title}</Typography>
                  {plan.diagnosis && (
                    <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                      {plan.diagnosis}
                    </Typography>
                  )}
                </Box>
                <IconButton aria-label="Editar plan" onClick={() => setDialog({ type: "plan", plan })}>
                  <EditIcon />
                </IconButton>
                <IconButton
                  aria-label="Eliminar plan"
                  color="error"
                  onClick={() => setDialog({ type: "delete", kind: "plan", id: plan.id, label: `el plan "${plan.title}" con todos sus tratamientos y pagos` })}
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>

              <Box sx={{ bgcolor: "action.hover", borderRadius: 2, p: 2 }}>
                <Stack direction="row" spacing={2}>
                  <Stat label="Total" value={formatMoney(total)} />
                  <Stat label="Pagado" value={formatMoney(paid)} color="#2e7d32" />
                  <Stat label="Saldo" value={formatMoney(balance)} color={balance > 0 ? "#c62828" : "#2e7d32"} />
                </Stack>
                <LinearProgress variant="determinate" value={progress} color="success" sx={{ mt: 1.5, height: 8, borderRadius: 4 }} />
              </Box>

              <Divider textAlign="left">Tratamientos</Divider>
              {plan.items.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Aún no hay tratamientos en este plan.
                </Typography>
              )}
              {plan.items.map((item) => (
                <MotionStack
                  key={item.id}
                  layout="position"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ backgroundColor: "rgba(11,60,110,0.035)" }}
                  transition={{ duration: 0.25, ease: EASE }}
                  spacing={1}
                  sx={{ p: 1.5, border: 1, borderColor: "divider", borderRadius: 2 }}
                >
                  <Stack direction="row" sx={{ alignItems: "flex-start", gap: 1 }}>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 600, overflowWrap: "anywhere" }}>{item.description}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.teeth ? `Piezas ${item.teeth} · ` : ""}
                        {item.quantity} × {formatMoney(item.unit_price)}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>{formatMoney(itemTotal(item))}</Typography>
                  </Stack>
                  <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                    <Select
                      size="small"
                      value={item.status}
                      onChange={(e) => changeStatus(plan, item, e.target.value as ItemStatus)}
                      disabled={pending}
                      sx={{ minWidth: 130, fontSize: 14 }}
                    >
                      {Object.entries(ITEM_STATUS).map(([value, s]) => (
                        <MenuItem key={value} value={value}>
                          {s.label}
                        </MenuItem>
                      ))}
                    </Select>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      {item.status !== "done" && (
                        <Button
                          size="small"
                          startIcon={<EventAvailableIcon />}
                          onClick={() => setDialog({ type: "attend", plan, item })}
                        >
                          Atender
                        </Button>
                      )}
                      {!!item.attendances?.length && (
                        <Chip size="small" color="success" variant="outlined" label="En la historia" sx={{ mr: 0.5 }} />
                      )}
                      <IconButton aria-label="Editar tratamiento" onClick={() => setDialog({ type: "item", plan, item })}>
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        aria-label="Eliminar tratamiento"
                        color="error"
                        onClick={() => setDialog({ type: "delete", kind: "item", id: item.id, label: `el tratamiento "${item.description}"` })}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Stack>
                </MotionStack>
              ))}
              <Button startIcon={<AddIcon />} onClick={() => setDialog({ type: "item", plan, item: null })} sx={{ alignSelf: "flex-start" }}>
                Agregar tratamiento
              </Button>

              <Divider textAlign="left">Pagos</Divider>
              {plan.payments.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Aún no hay pagos registrados.
                </Typography>
              )}
              {plan.payments.map((p) => (
                <Stack key={p.id} direction="row" sx={{ alignItems: "center", gap: 1 }}>
                  <PaymentsIcon color="success" />
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600 }}>{formatMoney(p.amount)}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                      {new Date(`${p.paid_at}T00:00`).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}
                      {p.method ? ` · ${p.method}` : ""}
                      {p.note ? ` · ${p.note}` : ""}
                    </Typography>
                  </Box>
                  <IconButton aria-label="Editar pago" onClick={() => setDialog({ type: "payment", plan, payment: p })}>
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    aria-label="Eliminar pago"
                    color="error"
                    onClick={() => setDialog({ type: "delete", kind: "payment", id: p.id, label: `el pago de ${formatMoney(p.amount)}` })}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              ))}
              <Stack direction="row" sx={{ alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setDialog({ type: "payment", plan, payment: null })}
                >
                  Registrar pago
                </Button>
                {balance <= 0 && total > 0 && <Chip color="success" label="Pagado completo" />}
              </Stack>
            </Stack>
          </MotionPaper>
        );
      })}

      {dialog?.type === "plan" && (
        <PlanDialog
          key={dialog.plan?.id ?? "new"}
          open
          clientId={clientId}
          plan={dialog.plan}
          onClose={() => setDialog(null)}
          onSaved={load}
        />
      )}
      {dialog?.type === "item" && (
        <ItemDialog
          key={dialog.item?.id ?? `new-${dialog.plan.id}`}
          open
          planId={dialog.plan.id}
          item={dialog.item}
          services={services}
          onClose={() => setDialog(null)}
          onSaved={load}
        />
      )}
      {dialog?.type === "payment" && (
        <PaymentDialog
          key={dialog.payment?.id ?? `new-${dialog.plan.id}`}
          open
          planId={dialog.plan.id}
          payment={dialog.payment}
          balance={planTotals(dialog.plan).balance}
          onClose={() => setDialog(null)}
          onSaved={load}
        />
      )}
      {dialog?.type === "attend" && (
        <AttendanceDialog
          key={dialog.item.id}
          clientId={clientId}
          attendance={null}
          openItems={[asOpenItem(dialog.plan, dialog.item)]}
          initialItem={asOpenItem(dialog.plan, dialog.item)}
          onClose={() => setDialog(null)}
          onSaved={load}
        />
      )}
      <Dialog open={dialog?.type === "done-prompt"} onClose={() => setDialog(null)}>
        <DialogTitle>¿Registrar la atención en la historia?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Vas a marcar &quot;{dialog?.type === "done-prompt" ? dialog.item.description : ""}&quot; como realizado. Si lo registrás en la
            historia clínica, queda con fecha y piezas.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ flexWrap: "wrap", gap: 1 }}>
          <Button onClick={() => setDialog(null)} color="inherit">
            Cancelar
          </Button>
          <Button
            disabled={pending}
            onClick={() => {
              if (dialog?.type !== "done-prompt") return;
              const { id } = dialog.item;
              startTransition(async () => {
                await setItemStatus(id, "done");
                setDialog(null);
                load();
              });
            }}
          >
            Solo marcar realizado
          </Button>
          <Button
            variant="contained"
            onClick={() => dialog?.type === "done-prompt" && setDialog({ type: "attend", plan: dialog.plan, item: dialog.item })}
          >
            Registrar atención
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDialog
        open={dialog?.type === "delete"}
        title="¿Eliminar?"
        message={dialog?.type === "delete" ? `Se eliminará ${dialog.label} de forma permanente. Esta acción no se puede deshacer.` : ""}
        pending={pending}
        onCancel={() => setDialog(null)}
        onConfirm={confirmDelete}
      />
    </Stack>
  );
}
