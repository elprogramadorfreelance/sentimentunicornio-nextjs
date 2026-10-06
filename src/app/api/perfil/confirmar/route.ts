import { type NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/backend";

// nginx enruta TODO /api/perfil/* hacia esta app (ver `location ^~ /api/perfil`
// en sites-available/sentimentunicornio.com), así que el link real que llega
// por correo (cambio de correo / traspaso de cuenta) aterriza aquí, no
// directo en el backend Express. Este handler solo hace de puente: llama al
// backend server-a-servidor (red interna, sin pasar por nginx) y regresa
// exactamente el HTML que el backend ya arma (página de confirmación real,
// no un mock).
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const res = await fetch(`${BACKEND_URL}/api/perfil/confirmar?token=${encodeURIComponent(token)}`, {
    cache: "no-store",
  });
  const html = await res.text();
  return new NextResponse(html, {
    status: res.status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
