import { AppShell } from "@/components/app-shell";
import { AgendaView } from "@/components/agenda/agenda-view";

export default function AgendaPage() {
  return (
    <AppShell wide>
      <AgendaView />
    </AppShell>
  );
}
