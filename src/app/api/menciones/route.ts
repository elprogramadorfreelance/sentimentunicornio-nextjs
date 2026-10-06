import { type NextRequest, NextResponse } from "next/server";
import {
  BackendError,
  CANALES_SOCIALES,
  calcularFuentesConCambio,
  cambioPorcentual,
  obtenerMencionesReales,
  verificarProyectoExiste,
  VOLUMEN_MINIMO_CAMBIO,
} from "@/lib/menciones-backend";
import { aplicarLímiteHistóricoPlan, obtenerSesión } from "@/lib/session";
import type {
  MenciónEditorial,
  PuntoTendenciaMenciones,
  RespuestaMenciones,
  ResumenMenciones,
} from "@/types";

const DÍAS_TENDENCIA = 30;
const MS_DÍA = 86_400_000;

function inicioDeDía(fecha: Date): number {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()).getTime();
}

// Sin rango elegido: ventana fija de 30 días terminando hoy (comportamiento
// de siempre). Con rango (CalendarioMenciones): la "actual" es exactamente
// el período elegido y la "anterior" es el mismo número de días justo antes
// — mismo criterio que calcularVentanaAlcanceFuente en /api/proyectos/panel.
function construirResumenYTendencia(
  menciones: MenciónEditorial[],
  rango: { inicio: string; fin: string } | null,
) {
  const hoy = inicioDeDía(new Date());
  const inicioActual = rango ? inicioDeDía(new Date(`${rango.inicio}T00:00:00`)) : hoy - (DÍAS_TENDENCIA - 1) * MS_DÍA;
  const finActual = rango ? inicioDeDía(new Date(`${rango.fin}T00:00:00`)) : hoy;
  const duraciónDías = Math.round((finActual - inicioActual) / MS_DÍA) + 1;
  const inicioAnterior = inicioActual - duraciónDías * MS_DÍA;

  const actuales: MenciónEditorial[] = [];
  const anteriores: MenciónEditorial[] = [];
  const porDíaActual = new Map<number, number>();
  const porDíaAnterior = new Map<number, number>();
  const estimadasPorDíaActual = new Map<number, number>();

  for (const m of menciones) {
    const t = inicioDeDía(new Date(m.publicadaEn));
    if (t >= inicioActual && t <= finActual) {
      actuales.push(m);
      porDíaActual.set(t, (porDíaActual.get(t) ?? 0) + 1);
      if (m.fechaEstimada) estimadasPorDíaActual.set(t, (estimadasPorDíaActual.get(t) ?? 0) + 1);
    } else if (t >= inicioAnterior && t < inicioActual) {
      anteriores.push(m);
      porDíaAnterior.set(t, (porDíaAnterior.get(t) ?? 0) + 1);
    }
  }

  const tendencia: PuntoTendenciaMenciones[] = Array.from({ length: duraciónDías }, (_, i) => {
    const díaActual = inicioActual + i * MS_DÍA;
    const díaAnterior = inicioAnterior + i * MS_DÍA;
    return {
      fecha: new Date(díaActual).toISOString().slice(0, 10),
      actual: porDíaActual.get(díaActual) ?? 0,
      anterior: porDíaAnterior.get(díaAnterior) ?? 0,
      estimadasActual: estimadasPorDíaActual.get(díaActual) ?? 0,
    };
  });

  const contar = (lista: MenciónEditorial[], pred: (m: MenciónEditorial) => boolean) =>
    lista.filter(pred).length;
  const esPositiva = (m: MenciónEditorial) => m.sentimiento === "positivo";
  const esNegativa = (m: MenciónEditorial) => m.sentimiento === "negativo";
  const esSocial = (m: MenciónEditorial) => CANALES_SOCIALES.has(m.tipoFuente);

  // Bug real (2026-09-30): "sin rango = todo el histórico" sonaba bien pero
  // en la práctica el backend limita a 2000/5000 filas (ver getMentionsByProject
  // en sentiment-api/db.js) — ese "total" nunca era el histórico real, era
  // el tope de la paginación, y por eso no coincidía con "Menciones totales"
  // de /proyectos (que sí ya escalaba por período). Ahora siempre se cuenta
  // sobre `actuales` (el período real: 30 días por defecto, o el rango
  // exacto elegido) — mismo criterio en ambas pantallas, sin tope escondido.
  const baseConteo = actuales;

  const esEditorial = (m: MenciónEditorial) => !esSocial(m);
  const delta = (pred: (m: MenciónEditorial) => boolean) => contar(actuales, pred) - contar(anteriores, pred);
  // Mismo candado de base chica que el resto de la app (VOLUMEN_MINIMO_CAMBIO):
  // sin él, 1 mención antes vs 5 ahora daba +400% y se veía como dato real.
  const pct = (actual: number, anterior: number) =>
    anterior >= VOLUMEN_MINIMO_CAMBIO ? cambioPorcentual(actual, anterior) : null;
  const resumen: ResumenMenciones = {
    total: baseConteo.length,
    cambioTotal: pct(actuales.length, anteriores.length),
    cambioTotalAbsoluto: actuales.length - anteriores.length,
    positivas: contar(baseConteo, esPositiva),
    cambioPositivas: pct(contar(actuales, esPositiva), contar(anteriores, esPositiva)),
    cambioPositivasAbsoluto: delta(esPositiva),
    negativas: contar(baseConteo, esNegativa),
    cambioNegativas: pct(contar(actuales, esNegativa), contar(anteriores, esNegativa)),
    cambioNegativasAbsoluto: delta(esNegativa),
    redesSociales: contar(baseConteo, esSocial),
    cambioRedesSociales: pct(contar(actuales, esSocial), contar(anteriores, esSocial)),
    cambioRedesSocialesAbsoluto: delta(esSocial),
    editoriales: contar(baseConteo, esEditorial),
    cambioEditoriales: pct(contar(actuales, esEditorial), contar(anteriores, esEditorial)),
    cambioEditorialesAbsoluto: delta(esEditorial),
  };

  // Ventana fija de 30 días sin rango elegido: si el proyecto apenas empezó
  // a monitorearse hace pocos días, la mayoría de esos 30 días quedan en 0 y
  // la gráfica arranca con un tramo plano largo antes del dato real. Se
  // recortan los días iniciales sin ninguna mención (ni actual ni anterior)
  // — solo en la ventana automática; un rango que el usuario sí eligió a
  // mano en el calendario se respeta completo, aunque tenga ceros de verdad.
  const tendenciaRecortada = rango
    ? tendencia
    : (() => {
        const primerÍndiceConDatos = tendencia.findIndex((p) => p.actual > 0 || p.anterior > 0);
        return primerÍndiceConDatos <= 0 ? tendencia : tendencia.slice(primerÍndiceConDatos);
      })();

  return {
    resumen,
    tendencia: tendenciaRecortada,
    actuales,
    fuentes: calcularFuentesConCambio(actuales, anteriores, actuales.length),
    período: {
      inicio: new Date(inicioActual).toISOString().slice(0, 10),
      fin: new Date(finActual).toISOString().slice(0, 10),
    },
  };
}

