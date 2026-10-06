// Análisis de IA real por proyecto — el texto que `gpt-4o` realmente escribió
// (resumen ejecutivo, narrativas, recomendaciones), no una síntesis armada en
// el cliente a partir de números agregados. `response_json` en Postgres es
// el JSON completo que ya usa runLiveAnalysis en el backend (server.js) —
// aquí solo se parsea y se mapea a los tipos del frontend.
import { backendGet } from "@/lib/backend";
import type { AnálisisReal, EstadoAnalisisProyecto, NarrativaReal } from "@/types";

type AnalisisBackend = {
  id: number;
  topic: string;
  created_at: string;
  risk_level: string | null;
  response_json: string | null;
};

type ResponseJson = {
  narratives?: { name?: string; mentions?: string; sentiment?: string; risk?: string; trend?: string }[];
  resumen_titular?: string;
  executive_summary?: string;
  recommendations?: string[];
  hashtags?: string[];
  sources_distribution?: { source?: string; percentage?: number; dominant_sentiment?: string }[];
};

function mapearNarrativa(n: NonNullable<ResponseJson["narratives"]>[number]): NarrativaReal {
  return {
    nombre: n.name || "(Sin nombre)",
    menciones: n.mentions || "",
    sentimiento: (n.sentiment || "neutral").toLowerCase(),
    riesgo: n.risk || "",
    tendencia: n.trend || "",
  };
}

function mapearAnalisis(a: AnalisisBackend): AnálisisReal | null {
  if (!a.response_json) return null;
  let parsed: ResponseJson;
  try {
    parsed = JSON.parse(a.response_json);
  } catch {
    return null;
  }
  return {
    id: String(a.id),
    tema: a.topic,
    creadoEn: a.created_at,
    nivelRiesgo: a.risk_level || "Bajo",
    resumenTitular: parsed.resumen_titular?.trim() || "",
    resumenEjecutivo: parsed.executive_summary?.trim() || "",
    recomendaciones: (parsed.recommendations || []).filter(Boolean),
    narrativas: (parsed.narratives || []).map(mapearNarrativa),
    hashtags: (parsed.hashtags || []).filter(Boolean),
    distribuciónFuentes: (parsed.sources_distribution || [])
      .filter((s) => s.source)
      .map((s) => ({
        fuente: s.source || "",
        porcentaje: s.percentage ?? 0,
        sentimientoDominante: (s.dominant_sentiment || "").toLowerCase(),
      })),
  };
}

/** El análisis real más reciente de un proyecto, o null si nunca se ha corrido uno. */
export async function obtenerUltimoAnalisisReal(proyectoId: string): Promise<AnálisisReal | null> {
  const analisis = await backendGet<AnalisisBackend[]>(`/api/projects/${proyectoId}/analyses`);
  if (!analisis.length) return null;
  // El backend ya ordena DESC por id — el primero es el más reciente.
  return mapearAnalisis(analisis[0]);
}

/** Estado del análisis más reciente — para el banner "todavía recolectando información" mientras el pipeline corre en segundo plano. */
export async function obtenerEstadoAnalisis(proyectoId: string): Promise<EstadoAnalisisProyecto> {
  return backendGet<EstadoAnalisisProyecto>(`/api/projects/${proyectoId}/analysis-status`);
}
