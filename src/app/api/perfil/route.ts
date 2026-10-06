import { NextResponse } from "next/server";
import { actualizarNombreReal, perfilDesdeSesión } from "@/lib/perfil-backend";
import { obtenerSesión } from "@/lib/session";
import type { RespuestaPerfil, SolicitudActualizarPerfil } from "@/types";

export async function GET() {
  const sesión = await obtenerSesión();
  if (!sesión) return NextResponse.json({ código: "401", mensaje: "No autenticado." }, { status: 401 });
  const respuesta: RespuestaPerfil = { perfil: perfilDesdeSesión(sesión) };
  return NextResponse.json(respuesta);
}

export async function PATCH(request: Request) {
  const sesión = await obtenerSesión();
  if (!sesión) return NextResponse.json({ código: "401", mensaje: "No autenticado." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as SolicitudActualizarPerfil;
  if (body.nombre !== undefined && !body.nombre.trim()) {
    return NextResponse.json({ código: "400", mensaje: "El nombre no puede quedar vacío." }, { status: 400 });
  }

  try {
    if (body.nombre !== undefined) await actualizarNombreReal(sesión.id, body.nombre.trim());
    const respuesta: RespuestaPerfil = {
      perfil: perfilDesdeSesión({ ...sesión, name: body.nombre?.trim() ?? sesión.name }),
    };
    return NextResponse.json(respuesta);
  } catch {
    return NextResponse.json({ código: "502", mensaje: "No se pudo actualizar el perfil." }, { status: 502 });
  }
}
