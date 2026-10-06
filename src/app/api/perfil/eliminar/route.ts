import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { BackendError } from "@/lib/backend";
import { eliminarCuentaReal } from "@/lib/perfil-backend";
import { COOKIE_SESION, obtenerSesión } from "@/lib/session";
import type { RespuestaEliminarCuenta, SolicitudEliminarCuenta } from "@/types";

export async function POST(request: Request) {
  const sesión = await obtenerSesión();
  if (!sesión) return NextResponse.json({ código: "401", mensaje: "No autenticado." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as SolicitudEliminarCuenta;
  if (!body.tokenCambio) {
    return NextResponse.json({ código: "400", mensaje: "Verifica tu identidad primero." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const sesionToken = cookieStore.get(COOKIE_SESION)?.value ?? "";

  try {
    await eliminarCuentaReal(sesión.id, body.tokenCambio, sesionToken);
    cookieStore.delete(COOKIE_SESION);
    const respuesta: RespuestaEliminarCuenta = {
      mensaje: "Tu cuenta ha sido eliminada. Serás redirigido al inicio de sesión.",
    };
    return NextResponse.json(respuesta);
  } catch (error) {
    const status = error instanceof BackendError ? error.status : 502;
    const mensaje = error instanceof BackendError ? error.message : "No se pudo eliminar la cuenta.";
    return NextResponse.json({ código: String(status), mensaje }, { status });
  }
}
