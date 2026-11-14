"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Pagination from "@mui/material/Pagination";
import PaginationItem from "@mui/material/PaginationItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export function ClientsPagination({
  page,
  pageCount,
  from,
  to,
  total,
  pending = false,
  onNavigate,
}: {
  page: number;
  pageCount: number;
  from: number;
  to: number;
  total: number;
  /** True while the next page is loading: the control is disabled to avoid double clicks. */
  pending?: boolean;
  /** Wraps the navigation (e.g. in startTransition) so the parent can show a loading state. */
  onNavigate?: (navigate: () => void) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (total === 0) return null;

  function goTo(next: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (next > 1) params.set("page", String(next));
    else params.delete("page");
    const qs = params.toString();
    const navigate = () => router.push(qs ? `/?${qs}` : "/");
    if (onNavigate) onNavigate(navigate);
    else navigate();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <Stack
      direction="row"
      sx={{ alignItems: "center", justifyContent: "space-between", px: 1 }}
    >
      <Typography variant="body2" color="text.secondary">
        Mostrando {from}–{to} de {total}
      </Typography>
      {pageCount > 1 && (
        <Pagination
          page={page}
          count={pageCount}
          color="primary"
          disabled={pending}
          onChange={(_, next) => goTo(next)}
          renderItem={(item) => (
            <PaginationItem
              {...item}
              slots={{
                previous: () => <span style={{ padding: "0 6px" }}>Anterior</span>,
                next: () => <span style={{ padding: "0 6px" }}>Siguiente</span>,
              }}
            />
          )}
        />
      )}
    </Stack>
  );
}
