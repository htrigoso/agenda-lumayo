/** Patients loaded per page ("Ver más") on phones and on larger screens. */
export const MOBILE_PAGE_SIZE = 150;
export const DESKTOP_PAGE_SIZE = 250;

/** Page size for a device type as reported by Next's userAgent() (`device.type`). */
export function pageSizeFor(deviceType: string | undefined) {
  return deviceType === "mobile" ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE;
}

/** A page size coming from the client, restricted to the known values. */
export function safePageSize(size: number) {
  return size === MOBILE_PAGE_SIZE ? MOBILE_PAGE_SIZE : DESKTOP_PAGE_SIZE;
}
