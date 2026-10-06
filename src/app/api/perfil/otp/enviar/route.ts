import { NextResponse } from "next/server";
import { enviarOtpReal } from "@/lib/perfil-backend";
import { obtenerSesión } from "@/lib/session";
import type { SolicitudEnviarOtp } from "@/types";

export async function POST(request: Request) {
  const sesión = await obtenerSesión();
  if (!sesión) return NextResponse.json({ código: "401", mensaje: "No autenticado." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as SolicitudEnviarOtp;
  if (!["cambiar_correo", "cambiar_password", "eliminar_cuenta", "traspasar_cuenta"].includes(body.propósito)) {
    return NextResponse.json({ código: "400", mensaje: "Propósito de OTP inválido." }, { status: 400 });
  }

  const respuesta = await enviarOtpReal(sesión.id, body.propósito);
  return NextResponse.json(respuesta);
}
