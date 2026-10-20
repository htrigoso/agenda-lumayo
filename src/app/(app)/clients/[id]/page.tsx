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
  const { data: client } = await supabase.from("clients").select("*").eq("id", id).single();
  if (!client) notFound();
  return <PatientTabs client={client} />;
}

export default function PatientPage({ params }: PageProps<"/clients/[id]">) {
  return (
    <Suspense fallback={<Skeleton variant="rounded" height={420} />}>
      <PatientFile params={params} />
    </Suspense>
  );
}
