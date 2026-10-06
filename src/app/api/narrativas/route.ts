import { type NextRequest, NextResponse } from "next/server";
import { BackendError } from "@/lib/backend";
import { verificarProyectoExiste } from "@/lib/menciones-backend";
import { obtenerNarrativasDetalle } from "@/lib/narrativas-backend";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const proyectoId = searchParams.get("proyecto");

  try {
    if (proyectoId) await verificarProyectoExiste(proyectoId);
    const narrativas = await obtenerNarrativasDetalle(proyectoId);
    return NextResponse.json({ narrativas });
  } catch (error) {
    if (error instanceof BackendError && error.status === 404) {
      return NextResponse.json(
        { código: "PROYECTO_NO_ENCONTRADO", mensaje: "El proyecto solicitado no existe." },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { código: "BACKEND_NO_DISPONIBLE", mensaje: "No se pudo conectar con el backend de datos." },
      { status: 502 },
    );
  }
}
