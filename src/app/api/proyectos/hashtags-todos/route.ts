import { NextResponse } from "next/server";
import { obtenerHashtagsTodos } from "@/lib/narrativas-backend";

// Bajo /api/proyectos/ a propósito: esa ruta ya tiene un location prefix en
// nginx que la manda al frontend Next.js (ver el gotcha documentado en
// project_nginx_asset_routing_gotcha) — así no hace falta desplegar un
// cambio de nginx aparte solo para este endpoint nuevo.
export async function GET() {
  try {
    const hashtags = await obtenerHashtagsTodos();
    return NextResponse.json({ hashtags });
  } catch {
    return NextResponse.json(
      { código: "BACKEND_NO_DISPONIBLE", mensaje: "No se pudo conectar con el backend de datos." },
      { status: 502 },
    );
  }
}
