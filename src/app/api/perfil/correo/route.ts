import { NextResponse } from "next/server";
import { BackendError } from "@/lib/backend";
import { solicitarCambioCorreoReal } from "@/lib/perfil-backend";
import { obtenerSesión } from "@/lib/session";
import type { SolicitudCambiarCorreo } from "@/types";

export async function POST(request: Request) {
  const sesión = await obtenerSesión();
  if (!sesión) return NextResponse.json({ código: "401", mensaje: "No autenticado." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as SolicitudCambiarCorreo;
  if (!body.nuevoEmail?.trim()) {
    return NextResponse.json({ código: "400", mensaje: "Datos incompletos." }, { status: 400 });
  }

  try {
    const mensaje = await solicitarCambioCorreoReal(sesión.id, body.nuevoEmail.trim());
    return NextResponse.json({ mensaje });
  } catch (error) {
    const status = error instanceof BackendError ? error.status : 502;
    const mensaje = error instanceof BackendError ? error.message : "No se pudo enviar el correo de confirmación.";
    return NextResponse.json({ código: String(status), mensaje }, { status });
  }
}
