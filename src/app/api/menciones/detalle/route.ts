import { type NextRequest, NextResponse } from "next/server";
import { FUENTES_MENCIÓN_DETALLE } from "@/lib/mock/menciones-detalle";
import { BackendError, obtenerMencionesReales, verificarProyectoExiste } from "@/lib/menciones-backend";
import type {
  CategoríaSentimiento,
  MenciónDetalle,
  MenciónEditorial,
  RespuestaMencionesDetalle,
  TipoFuenteMención,
} from "@/types";

const PLACEHOLDER_EXTRACTO = "Sin extracto disponible.";

function aMenciónDetalle(m: MenciónEditorial): MenciónDetalle {
  return {
    id: m.id,
    proyectoId: m.proyectoId,
    tipoFuente: m.tipoFuente,
    fuente: m.fuente,
    autor: m.autor,
    // El backend real no distingue "usuario/handle" de "autor" — es el mismo dato.
    usuario: m.autor,
    contenido: m.extracto !== PLACEHOLDER_EXTRACTO ? m.extracto : m.título,
    url: m.url,
    publicadaEn: m.publicadaEn,
    fechaEstimada: m.fechaEstimada,
    sentimiento: m.sentimiento,
    // alcanceNumérico (menciones-backend.ts) devuelve 0 cuando `reach` no es
    // un número puro (la mayoría de los casos reales) — aquí se trata ese 0
    // como "sin dato real" en vez de mostrarlo como si fuera un alcance
    // verificado de cero personas.
    alcance: m.alcance > 0 ? m.alcance : null,
    // Real cuando la fuente fue SocialCrawl (scrapea la plataforma directo,
    // trae vistas+likes reales) — null cuando vino de Brave/SerpApi/GDELT
    // (un buscador indexando el post, sin acceso a sus métricas reales).
    interacciones: m.interacciones ?? null,
    // No existe en ninguna fuente real integrada (ni SocialCrawl ni los
    // buscadores traen "veces compartido" de Instagram/TikTok/Facebook).
    compartidos: null,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const proyectoId = searchParams.get("proyecto");
  const búsqueda = (searchParams.get("búsqueda") ?? "").trim().toLowerCase();
  const fuentesSolicitadas = (searchParams.get("fuentes") ?? "").split(",").filter(Boolean);
  const fuenteColumna = searchParams.get("fuente");
  const sentimiento = searchParams.get("sentimiento");
  const página = Math.max(1, Number(searchParams.get("página") ?? 1));
  const tamaño = Math.min(100, Math.max(1, Number(searchParams.get("tamaño") ?? 24)));

  const fuentesVálidas = new Set<string>(FUENTES_MENCIÓN_DETALLE.map((f) => f.id));
  if (fuentesSolicitadas.some((fuente) => !fuentesVálidas.has(fuente))) {
    return NextResponse.json(
      { código: "FUENTE_NO_VÁLIDA", mensaje: "Una o más fuentes solicitadas no son válidas." },
      { status: 400 },
    );
  }
  if (fuenteColumna && !fuentesVálidas.has(fuenteColumna)) {
    return NextResponse.json(
      { código: "FUENTE_NO_VÁLIDA", mensaje: "La fuente solicitada no es válida." },
      { status: 400 },
    );
  }
  if (sentimiento && !["positivo", "neutral", "negativo"].includes(sentimiento)) {
    return NextResponse.json(
      { código: "SENTIMIENTO_NO_VÁLIDO", mensaje: "El sentimiento solicitado no es válido." },
      { status: 400 },
    );
  }

  let menciones: MenciónEditorial[];
  try {
    if (proyectoId) await verificarProyectoExiste(proyectoId);
    menciones = await obtenerMencionesReales(proyectoId);
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

  // Filtros que aplican siempre, antes de separar por fuente.
  let filtradasBase = menciones;
  if (sentimiento) {
    filtradasBase = filtradasBase.filter((m) => m.sentimiento === (sentimiento as CategoríaSentimiento));
  }
  if (búsqueda) {
    filtradasBase = filtradasBase.filter(
      (m) =>
        m.título.toLowerCase().includes(búsqueda) ||
        m.extracto.toLowerCase().includes(búsqueda) ||
        m.fuente.toLowerCase().includes(búsqueda) ||
        m.autor.toLowerCase().includes(búsqueda),
    );
  }

  // Todas las fuentes seleccionadas juntas — de aquí salen el total general
  // y el conteo real por fuente (independiente de qué tan poco se haya
  // cargado de cada una todavía).
  const fuentesSet = new Set<TipoFuenteMención>(fuentesSolicitadas as TipoFuenteMención[]);
  const filtradasSeleccionadas =
    fuentesSet.size > 0 ? filtradasBase.filter((m) => fuentesSet.has(m.tipoFuente)) : filtradasBase;
  const total = filtradasSeleccionadas.length;
  const totalPorFuente: Partial<Record<TipoFuenteMención, number>> = {};
  for (const m of filtradasSeleccionadas) {
    totalPorFuente[m.tipoFuente] = (totalPorFuente[m.tipoFuente] ?? 0) + 1;
  }

  // La página en sí se saca SOLO de la fuente pedida (`fuente`, singular) —
  // antes se sacaba de filtradasSeleccionadas (todas mezcladas), y una
  // fuente con pocas menciones reales (ej. Facebook con 7, contra 534 de X)
  // quedaba enterrada sin cargarse nunca, aunque el badge del encabezado sí
  // mostrara el número real. Sin `fuente` en la solicitud, se mantiene el
  // comportamiento viejo (mezcla de todas) por compatibilidad.
  const filtradasColumna = fuenteColumna
    ? filtradasBase.filter((m) => m.tipoFuente === (fuenteColumna as TipoFuenteMención))
    : filtradasSeleccionadas;
  const inicio = (página - 1) * tamaño;
  const página_ = filtradasColumna.slice(inicio, inicio + tamaño).map(aMenciónDetalle);

  const respuesta: RespuestaMencionesDetalle = {
    menciones: página_,
    página,
    tamaño,
    total,
    hayMás: inicio + tamaño < filtradasColumna.length,
    totalPorFuente,
  };

  return NextResponse.json(respuesta);
}
