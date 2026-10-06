// Login real con Google (OAuth2, Authorization Code) — servidor únicamente.
// Sin credenciales configuradas se comporta honestamente (redirige con un
// error claro), nunca finge un login exitoso.
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

// `request.nextUrl.origin` refleja el host INTERNO del proceso Node detrás de
// nginx (ej. localhost:3002), no el dominio público — y el redirect_uri que
// se le manda a Google debe ser EXACTAMENTE el que está autorizado en Google
// Cloud Console. Se usa un origen fijo en vez de derivarlo del request.
export function origenPúblico(): string {
  return process.env.SITE_URL ?? "https://sentimentunicornio.com";
}

export function googleLoginConfigurado(): boolean {
  return !!(process.env.GOOGLE_LOGIN_CLIENT_ID && process.env.GOOGLE_LOGIN_CLIENT_SECRET);
}

export function construirUrlAutorizacionGoogle(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_LOGIN_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export type PerfilGoogle = { email: string; name: string; emailVerificado: boolean };

export async function intercambiarCodigoGoogle(code: string, redirectUri: string): Promise<PerfilGoogle> {
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_LOGIN_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_LOGIN_CLIENT_SECRET ?? "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) throw new Error("No se pudo validar el código de Google.");
  const tokenData = (await tokenRes.json()) as { access_token?: string };
  if (!tokenData.access_token) throw new Error("Google no devolvió un token de acceso.");

  const userRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  if (!userRes.ok) throw new Error("No se pudo obtener tu perfil de Google.");
  const perfil = (await userRes.json()) as { email?: string; name?: string; verified_email?: boolean };

  return {
    email: (perfil.email ?? "").toLowerCase(),
    name: perfil.name ?? "",
    emailVerificado: !!perfil.verified_email,
  };
}
