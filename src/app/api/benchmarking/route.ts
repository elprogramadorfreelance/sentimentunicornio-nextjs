import { type NextRequest, NextResponse } from "next/server";
import { obtenerBenchmarkingReal } from "@/lib/benchmarking-backend";
import { obtenerProyectosReales } from "@/lib/proyectos-backend";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const idsSolicitados = (searchParams.get("proyectos") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (idsSolicitados.length < 2) {
    return NextResponse.json(
      { código: "PROYECTOS_INSUFICIENTES", mensaje: "Selecciona al menos dos proyectos para comparar." },
      { status: 400 },
    );
  }

  try {
    // Los nombres se resuelven contra la lista real de proyectos de la
    // sesión — nunca se confía en un nombre que mande el cliente, solo en
    // los ids (y esos ids quedan acotados a los proyectos reales del usuario).
    const { proyectos: proyectosReales } = await obtenerProyectosReales();
    const seleccionados = proyectosReales
      .filter((p) => idsSolicitados.includes(p.id))
      .map((p) => ({ id: p.id, nombre: p.nombre }));

    if (seleccionados.length < 2) {
      return NextResponse.json(
        { código: "PROYECTOS_INSUFICIENTES", mensaje: "Selecciona al menos dos proyectos para comparar." },
        { status: 400 },
      );
    }

    const datos = await obtenerBenchmarkingReal(seleccionados);
    return NextResponse.json(datos);
  } catch {
    return NextResponse.json(
      { código: "BACKEND_NO_DISPONIBLE", mensaje: "No se pudo conectar con el backend de datos." },
      { status: 502 },
    );
  }
}
