import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { BackendError, backendPost } from "@/lib/backend";
import { COOKIE_SESION } from "@/lib/session";
import type { ErrorApi, RespuestaLogin, SesiónUsuario, SolicitudLogin } from "@/types";

type RespuestaLoginBackend = {
  user: SesiónUsuario;
  token: string;
  expires_at: string;
};

/** Valida contra el backend real y, si es válido, abre una sesión real: guarda el token en una cookie httpOnly. */
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    const error: ErrorApi = { código: "400", mensaje: "Cuerpo de la solicitud inválido" };
    return NextResponse.json(error, { status: 400 });
  }

  const { email, password, recordar } = body as Partial<SolicitudLogin>;

  if (!email || !password) {
    const error: ErrorApi = { código: "400", mensaje: "Correo y contraseña son requeridos" };
    return NextResponse.json(error, { status: 400 });
  }

  try {
    const respaldo = await backendPost<RespuestaLoginBackend>("/api/auth/login", {
      email,
      password,
      recordar,
    });
    const { token, user, expires_at } = respaldo.data as RespuestaLoginBackend;

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_SESION, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(expires_at),
    });

    const respuesta: RespuestaLogin = { mensaje: "Inicio de sesión exitoso", usuario: user };
    return NextResponse.json(respuesta);
  } catch (error) {
    const status = error instanceof BackendError ? error.status : 502;
    const mensaje =
      error instanceof BackendError ? error.message : "No se pudo conectar con el backend.";
    const respuesta: ErrorApi = { código: String(status), mensaje };
    return NextResponse.json(respuesta, { status });
  }
}
