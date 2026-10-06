import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_SESION } from "@/lib/session";

// Gate rápido en el edge: solo revisa que exista la cookie (sin llamar al
// backend) para redirigir antes de renderizar nada protegido. La validación
// real (token vigente, no revocado) pasa en cada layout/página vía
// obtenerSesión() — este middleware es la primera línea, no la única.
export function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_SESION)?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/proyectos/:path*",
    "/menciones/:path*",
    "/alertas/:path*",
    "/amplificadores/:path*",
    "/perfil/:path*",
    "/facturacion/:path*",
    "/sentimiento/:path*",
    "/analytics/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/soporte/:path*",
  ],
};
