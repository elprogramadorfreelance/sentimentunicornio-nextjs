import { type NextRequest, NextResponse } from "next/server";
import { LÍMITE_ALERTAS, obtenerAlertasDetalle, obtenerAlertasReales } from "@/lib/alertas-backend";
import {
  BackendError,
  agruparMencionesPorProyecto,
  calcularAlcancePorFuente,
  calcularAlertaCrisis,
  calcularPalabrasClaveReales,
  calcularRegionesPresencia,
  calcularResumenAlcance,
  calcularResumenMenciones,
  calcularSentimientoPorcentual,
  calcularSerieSemanal,
  calcularTendenciaAlcance,
  calcularTendenciaMencionesAlcance,
  calcularTendenciasEmergentes,
  calcularTonalidadPorFuente,
  calcularTopEmisores,
  calcularTraficoPorFuente,
  calcularVideoReal,
  díasHastaPiso,
  estimarAlcance,
  filtrarMencionesPorRango,
  obtenerMencionesReales,
  obtenerNssPorTemaReal,
  verificarProyectoExiste,
} from "@/lib/menciones-backend";
import { obtenerProyectosReales } from "@/lib/proyectos-backend";
import { aplicarLímiteHistóricoPlan, obtenerSesión } from "@/lib/session";
import type { MetricasProyectoPanel, RespuestaPanelGeneral } from "@/types";

const MS_DÍA = 86_400_000;
const DÍAS_ALCANCE_FUENTE = 30;

function aISO(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Ventana actual + la misma cantidad de días inmediatamente anterior, para
 * poder comparar de verdad el alcance por fuente en vez de dejarlo fijo en
 * 0%. Si el usuario eligió un rango en el calendario, se usa ese rango
 * (contra el mismo número de días justo antes); si no, por defecto son los
 * últimos 30 días contra los 30 anteriores — mismo criterio que ya usa
 * Menciones para "vs. período anterior".
 */
function calcularVentanaAlcanceFuente(rangoInicio: string | null, rangoFin: string | null) {
  if (rangoInicio && rangoFin) {
    const inicioMs = new Date(`${rangoInicio}T00:00:00`).getTime();
    const finMs = new Date(`${rangoFin}T00:00:00`).getTime();
    const duraciónMs = finMs - inicioMs + MS_DÍA;
    return {
      actualInicio: rangoInicio,
      actualFin: rangoFin,
      anteriorInicio: aISO(inicioMs - duraciónMs),
      anteriorFin: aISO(inicioMs - MS_DÍA),
    };
  }
  const hoyMs = inicioDeDía(new Date());
  return {
    actualInicio: aISO(hoyMs - (DÍAS_ALCANCE_FUENTE - 1) * MS_DÍA),
    actualFin: aISO(hoyMs),
    anteriorInicio: aISO(hoyMs - (2 * DÍAS_ALCANCE_FUENTE - 1) * MS_DÍA),
    anteriorFin: aISO(hoyMs - DÍAS_ALCANCE_FUENTE * MS_DÍA),
  };
}

function inicioDeDía(fecha: Date): number {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()).getTime();
}

