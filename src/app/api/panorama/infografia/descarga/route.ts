import { NextResponse } from "next/server";
import { backendPost, BackendError } from "@/lib/backend";
import { obtenerSesión } from "@/lib/session";

export type RespuestaDescargaInfografia = {
  permitido: boolean;
  restantes: number | null;
  tope: number | null;
};

// Registra un intento de descarga del PDF de Infografía contra el tope real
// de cuentas Demo (plan=basic) — correcciones-1-octubre, punto E19. El
// organization_id sale de la sesión real (cookie httpOnly), nunca del
// cliente, para que no se pueda pedir con un id ajeno.
export async function POST() {
  const sesión = await obtenerSesión();
  if (!sesión) {
    return NextResponse.json({ código: "SIN_SESIÓN", mensaje: "Sesión no encontrada." }, { status: 401 });
  }
  try {
    const { data } = await backendPost<RespuestaDescargaInfografia>(
      `/api/organizations/${sesión.organization_id}/infografia-descarga`,
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
