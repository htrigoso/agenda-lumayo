"use client";

import { useState, useTransition } from "react";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { savePayment, saveItem, savePlan } from "@/app/clients/budget-actions";
import {
  ITEM_STATUS,
  PAYMENT_METHODS,
  type ItemStatus,
  type Payment,
  type Service,
  type TreatmentItem,
  type TreatmentPlan,
} from "@/lib/budget";
import { toDateTimeLocal } from "@/lib/appointments";
import { formatMoney } from "@/lib/money";

type CommonProps = { onClose: () => void; onSaved: () => void };

function FormDialog({
  open,
  title,
  error,
  pending,
  onClose,
  onSubmit,
  children,
}: {
  open: boolean;
  title: string;
  error: string | null;
  pending: boolean;
  onClose: () => void;
  onSubmit: () => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        style={{ display: "contents" }}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {children}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={pending}>
            {pending ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export function PlanDialog({
  clientId,
  plan,
  open,
  onClose,
  onSaved,
}: CommonProps & { clientId: string; plan: TreatmentPlan | null; open: boolean }) {
  const [title, setTitle] = useState(plan?.title ?? "Plan de tratamiento");
  const [diagnosis, setDiagnosis] = useState(plan?.diagnosis ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <FormDialog
      open={open}
      title={plan ? "Editar plan" : "Nuevo plan de tratamiento"}
      error={error}
      pending={pending}
      onClose={onClose}
      onSubmit={() =>
        startTransition(async () => {
          const res = await savePlan({ id: plan?.id, client_id: clientId, title, diagnosis });
          if (res.error) return setError(res.error);
          onSaved();
          onClose();
        })
      }
    >
      <TextField label="Título" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      <TextField label="Diagnóstico" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} multiline minRows={3} />
    </FormDialog>
  );
}

export function ItemDialog({
  planId,
  item,
  services,
  open,
  onClose,
  onSaved,
}: CommonProps & { planId: string; item: TreatmentItem | null; services: Service[]; open: boolean }) {
  const [service, setService] = useState<Service | null>(
    services.find((s) => s.id === item?.service_id) ?? null,
  );
  const [description, setDescription] = useState(item?.description ?? "");
  const [teeth, setTeeth] = useState(item?.teeth ?? "");
  const [quantity, setQuantity] = useState(String(item?.quantity ?? 1));
  const [price, setPrice] = useState(String(item?.unit_price ?? ""));
  const [status, setStatus] = useState<ItemStatus>(item?.status ?? "pending");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const subtotal = (Number(quantity) || 0) * (Number(price) || 0);

  return (
    <FormDialog
      open={open}
      title={item ? "Editar tratamiento" : "Agregar tratamiento"}
      error={error}
      pending={pending}
      onClose={onClose}
      onSubmit={() =>
        startTransition(async () => {
          const res = await saveItem({
            id: item?.id,
            plan_id: planId,
            service_id: service?.id ?? null,
            description,
            teeth,
            quantity: Number(quantity),
            unit_price: Number(price),
            status,
          });
          if (res.error) return setError(res.error);
          onSaved();
          onClose();
        })
      }
    >
      <Autocomplete
        options={services.filter((s) => s.active || s.id === service?.id)}
        value={service}
        getOptionLabel={(s) => s.name}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        groupBy={(s) => s.category ?? "Sin categoría"}
        noOptionsText="Sin servicios"
        onChange={(_, s) => {
          setService(s);
          if (s) {
            setDescription(s.name);
            setPrice(String(s.default_price));
          }
        }}
        renderInput={(params) => <TextField {...params} label="Servicio del catálogo (opcional)" />}
      />
      <TextField label="Descripción" required value={description} onChange={(e) => setDescription(e.target.value)} />
      <TextField
        label="Piezas dentales"
        value={teeth}
        onChange={(e) => setTeeth(e.target.value)}
        helperText="Ej.: 16, 47-44, 12-21"
      />
      <Stack direction="row" spacing={2}>
        <TextField
          label="Cantidad"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          slotProps={{ htmlInput: { min: 1, step: 1 } }}
        />
        <TextField
          label="Precio unitario"
          type="number"
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          slotProps={{
            input: { startAdornment: <InputAdornment position="start">S/</InputAdornment> },
            htmlInput: { min: 0, step: "0.01" },
          }}
        />
      </Stack>
      <TextField select label="Estado" value={status} onChange={(e) => setStatus(e.target.value as ItemStatus)}>
        {Object.entries(ITEM_STATUS).map(([value, s]) => (
          <MenuItem key={value} value={value}>
            {s.label}
          </MenuItem>
        ))}
      </TextField>
      <Typography sx={{ fontWeight: 700, textAlign: "right" }}>Subtotal: {formatMoney(subtotal)}</Typography>
    </FormDialog>
  );
}

export function PaymentDialog({
  planId,
  payment,
  balance,
  open,
  onClose,
  onSaved,
}: CommonProps & { planId: string; payment: Payment | null; balance: number; open: boolean }) {
  const [amount, setAmount] = useState(String(payment?.amount ?? ""));
  const [paidAt, setPaidAt] = useState(payment?.paid_at ?? toDateTimeLocal(new Date()).slice(0, 10));
  const [method, setMethod] = useState(payment?.method ?? "Efectivo");
  const [note, setNote] = useState(payment?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <FormDialog
      open={open}
      title={payment ? "Editar pago" : "Registrar pago"}
      error={error}
      pending={pending}
      onClose={onClose}
      onSubmit={() =>
        startTransition(async () => {
          const res = await savePayment({
            id: payment?.id,
            plan_id: planId,
            amount: Number(amount),
            paid_at: paidAt,
            method,
            note,
          });
          if (res.error) return setError(res.error);
          onSaved();
          onClose();
        })
      }
    >
      <TextField
        label="Monto"
        type="number"
        required
        autoFocus
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        slotProps={{
          input: { startAdornment: <InputAdornment position="start">S/</InputAdornment> },
          htmlInput: { min: 0, step: "0.01" },
        }}
      />
      {!payment && balance > 0 && (
        <Chip
          label={`Pagar el saldo: ${formatMoney(balance)}`}
          onClick={() => setAmount(String(balance))}
          variant="outlined"
          color="primary"
          sx={{ alignSelf: "flex-start" }}
        />
      )}
      <TextField
        label="Fecha"
        type="date"
        required
        value={paidAt}
        onChange={(e) => setPaidAt(e.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <TextField select label="Método" value={method} onChange={(e) => setMethod(e.target.value)}>
        {PAYMENT_METHODS.map((m) => (
          <MenuItem key={m} value={m}>
            {m}
          </MenuItem>
        ))}
      </TextField>
      <TextField label="Nota" value={note} onChange={(e) => setNote(e.target.value)} multiline minRows={2} />
      {!payment && (
        <Chip
          label="Pago hecho en la clínica anterior"
          onClick={() => setNote("Pagado en la clínica anterior")}
          size="small"
          variant="outlined"
          sx={{ alignSelf: "flex-start" }}
        />
      )}
    </FormDialog>
  );
}