// Panel general de /proyectos — todo lo que se ve ahí sale de menciones/
// alertas/proyectos reales de sentiment-api. Donde el dato real es texto
// libre (alcance) se usa una estimación editorial estándar, siempre
// etiquetada "(estimado)" en el cliente — nunca se inventa de la nada.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const proyectoParam = searchParams.get("proyecto");
  // Selector multi-proyecto del sidebar: "?proyecto=12,15,19" (2+ ids). Un
  // solo id sigue el camino rápido de siempre (el backend real ya filtra
  // por ese proyecto); sin parámetro o vacío = todos. El backend real
  // (sentiment-api) no tiene un endpoint "menciones de estos N proyectos" —
  // para un subconjunto se trae todo con /api/all-mentions (mismo que
  // "todos") y se filtra aquí por los ids seleccionados.
  const idsSeleccionados = proyectoParam
    ? proyectoParam.split(",").map((id) => id.trim()).filter(Boolean)
    : [];
  const esSubconjunto = idsSeleccionados.length > 1;
  const proyectoId = idsSeleccionados.length === 1 ? idsSeleccionados[0] : null;
  const rangoInicioParam = searchParams.get("inicio");
  const rangoFinParam = searchParams.get("fin");

  // Límite de plan (pedido del dueño, 2026-09-30): cuentas "basic" solo ven
  // los últimos 7 días — se aplica aquí, en el backend, así que pedir la URL
  // directa con ?inicio=... no lo salta. `rangoInicio`/`rangoFin` de aquí en
  // adelante YA vienen acotados; todo lo que las use (filtrado, ventanas por
  // defecto, etc.) respeta el límite sin tocar cada sitio por separado.
  const sesión = await obtenerSesión();
  const { rango: rangoConLímite, límite: límiteHistórico } = aplicarLímiteHistóricoPlan(
    rangoInicioParam && rangoFinParam ? { inicio: rangoInicioParam, fin: rangoFinParam } : null,
    sesión?.plan,
  );
  const rangoInicio = rangoConLímite?.inicio ?? null;
  const rangoFin = rangoConLímite?.fin ?? null;

  try {
    if (proyectoId) await verificarProyectoExiste(proyectoId);

    const [mencionesBase, alertasDetalle, { proyectos }, nssPorTema] = await Promise.all([
      obtenerMencionesReales(esSubconjunto ? null : proyectoId),
      obtenerAlertasDetalle(null),
      obtenerProyectosReales(),
      // Endpoint nuevo en sentiment-api: el deploy de backend/frontend no es
      // atómico (ver project-deploy-process), así que si todavía no existe
      // en el servidor no debe tumbar el resto del panel — solo ese widget
      // se queda vacío hasta que el backend se despliegue. Sin real "NSS de
      // este subconjunto" en el backend, se deja vacío en vez de mostrar el
      // de todos los proyectos (sería incorrecto, no solo incompleto).
      esSubconjunto
        ? Promise.resolve([])
        : obtenerNssPorTemaReal(
            proyectoId,
            rangoInicio && rangoFin ? { inicio: rangoInicio, fin: rangoFin } : null,
          ).catch(() => []),
    ]);

    const mencionesSinRango = esSubconjunto
      ? mencionesBase.filter((m) => idsSeleccionados.includes(m.proyectoId))
      : mencionesBase;

    const alertas = esSubconjunto
      ? alertasDetalle
          .filter((a) => a.estado === "abierta" && idsSeleccionados.includes(a.proyectoId))
          .slice(0, LÍMITE_ALERTAS)
          .map((a) => ({ id: a.id, nivel: a.nivel, mensaje: a.mensaje }))
      : await obtenerAlertasReales(proyectoId);

    // Rango del calendario (opcional): TODO el panel se acota a los días que
    // el usuario seleccionó — no solo un par de widgets. Los que arman su
    // propia ventana de "últimos N días" (calcularSerieSemanal,
    // calcularTendenciaAlcance, etc.) reciben el fin del rango como
    // referencia de "hoy" para que esa ventana termine ahí en vez del día
    // real — si no, elegir un período viejo los dejaría vacíos aunque sí
    // haya menciones dentro del rango.
    const menciones =
      rangoInicio && rangoFin
        ? filtrarMencionesPorRango(mencionesSinRango, rangoInicio, rangoFin)
        : mencionesSinRango;
    const referenciaMs = rangoFin ? inicioDeDía(new Date(`${rangoFin}T00:00:00`)) : undefined;

    const regiónPorProyecto = new Map(proyectos.map((p) => [p.id, p.ubicacion]));

    // "Alcance potencial por tipo de fuente" sí reacciona al rango del
    // calendario (o a los últimos 30 días si no hay rango elegido) — antes
    // el % de cambio ni siquiera se calculaba.
    const ventanaAlcanceFuente = calcularVentanaAlcanceFuente(rangoInicio, rangoFin);
    const alcanceFuenteActuales = filtrarMencionesPorRango(
      mencionesSinRango,
      ventanaAlcanceFuente.actualInicio,
      ventanaAlcanceFuente.actualFin,
    );
    const alcanceFuenteAnteriores = filtrarMencionesPorRango(
      mencionesSinRango,
      ventanaAlcanceFuente.anteriorInicio,
      ventanaAlcanceFuente.anteriorFin,
    );

    // Métricas por proyecto (para Resumen IA real) — siempre sobre TODAS las
    // menciones/alertas, sin filtrar por `proyectoId`, porque el resumen
    // muestra el detalle de cada proyecto independientemente del filtro activo.
    const todasLasMenciones = esSubconjunto
      ? mencionesBase // ya se trajeron todas arriba para filtrar el subconjunto
      : proyectoId
        ? await obtenerMencionesReales(null)
        : mencionesSinRango;
    const porProyecto = agruparMencionesPorProyecto(todasLasMenciones);
    const alertasPorProyecto = new Map<string, number>();
    const descripcionesAlertasPorProyecto = new Map<string, string[]>();
    for (const a of alertasDetalle) {
      if (a.estado !== "abierta") continue;
      alertasPorProyecto.set(a.proyectoId, (alertasPorProyecto.get(a.proyectoId) ?? 0) + 1);
      const lista = descripcionesAlertasPorProyecto.get(a.proyectoId) ?? [];
      lista.push(`${a.título} ${a.mensaje}`);
      descripcionesAlertasPorProyecto.set(a.proyectoId, lista);
    }

    const metricasPorProyecto: Record<string, MetricasProyectoPanel> = {};
    for (const p of proyectos) {
      const delProyecto = porProyecto.get(p.id) ?? [];
      const serie = calcularSerieSemanal(delProyecto);
      const sent = calcularSentimientoPorcentual(delProyecto);
      const conteoFuentes = new Map<string, number>();
      for (const m of delProyecto) conteoFuentes.set(m.fuente, (conteoFuentes.get(m.fuente) ?? 0) + 1);
      const fuentesPrincipales = Array.from(conteoFuentes.entries())
        .filter(([fuente]) => fuente !== "Fuente desconocida")
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([fuente]) => fuente);
      metricasPorProyecto[p.id] = {
        positivo: sent.positivo,
        negativo: sent.negativo,
        neutro: sent.neutro,
        favorabilidad: sent.favorabilidad,
        clasificadas: sent.clasificadas,
        mencionesSemana: serie.dias,
        alcance: delProyecto.reduce((s, m) => s + estimarAlcance(m), 0),
        alertas: alertasPorProyecto.get(p.id) ?? 0,
        menciones: delProyecto.length,
        alertaCrisis: calcularAlertaCrisis(
          delProyecto,
          descripcionesAlertasPorProyecto.get(p.id) ?? [],
        ),
        fuentesPrincipales,
        temasPrincipales: calcularPalabrasClaveReales(delProyecto).slice(0, 2).map((k) => k.palabra),
      };
    }

    // A diferencia de metricasPorProyecto (Resumen IA, sí cruza todos los
    // proyectos a propósito, ver comentario arriba), este widget SÍ debe
    // respetar el combo del sidebar — si hay 1 o varios proyectos
    // seleccionados, solo esos globos deben aparecer, no todos los activos.
    const rendimiento = proyectos
      .filter(
        (p) =>
          p.estado === "activo" &&
          (idsSeleccionados.length === 0 || idsSeleccionados.includes(p.id)),
      )
      .map((p) => {
        const delProyecto = porProyecto.get(p.id) ?? [];
        const total = delProyecto.length;
        const negativas = delProyecto.filter((m) => m.sentimiento === "negativo").length;
        return {
          proyectoId: p.id,
          nombre: p.nombre,
          x: total,
          y: delProyecto.reduce((s, m) => s + estimarAlcance(m), 0),
          z: total > 0 ? Math.round((negativas / total) * 100) : 0,
        };
      });

    const videoReal = calcularVideoReal(menciones);

    // Bug real reportado por el cliente (2026-09-30): "Menciones totales"
    // aquí mostraba un número distinto a "Total de menciones" en /menciones
    // para el mismo proyecto — esta tarjeta siempre usaba los últimos 7 días
    // fijos (calcularSerieSemanal), ignorando el calendario, mientras
    // /menciones ya respetaba rango elegido / 30 días por defecto. Ahora
    // ambas pantallas usan la misma fuente (calcularResumenMenciones/
    // calcularResumenAlcance, sobre mencionesSinRango para poder comparar
    // contra el período anterior real).
    const rango = rangoInicio && rangoFin ? { inicio: rangoInicio, fin: rangoFin } : null;

    const respuesta: RespuestaPanelGeneral = {
      proyectoId,
      límiteHistórico,
      menciones: calcularResumenMenciones(mencionesSinRango, rango, referenciaMs),
      sentimiento: calcularSentimientoPorcentual(menciones),
      alertas,
      trafico: calcularTraficoPorFuente(menciones),
      tonalidad: calcularTonalidadPorFuente(menciones),
      alcanceTotal: calcularResumenAlcance(mencionesSinRango, rango, referenciaMs),
      alcancePorFuente: calcularAlcancePorFuente(alcanceFuenteActuales, alcanceFuenteAnteriores),
      regiones: calcularRegionesPresencia(menciones, regiónPorProyecto),
      tendencias: calcularTendenciasEmergentes(menciones, referenciaMs),
      palabrasClave: calcularPalabrasClaveReales(menciones),
      video: videoReal.items,
      videoTotal: videoReal.total,
      tendenciaAlcance: calcularTendenciaAlcance(menciones, referenciaMs, Math.min(12, díasHastaPiso(referenciaMs, menciones))),
      tendenciaMencionesAlcance: calcularTendenciaMencionesAlcance(menciones, referenciaMs, Math.min(21, díasHastaPiso(referenciaMs, menciones))),
      // rendimiento SÍ respeta el combo (filtrado arriba); metricasPorProyecto
      // es el único que a propósito cruza TODOS los proyectos siempre, para
      // "Resumen IA" (ver comentario en su bloque). Ninguno de los dos se
      // filtra por el rango de fecha del calendario.
      rendimiento,
      metricasPorProyecto,
      nssPorTema,
      topEmisores: calcularTopEmisores(menciones),
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
