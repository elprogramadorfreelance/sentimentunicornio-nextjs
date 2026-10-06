import { NextResponse } from "next/server";
import { BackendError, backendPost } from "@/lib/backend";
import type {
  ErrorApi,
  RespuestaRecuperarPassword,
  SolicitudRecuperarPassword,
} from "@/types";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    const error: ErrorApi = {
      código: "400",
      mensaje: "Cuerpo de la solicitud inválido",
    };
    return NextResponse.json(error, { status: 400 });
  }

  const { email } = body as Partial<SolicitudRecuperarPassword>;

  if (!email || typeof email !== "string") {
    const error: ErrorApi = {
      código: "400",
      mensaje: "El correo es requerido",
    };
    return NextResponse.json(error, { status: 400 });
  }

  try {
    // El backend real siempre responde genérico (no revela si el correo
    // existe) — se envía el link de verdad solo si SMTP está configurado ahí.
    const datos = await backendPost<{ message: string }>("/api/auth/forgot-password", { email });
    const respuesta: RespuestaRecuperarPassword = {
      mensaje:
        datos.message ??
        "Si el correo está registrado, recibirás un enlace para restaurar tu contraseña.",
    };
    return NextResponse.json(respuesta);
  } catch (error) {
    const status = error instanceof BackendError ? error.status : 502;
    const mensaje =
      error instanceof BackendError ? error.message : "No se pudo procesar la solicitud.";
    return NextResponse.json({ código: String(status), mensaje }, { status });
  }
}
