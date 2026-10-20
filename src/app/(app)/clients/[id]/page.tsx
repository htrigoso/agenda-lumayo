import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Skeleton from "@mui/material/Skeleton";
import { PatientTabs } from "@/components/patient-tabs";
import { createClient } from "@/lib/supabase/server";

async function PatientFile({ params }: Pick<PageProps<"/clients/[id]">, "params">) {
  // Patient data is per-request and per-user: render at request time, never prerender it.
  await connection();
  const { id } = await params;
  const supabase = await createClient();
  const { data: row } = await supabase.from("clients").select("*").eq("id", id).single();
  if (!row) notFound();
  // Active membership of this patient, if any (older cancelled ones may also exist).
  const { data: links } = await supabase
    .from("membership_members")
    .select("membership:memberships(id, code, plan, cancelled_at)")
    .eq("client_id", id);
  type Linked = { id: string; code: string; plan: "classic" | "gold"; cancelled_at: string | null };
  const m = (links ?? []).map((l) => l.membership as unknown as Linked | null).find((x) => x && !x.cancelled_at);
  const membership = m ? { id: m.id, code: m.code, plan: m.plan } : null;
  return <PatientTabs client={{ ...row, membership }} />;
}

export default function PatientPage({ params }: PageProps<"/clients/[id]">) {
  return (
    <Suspense fallback={<Skeleton variant="rounded" height={420} />}>
      <PatientFile params={params} />
    </Suspense>
  );
}
