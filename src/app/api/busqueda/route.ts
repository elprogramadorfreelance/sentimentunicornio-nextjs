import { type NextRequest, NextResponse } from "next/server";
import { buscarEnVivo } from "@/lib/busqueda-backend";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const consulta = String(body.consulta || "").trim();
  const página = Number(body.página) || 1;
  const tamaño = Number(body.tamaño) || 8;
  if (!consulta) {
    return NextResponse.json({ código: "400", mensaje: "Escribe algo para buscar." }, { status: 400 });
  }

  try {
    const { resultados, total, hayMás, totalFuentes } = await buscarEnVivo(consulta, página, tamaño);
    return NextResponse.json({
      consulta,
      proyectoIds: Array.isArray(body.proyectoIds) ? body.proyectoIds : [],
      totalFuentes,
      actualizadoEn: new Date().toISOString(),
      resultados,
      página,
      tamaño,
      total,
      hayMás,
    });
  } catch (error) {
    return NextResponse.json(
      { código: "502", mensaje: error instanceof Error ? error.message : "No se pudo completar la búsqueda." },
      { status: 502 },
    );
  }
}
