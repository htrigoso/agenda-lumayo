export type ItemStatus = "pending" | "in_progress" | "done";
export type PlanStatus = "active" | "completed" | "cancelled";

export const ITEM_STATUS: Record<ItemStatus, { label: string; color: "default" | "warning" | "success" }> = {
  pending: { label: "Pendiente", color: "default" },
  in_progress: { label: "En curso", color: "warning" },
  done: { label: "Realizado", color: "success" },
};

export const PLAN_STATUS: Record<PlanStatus, string> = {
  active: "Activo",
  completed: "Completado",
  cancelled: "Cancelado",
};

export const PAYMENT_METHODS = ["Efectivo", "Yape", "Plin", "Transferencia", "Tarjeta", "Otro"];

export type Service = {
  id: string;
  name: string;
  category: string | null;
  default_price: number;
  active: boolean;
};

export type TreatmentItem = {
  id: string;
  plan_id: string;
  service_id: string | null;
  description: string;
  teeth: string | null;
  quantity: number;
  unit_price: number;
  status: ItemStatus;
  /** Attendances registered against this item (embedded by `getBudget`). */
  attendances?: { id: string }[];
};

export type Payment = {
  id: string;
  plan_id: string;
  amount: number;
  paid_at: string;
  method: string | null;
  note: string | null;
};

export type TreatmentPlan = {
  id: string;
  client_id: string;
  title: string;
  diagnosis: string | null;
  status: PlanStatus;
  created_at: string;
  items: TreatmentItem[];
  payments: Payment[];
};

export const itemTotal = (i: TreatmentItem) => i.quantity * i.unit_price;

export function planTotals(plan: TreatmentPlan) {
  const total = plan.items.reduce((sum, i) => sum + itemTotal(i), 0);
  const paid = plan.payments.reduce((sum, p) => sum + p.amount, 0);
  return { total, paid, balance: total - paid };
}