// Cuántas menciones reales manda el dashboard general (vista=resumen) para
// la tarjeta "con más presencia" — no necesita las miles de menciones del
// proyecto, solo las de más alcance. Narrativas sigue pidiendo el array
// completo (sin este parámetro) porque calcula palabras clave y países
// reales sobre todas las menciones.
const MÁXIMO_DESTACADAS = 30;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const proyectoParam = searchParams.get("proyecto");
  // Selector multi-proyecto del sidebar: "?proyecto=12,15,19" (2+ ids). Un
  // solo id sigue el camino rápido de siempre (el backend real ya filtra
  // por ese proyecto); sin parámetro o vacío = todos. Mismo criterio que
  // /api/proyectos/panel: el backend no tiene "menciones de estos N
  // proyectos", así que para un subconjunto se trae todo y se filtra aquí.
  const idsSeleccionados = proyectoParam
    ? proyectoParam.split(",").map((id) => id.trim()).filter(Boolean)
    : [];
  const esSubconjunto = idsSeleccionados.length > 1;
  const proyectoId = idsSeleccionados.length === 1 ? idsSeleccionados[0] : null;
  const soloResumen = searchParams.get("vista") === "resumen";
  const rangoInicioParam = searchParams.get("inicio");
  const rangoFinParam = searchParams.get("fin");

  // Límite de plan (pedido del dueño, 2026-09-30): cuentas "basic" solo ven
  // los últimos 7 días — aplicado en el backend, no solo en la UI, para que
  // no se pueda saltar pidiendo la URL directa con ?inicio=...
  const sesión = await obtenerSesión();
  const { rango, límite: límiteHistórico } = aplicarLímiteHistóricoPlan(
    rangoInicioParam && rangoFinParam ? { inicio: rangoInicioParam, fin: rangoFinParam } : null,
    sesión?.plan,
  );

  let menciones: MenciónEditorial[];
  try {
    if (proyectoId) await verificarProyectoExiste(proyectoId);
    const mencionesBase = await obtenerMencionesReales(esSubconjunto ? null : proyectoId);
    menciones = esSubconjunto
      ? mencionesBase.filter((m) => idsSeleccionados.includes(m.proyectoId))
      : mencionesBase;
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

  const { resumen, tendencia, actuales, fuentes, período } = construirResumenYTendencia(menciones, rango);

  // Con rango elegido, la lista de abajo también se acota al período exacto
  // — si no, mostraría menciones fuera del rango que el calendario dice estar viendo.
  const mencionesDelPeríodo = rango ? actuales : menciones;

  const respuesta: RespuestaMenciones = {
    proyectoId,
    límiteHistórico,
    período,
    resumen,
    // Canal real detectado por dominio de URL (ver normalizarTipoFuente) —
    // solo aparecen los canales con al menos una mención real.
    fuentes,
    tendencia,
    menciones: soloResumen
      ? [...mencionesDelPeríodo].sort((a, b) => b.alcance - a.alcance).slice(0, MÁXIMO_DESTACADAS)
      : mencionesDelPeríodo,
  };

  return NextResponse.json(respuesta);
}
