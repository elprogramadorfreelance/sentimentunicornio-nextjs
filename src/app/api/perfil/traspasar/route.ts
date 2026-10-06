import { NextResponse } from "next/server";
import { BackendError } from "@/lib/backend";
import { solicitarTraspasoReal } from "@/lib/perfil-backend";
import { obtenerSesión } from "@/lib/session";
import type { RespuestaTraspasarCuenta, SolicitudTraspasarCuenta } from "@/types";

export async function POST(request: Request) {
  const sesión = await obtenerSesión();
  if (!sesión) return NextResponse.json({ código: "401", mensaje: "No autenticado." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as SolicitudTraspasarCuenta;
  if (!body.emailDestino?.trim()) {
    return NextResponse.json({ código: "400", mensaje: "Indica el correo destino." }, { status: 400 });
  }
  if (body.emailDestino.trim().toLowerCase() === sesión.email.toLowerCase()) {
    return NextResponse.json(
      { código: "400", mensaje: "El correo destino debe ser distinto al tuyo." },
      { status: 400 },
    );
  }

  try {
    const mensaje = await solicitarTraspasoReal(sesión.id, body.emailDestino.trim());
    const respuesta: RespuestaTraspasarCuenta = { mensaje };
    return NextResponse.json(respuesta);
  } catch (error) {
    const status = error instanceof BackendError ? error.status : 502;
    const mensaje = error instanceof BackendError ? error.message : "No se pudo enviar el correo de confirmación.";
    return NextResponse.json({ código: String(status), mensaje }, { status });
  }
}
