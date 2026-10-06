import { type NextRequest, NextResponse } from "next/server";
import { construirResumenInfografia } from "@/lib/infografia-backend";
import { BackendError, obtenerMencionesReales, verificarProyectoExiste } from "@/lib/menciones-backend";
import { obtenerProyectosReales } from "@/lib/proyectos-backend";
import { obtenerSesión } from "@/lib/session";
import type { RespuestaInfografia } from "@/types";

const DÍAS_VÁLIDOS = new Set([7, 14, 30, 90]);
const DÍAS_DEFECTO = 14;

// Panorama → Infografía: mismo criterio que /proyectos y /menciones — todo
// sale de menciones reales de sentiment-api, sin endpoint nuevo del lado del
// backend de Express.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const proyectoId = searchParams.get("proyecto");
  const díasParam = Number(searchParams.get("dias"));
  let diasPeriodo = DÍAS_VÁLIDOS.has(díasParam) ? díasParam : DÍAS_DEFECTO;

  // Cuentas plan "basic" (Demo) solo ven 7 días aquí también — se aplica en
  // el backend, no solo en el selector del cliente, para que pedir la URL
  // directa con ?dias=90 no lo salte (mismo criterio que
  // aplicarLímiteHistóricoPlan en /proyectos/panel y /menciones).
  const sesión = await obtenerSesión();
  if (sesión?.plan === "basic") diasPeriodo = 7;

  try {
    if (proyectoId) await verificarProyectoExiste(proyectoId);

    const [menciones, { proyectos }] = await Promise.all([
      obtenerMencionesReales(proyectoId),
      obtenerProyectosReales(),
    ]);

    const regiónPorProyecto = new Map(proyectos.map((p) => [p.id, p.ubicacion]));
    const nombreProyecto = proyectoId
      ? (proyectos.find((p) => p.id === proyectoId)?.nombre ?? "Proyecto")
      : "Todos los proyectos";

    const datos = construirResumenInfografia(
      menciones,
      diasPeriodo,
      proyectoId,
      nombreProyecto,
      regiónPorProyecto,
    );

    const respuesta: RespuestaInfografia = { datos };
    return NextResponse.json(respuesta);
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
