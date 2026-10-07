import { AppShell } from "@/components/app-shell";

// One shared shell for every signed-in page, so the sidebar persists (and animates) between routes.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
