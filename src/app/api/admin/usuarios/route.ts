import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendGet, backendPost, BackendError } from "@/lib/backend";
import { obtenerSesión, paramsSesión } from "@/lib/session";
import type { UsuarioAdmin } from "@/types";

/**
 * Panel de Super Usuario — lista/crea usuarios. Pasa la sesión real (no el
 * fallback demo) para que el backend filtre por organización según el rol
 * de quien pide, igual que /api/users hace con cualquier otro caller.
 */
export async function GET() {
  try {
    const sufijo = paramsSesión(await obtenerSesión());
    const data = await backendGet<UsuarioAdmin[]>(`/api/users${sufijo ? `?${sufijo}` : ""}`);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof BackendError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }
    return NextResponse.json({ ok: false, message: "No se pudo conectar con el backend." }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const { organizationId, name, email, password, role } = await request.json();
  if (!organizationId || !name || !email || !password) {
    return NextResponse.json({ ok: false, message: "Faltan campos requeridos." }, { status: 400 });
  }
  try {
    const respuesta = await backendPost<UsuarioAdmin>(`/api/organizations/${organizationId}/users`, {
      name,
      email,
      password,
      role,
    });
    return NextResponse.json({ ok: true, data: respuesta.data });
  } catch (error) {
    if (error instanceof BackendError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: error.status });
    }
    return NextResponse.json({ ok: false, message: "No se pudo crear el usuario." }, { status: 502 });
  }
}
