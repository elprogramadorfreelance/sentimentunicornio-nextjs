import { NextResponse } from "next/server";
import { backendPost, BackendError } from "@/lib/backend";
import { obtenerSesión } from "@/lib/session";

export type RespuestaDescargaReporte = {
  permitido: boolean;
  restantes: number | null;
  tope: number | null;
};

// Registra un intento de descarga de un reporte PDF (Narrativas/Sentimiento/
// Proyectos/Benchmarking/Análisis) contra el tope real de cuentas Demo
// (plan=basic) — mismo patrón que /api/panorama/infografia/descarga, pool
// compartido entre estos 5 reportes (2026-10-02). El organization_id sale de
// la sesión real (cookie httpOnly), nunca del cliente.
export async function POST() {
  const sesión = await obtenerSesión();
  if (!sesión) {
    return NextResponse.json({ código: "SIN_SESIÓN", mensaje: "Sesión no encontrada." }, { status: 401 });
  }
  try {
    const { data } = await backendPost<RespuestaDescargaReporte>(
      `/api/organizations/${sesión.organization_id}/reporte-descarga`,
    );
    return NextResponse.json(data);
  } catch (error) {
    const status = error instanceof BackendError ? error.status : 502;
    return NextResponse.json(
      { código: "BACKEND_NO_DISPONIBLE", mensaje: "No se pudo registrar la descarga." },
      { status },
    );
  }
}
