import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { BackendError, backendPost } from "@/lib/backend";
import { intercambiarCodigoGoogle, origenPúblico } from "@/lib/google-auth";
import { COOKIE_SESION } from "@/lib/session";
import type { SesiónUsuario } from "@/types";
import { COOKIE_ESTADO_GOOGLE } from "../route";

type RespuestaLoginBackend = { user: SesiónUsuario; token: string; expires_at: string };

function redirigirALogin(mensaje: string) {
  return NextResponse.redirect(`${origenPúblico()}/login?error=${encodeURIComponent(mensaje)}`);
}

/** Google redirige aquí con el código real — se intercambia por el perfil verificado y, si el correo ya es un usuario real, se abre sesión real (misma cookie httpOnly que el login normal). */
export async function GET(request: NextRequest) {
  const código = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  const cookieStore = await cookies();
  const stateGuardado = cookieStore.get(COOKIE_ESTADO_GOOGLE)?.value;
  cookieStore.delete(COOKIE_ESTADO_GOOGLE);

  if (!código || !state || !stateGuardado || state !== stateGuardado) {
    return redirigirALogin("No se pudo verificar la solicitud de Google. Intenta de nuevo.");
  }

  try {
    const redirectUri = `${origenPúblico()}/api/auth/google/callback`;
    const perfil = await intercambiarCodigoGoogle(código, redirectUri);
    if (!perfil.emailVerificado || !perfil.email) {
      return redirigirALogin("Tu correo de Google no está verificado.");
    }

    const respaldo = await backendPost<RespuestaLoginBackend>("/api/auth/google", {
      email: perfil.email,
      name: perfil.name,
    });
    const { token, expires_at } = respaldo.data as RespuestaLoginBackend;

    const respuesta = NextResponse.redirect(`${origenPúblico()}/dashboard`);
    cookieStore.set(COOKIE_SESION, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(expires_at),
    });
    return respuesta;
  } catch (error) {
    const mensaje = error instanceof BackendError ? error.message : "No se pudo iniciar sesión con Google.";
    return redirigirALogin(mensaje);
  }
}
