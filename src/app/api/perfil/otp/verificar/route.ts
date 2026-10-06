import { NextResponse } from "next/server";
import { verificarOtpReal } from "@/lib/perfil-backend";
import { obtenerSesión } from "@/lib/session";
import type { SolicitudVerificarOtp } from "@/types";

export async function POST(request: Request) {
  const sesión = await obtenerSesión();
  if (!sesión) return NextResponse.json({ código: "401", mensaje: "No autenticado." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as SolicitudVerificarOtp;
  if (!body.código?.trim()) {
    return NextResponse.json({ código: "400", mensaje: "Ingresa el código de verificación." }, { status: 400 });
  }

  const respuesta = await verificarOtpReal(sesión.id, body.código.trim());
  return NextResponse.json(respuesta, { status: respuesta.válido ? 200 : 400 });
}
