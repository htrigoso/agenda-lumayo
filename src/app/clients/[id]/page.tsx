import { Suspense } from "react";
import { notFound } from "next/navigation";
import Typography from "@mui/material/Typography";
import { AppShell } from "@/components/app-shell";
import { ClientForm } from "@/components/client-form";
import { createClient } from "@/lib/supabase/server";

async function EditForm({ params }: Pick<PageProps<"/clients/[id]">, "params">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: client } = await supabase.from("clients").select("*").eq("id", id).single();
  if (!client) notFound();
  return <ClientForm client={client} />;
}

export default function EditClientPage({ params }: PageProps<"/clients/[id]">) {
  return (
    <AppShell>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Editar cliente
      </Typography>
      <Suspense>
        <EditForm params={params} />
      </Suspense>
    </AppShell>
  );
}
