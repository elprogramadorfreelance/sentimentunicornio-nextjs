import { type NextRequest, NextResponse } from "next/server";
import { analizarBusquedaReal } from "@/lib/busqueda-backend";
import { obtenerSesión } from "@/lib/session";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const consulta = String(body.consulta || "").trim();
  if (!consulta) {
    return NextResponse.json({ código: "400", mensaje: "Falta la consulta a analizar." }, { status: 400 });
  }

  try {
    const sesión = await obtenerSesión();
    const analisis = await analizarBusquedaReal(consulta, sesión ? String(sesión.id) : undefined);
    return NextResponse.json({ analisis });
  } catch (error) {
    return NextResponse.json(
      { código: "502", mensaje: error instanceof Error ? error.message : "No se pudo analizar la conversación." },
      { status: 502 },
    );
  }
}
