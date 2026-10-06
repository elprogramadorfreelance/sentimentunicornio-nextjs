import { type NextRequest, NextResponse } from "next/server";
import { obtenerUltimoAnalisisReal } from "@/lib/analisis-backend";

/** Último análisis de IA real de un proyecto — usado por el bento general cuando se filtra a un proyecto vía ?proyecto=. */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const proyectoId = searchParams.get("proyecto");
  if (!proyectoId) return NextResponse.json(null);

  try {
    const análisis = await obtenerUltimoAnalisisReal(proyectoId);
    return NextResponse.json(análisis);
  } catch {
    return NextResponse.json(null);
  }
}
