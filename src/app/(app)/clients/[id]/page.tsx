import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Skeleton from "@mui/material/Skeleton";
import { type CallLog, listCalls } from "@/app/(app)/clients/actions";
import { PatientTabs } from "@/components/patient-tabs";
import { limaToday } from "@/lib/calls";
import { getCurrentStaff } from "@/lib/staff";
import { createClient } from "@/lib/supabase/server";

async function PatientFile({ params, searchParams }: PageProps<"/clients/[id]">) {
  // Patient data is per-request and per-user: render at request time, never prerender it.
  await connection();
  const [{ id }, { tab }, staff] = await Promise.all([params, searchParams, getCurrentStaff()]);
  const isAdmin = staff?.role === "admin";
  const supabase = await createClient();
  const [{ data: row }, { data: links }, calls] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).single(),
    // Active membership of this patient, if any (older cancelled ones may also exist).
    supabase.from("membership_members").select("membership:memberships(id, code, plan, cancelled_at)").eq("client_id", id),
    listCalls(id).catch((): CallLog[] => []),
  ]);
  if (!row) notFound();
  type Linked = { id: string; code: string; plan: "classic" | "gold"; cancelled_at: string | null };
  const m = (links ?? []).map((l) => l.membership as unknown as Linked | null).find((x) => x && !x.cancelled_at);
  // Memberships are admin-only, so workers never see the chip.
  const membership = isAdmin && m ? { id: m.id, code: m.code, plan: m.plan } : null;
  return (
    <PatientTabs
      client={{ ...row, membership }}
      calls={calls}
      today={limaToday()}
      isAdmin={isAdmin}
      initialTab={tab === "llamadas" ? "llamadas" : "ficha"}
    />
  );
}

export default function PatientPage({ params, searchParams }: PageProps<"/clients/[id]">) {
  return (
    <Suspense fallback={<Skeleton variant="rounded" height={420} />}>
      <PatientFile params={params} searchParams={searchParams} />
    </Suspense>
  );
}
