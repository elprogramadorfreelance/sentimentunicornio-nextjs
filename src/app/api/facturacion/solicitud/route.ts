import { NextResponse } from "next/server";
import { BackendError } from "@/lib/backend";
import { solicitarFacturaciónReal } from "@/lib/facturacion-backend";
import { obtenerSesión } from "@/lib/session";
import type { SolicitudFacturación } from "@/types";

export async function POST(request: Request) {
  const sesión = await obtenerSesión();
  if (!sesión) return NextResponse.json({ código: "401", mensaje: "No autenticado." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as SolicitudFacturación;
  if (!["cambiar_plan", "cancelar"].includes(body.tipo)) {
    return NextResponse.json({ código: "400", mensaje: "Tipo de solicitud inválido." }, { status: 400 });
  }

  try {
    const respuesta = await solicitarFacturaciónReal(sesión.id, body.tipo, body.planDeseado, body.comentario);
    return NextResponse.json(respuesta);
  } catch (error) {
    const status = error instanceof BackendError ? error.status : 502;
    const mensaje = error instanceof BackendError ? error.message : "No se pudo enviar la solicitud.";
    return NextResponse.json({ código: String(status), mensaje }, { status });
  }
}
