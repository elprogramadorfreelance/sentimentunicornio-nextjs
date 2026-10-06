import { type NextRequest, NextResponse } from "next/server";
import { obtenerAmplificadoresReales } from "@/lib/amplificadores-backend";
import { BackendError } from "@/lib/backend";
import { verificarProyectoExiste } from "@/lib/menciones-backend";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parámetroProyecto = searchParams.get("proyecto");
  const idsSeleccionados = parámetroProyecto
    ? parámetroProyecto
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    : [];
  const esSubconjunto = idsSeleccionados.length > 1;
  const proyectoId = esSubconjunto ? null : (idsSeleccionados[0] ?? null);

  try {
    if (proyectoId) await verificarProyectoExiste(proyectoId);
    const amplificadores = esSubconjunto
      ? (await obtenerAmplificadoresReales(null)).filter((amplificador) =>
          idsSeleccionados.includes(amplificador.proyectoId),
        )
      : await obtenerAmplificadoresReales(proyectoId);
    return NextResponse.json({ amplificadores });
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
