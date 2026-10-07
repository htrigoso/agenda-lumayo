/** Clinic medical-record number, zero-padded: 12 -> "000012". */
export function formatRecordNumber(n: number) {
  return String(n).padStart(6, "0");
}
