import { Suspense } from "react";
import Skeleton from "@mui/material/Skeleton";
import { AccountDisabled } from "@/components/account-disabled";
import { AppShell } from "@/components/app-shell";
import { getCurrentStaff } from "@/lib/staff";

/** Only active staff reach the pages; anyone else gets a friendly "not enabled" message. */
async function StaffGate({ children }: { children: React.ReactNode }) {
  const staff = await getCurrentStaff();
  return staff ? children : <AccountDisabled />;
}

// One shared shell for every signed-in page, so the sidebar persists (and animates) between routes.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  // Not awaited: the shell stays static and the staff name / admin nav stream in behind Suspense.
  const staff = getCurrentStaff();
  return (
    <AppShell staff={staff}>
      <Suspense fallback={<Skeleton variant="rounded" height={320} />}>
        <StaffGate>{children}</StaffGate>
      </Suspense>
    </AppShell>
  );
}
