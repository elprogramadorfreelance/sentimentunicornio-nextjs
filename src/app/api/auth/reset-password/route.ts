import { NextResponse } from "next/server";
import { BackendError, backendPost } from "@/lib/backend";
import type {
  ErrorApi,
  RespuestaRestablecerPassword,
  SolicitudRestablecerPassword,
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

  const { token, new_password } = body as Partial<SolicitudRestablecerPassword>;

  if (!token || typeof token !== "string") {
    const error: ErrorApi = { código: "400", mensaje: "El enlace no es válido." };
    return NextResponse.json(error, { status: 400 });
  }
  if (!new_password || typeof new_password !== "string" || new_password.length < 8) {
    const error: ErrorApi = {
      código: "400",
      mensaje: "La contraseña debe tener al menos 8 caracteres.",
    };
    return NextResponse.json(error, { status: 400 });
  }

  try {
    const datos = await backendPost<{ message: string }>("/api/auth/reset-password", {
      token,
      new_password,
    });
    const respuesta: RespuestaRestablecerPassword = {
      mensaje: datos.message ?? "Contraseña actualizada. Ya puedes iniciar sesión.",
    };
    return NextResponse.json(respuesta);
  } catch (error) {
    const status = error instanceof BackendError ? error.status : 502;
    const mensaje =
      error instanceof BackendError ? error.message : "No se pudo restablecer la contraseña.";
    return NextResponse.json({ código: String(status), mensaje }, { status });
  }
}
