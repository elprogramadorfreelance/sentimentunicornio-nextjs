// Lectura + normalización de narrativas reales desde sentiment-api. La tabla
// `narratives` real existe desde hace tiempo (gpt-4o la llena en cada
// análisis) pero nunca tuvo su propia página — solo se veía un resumen dentro
// del Resumen de IA de un proyecto. Esta es la primera vez que se lista.
import { backendGet } from "@/lib/backend";
import type { HashtagReal } from "@/lib/api";
import { sufijoSesión } from "@/lib/session";

type NarrativaBackend = {
  id: number;
  project_id: number;
  project_name?: string;
  name: string | null;
  sentiment: string | null;
  risk_level: string | null;
  trend: string | null;
  mentions_level: string | null;
  created_at: string;
};

export type SentimientoNarrativa = "positivo" | "negativo" | "neutral";

export type NarrativaDetalle = {
  id: string;
  proyectoId: string;
  proyecto: string;
  nombre: string;
  sentimiento: SentimientoNarrativa;
  riesgo: string;
  tendencia: string;
  menciones: string;
  creadaEn: string;
};

function normalizarSentimiento(valor: string | null): SentimientoNarrativa {
  const v = (valor ?? "").toLowerCase();
  if (v.startsWith("positiv")) return "positivo";
  if (v.startsWith("negativ")) return "negativo";
  return "neutral";
}

function mapearNarrativaDetalle(n: NarrativaBackend): NarrativaDetalle {
  return {
    id: String(n.id),
    proyectoId: String(n.project_id),
    proyecto: n.project_name ?? `Proyecto ${n.project_id}`,
    nombre: n.name?.trim() || "Narrativa sin nombre",
    sentimiento: normalizarSentimiento(n.sentiment),
    riesgo: n.risk_level?.trim() || "Sin clasificar",
    tendencia: n.trend?.trim() || "Sin dato",
    menciones: n.mentions_level?.trim() || "Sin dato",
    creadaEn: n.created_at,
  };
}

/** Todas las narrativas reales detectadas por la IA — de un proyecto o de todos. */
export async function obtenerNarrativasDetalle(proyectoId: string | null): Promise<NarrativaDetalle[]> {
  const crudo = proyectoId
    ? await backendGet<NarrativaBackend[]>(`/api/projects/${proyectoId}/narratives`)
    : await backendGet<NarrativaBackend[]>(`/api/all-narratives${await sufijoSesión()}`);
  return crudo.map(mapearNarrativaDetalle).sort((a, b) => (a.creadaEn < b.creadaEn ? 1 : -1));
}

/**
 * Hashtags reales de TODOS los proyectos del usuario en una sola llamada —
 * el backend real ya agrega y ordena esto (`agregarHashtagsDesdeAnalisis` en
 * server.js) vía /api/all-hashtags, mismo endpoint que /api/all-narratives
 * de arriba. Antes, con "todos" seleccionado en el combo, Narrativas pedía
 * esto proyecto por proyecto (una llamada HTTP real por cada uno) y lo
 * volvía a combinar en el cliente — con 10 proyectos activos eran 10 viajes
 * de red solo para esto, la causa real de la carga lenta reportada.
 */
export async function obtenerHashtagsTodos(): Promise<HashtagReal[]> {
  return backendGet<HashtagReal[]>(`/api/all-hashtags${await sufijoSesión()}`);
}
