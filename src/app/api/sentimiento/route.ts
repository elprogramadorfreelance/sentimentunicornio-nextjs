import { type NextRequest, NextResponse } from "next/server";
import {
  BackendError,
  calcularDesgloseTonalidad,
  calcularSerieSentimiento,
  calcularTendenciaTonalidad,
  calcularTonalidadPorFuente,
  filtrarMencionesPorRango,
  obtenerMencionesReales,
  verificarProyectoExiste,
} from "@/lib/menciones-backend";
import { aplicarLímiteHistóricoPlan, obtenerSesión } from "@/lib/session";
import type { RespuestaSentimiento } from "@/types";

const VENTANA_DÍAS_DEFECTO = 30;
const MS_DÍA = 86_400_000;

// Sentimiento real de un proyecto (o de todos) — mismas menciones reales que
// alimentan /proyectos/panel, solo agregadas distinto para la dona/tendencia
// de tonalidad. Si viene ?inicio&fin (calendario de la página), la dona, el
// desglose por fuente y las menciones destacadas se acotan a ese rango, y las
// gráficas de tendencia usan esa misma ventana (días exactos, terminando en
// `fin`) en vez de los 30 días fijos de antes — antes el calendario de esta
// página no hacía nada porque la ruta solo leía `proyecto`.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const proyectoId = searchParams.get("proyecto");
  const inicioParam = searchParams.get("inicio");
  const finParam = searchParams.get("fin");

  try {
    if (proyectoId) await verificarProyectoExiste(proyectoId);

    const sesión = await obtenerSesión();
    const rangoParam = inicioParam && finParam ? { inicio: inicioParam, fin: finParam } : null;
    const { rango, límite } = aplicarLímiteHistóricoPlan(rangoParam, sesión?.plan);

    const menciones = await obtenerMencionesReales(proyectoId);
    const mencionesDelPeríodo = rango ? filtrarMencionesPorRango(menciones, rango.inicio, rango.fin) : menciones;
    const fechas = mencionesDelPeríodo.map((m) => new Date(m.publicadaEn).getTime()).filter((t) => !Number.isNaN(t));
    const hoy = new Date().toISOString().slice(0, 10);

    const finMs = rango ? new Date(`${rango.fin}T00:00:00`).getTime() : undefined;
    const díasVentana = rango
      ? Math.round((new Date(`${rango.fin}T00:00:00`).getTime() - new Date(`${rango.inicio}T00:00:00`).getTime()) / MS_DÍA) + 1
      : VENTANA_DÍAS_DEFECTO;

    const respuesta: RespuestaSentimiento = {
      proyectoId,
      período: {
        inicio: fechas.length ? new Date(Math.min(...fechas)).toISOString().slice(0, 10) : (rango?.inicio ?? hoy),
        fin: fechas.length ? new Date(Math.max(...fechas)).toISOString().slice(0, 10) : (rango?.fin ?? hoy),
      },
      límiteHistórico: límite,
      desglose: calcularDesgloseTonalidad(mencionesDelPeríodo),
      tendenciaTonalidad: calcularTendenciaTonalidad(menciones, díasVentana, finMs),
      tonalidadPorFuente: calcularTonalidadPorFuente(mencionesDelPeríodo),
      seriePositivo: calcularSerieSentimiento(menciones, "positivo", díasVentana, finMs),
      serieNegativo: calcularSerieSentimiento(menciones, "negativo", díasVentana, finMs),
      mencionesPositivas: mencionesDelPeríodo.filter((m) => m.sentimiento === "positivo").slice(0, 8),
      mencionesNegativas: mencionesDelPeríodo.filter((m) => m.sentimiento === "negativo").slice(0, 8),
    };

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
