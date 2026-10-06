import { NextResponse } from "next/server";
import { BackendError } from "@/lib/backend";
import { cambiarPasswordReal } from "@/lib/perfil-backend";
import { mensajeErrorPassword } from "@/lib/validaciones/credenciales";
import { obtenerSesión } from "@/lib/session";
import type { SolicitudCambiarPassword } from "@/types";

export async function POST(request: Request) {
  const sesión = await obtenerSesión();
  if (!sesión) return NextResponse.json({ código: "401", mensaje: "No autenticado." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as SolicitudCambiarPassword;
  const errorPassword = mensajeErrorPassword(body.nuevaPassword ?? "");
  if (!body.tokenCambio || errorPassword) {
    return NextResponse.json(
      { código: "400", mensaje: errorPassword ?? "Verificación inválida." },
      { status: 400 },
    );
  }

  try {
    await cambiarPasswordReal(sesión.id, body.tokenCambio, body.nuevaPassword);
    return NextResponse.json({ mensaje: "Contraseña actualizada correctamente." });
  } catch (error) {
    const status = error instanceof BackendError ? error.status : 502;
    const mensaje = error instanceof BackendError ? error.message : "No se pudo actualizar la contraseña.";
    return NextResponse.json({ código: String(status), mensaje }, { status });
  }
}
