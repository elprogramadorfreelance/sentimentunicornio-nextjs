import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { construirUrlAutorizacionGoogle, googleLoginConfigurado, origenPúblico } from "@/lib/google-auth";

export const COOKIE_ESTADO_GOOGLE = "google_oauth_state";

/** Inicia el login real con Google — redirige a la pantalla de consentimiento de Google. */
export async function GET() {
  if (!googleLoginConfigurado()) {
    return NextResponse.redirect(`${origenPúblico()}/login?error=google_no_configurado`);
  }

  const state = randomUUID();
  const redirectUri = `${origenPúblico()}/api/auth/google/callback`;

  const respuesta = NextResponse.redirect(construirUrlAutorizacionGoogle(redirectUri, state));
  (await cookies()).set(COOKIE_ESTADO_GOOGLE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return respuesta;
}
