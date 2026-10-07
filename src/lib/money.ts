const formatter = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

/** "S/ 1,200.00" */
export function formatMoney(value: number) {
  return formatter.format(value);
}
