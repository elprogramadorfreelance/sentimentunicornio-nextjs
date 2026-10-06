import { type NextRequest, NextResponse } from "next/server";
import { obtenerEstadoAnalisis } from "@/lib/analisis-backend";

/** Estado del análisis más reciente de un proyecto — usado por el banner "todavía recolectando información". */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const proyectoId = searchParams.get("proyecto");
  if (!proyectoId) return NextResponse.json({ estado: "sin_datos" });

  try {
    const estado = await obtenerEstadoAnalisis(proyectoId);
    return NextResponse.json(estado);
  } catch {
    return NextResponse.json({ estado: "sin_datos" });
  }
}
