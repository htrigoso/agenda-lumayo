import { createClient } from "@/lib/supabase/server";
import { buildVCard, contactPhone, vcardFileName } from "@/lib/vcard";

/** Serves a patient's contact card so the phone opens its native "new contact" screen. RLS scopes it to the signed-in user. */
export async function GET(_request: Request, ctx: RouteContext<"/clients/[id]/vcf">) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: client, error } = await supabase
    .from("clients")
    .select("first_name, last_name, mobile, whatsapp, email")
    .eq("id", id)
    .maybeSingle();

  if (error) return new Response("No se pudo cargar el paciente.", { status: 500 });
  if (!client) return new Response("Paciente no encontrado.", { status: 404 });
  if (!contactPhone(client)) return new Response("El paciente no tiene celular ni WhatsApp registrado.", { status: 422 });

  const fileName = vcardFileName(client);
  return new Response(buildVCard(client), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
