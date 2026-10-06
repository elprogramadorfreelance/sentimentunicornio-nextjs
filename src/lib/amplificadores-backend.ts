// Lectura de amplificadores reales desde sentiment-api (132 filas reales en
// producción: cuentas/medios que más amplifican cada tema, con score de
// influencia/riesgo calculado por el motor de análisis).
import { backendGet } from "@/lib/backend";
import { sufijoSesión } from "@/lib/session";

type AmplificadorBackend = {
  id: number;
  project_id: number;
  project_name?: string;
  name: string;
  canonical_name: string | null;
  category: string | null;
  role: string | null;
  platform: string | null;
  influence_score: string | number | null;
  risk_score: string | number | null;
  appearances: number | null;
  mentions_count: number | null;
  dominant_sentiment: string | null;
  narrative_tags: string | null;
  url: string | null;
};

export type CategoríaAmplificador = "crítico" | "aliado" | "neutral";

export type Amplificador = {
  id: string;
  proyectoId: string;
  proyecto: string;
  nombre: string;
  categoría: CategoríaAmplificador;
  rol: string;
  plataforma: string;
  influencia: number;
  riesgo: number;
  apariciones: number;
  menciones: number;
  sentimientoDominante: string;
  url: string | null;
};

function normalizarCategoría(raw: string | null): CategoríaAmplificador {
  const v = (raw ?? "").toLowerCase();
  if (v.includes("crít") || v.includes("crit")) return "crítico";
  if (v.includes("ali")) return "aliado";
  return "neutral";
}

function mapearAmplificador(a: AmplificadorBackend): Amplificador {
  return {
    id: String(a.id),
    proyectoId: String(a.project_id),
    proyecto: a.project_name ?? `Proyecto ${a.project_id}`,
    nombre: a.canonical_name || a.name || "Desconocido",
    categoría: normalizarCategoría(a.category),
    rol: a.role || "Amplificador",
    plataforma: a.platform?.trim() || "Sin especificar",
    influencia: Math.round(Number(a.influence_score) || 0),
    riesgo: Math.round(Number(a.risk_score) || 0),
    apariciones: a.appearances ?? 0,
    menciones: a.mentions_count ?? 0,
    sentimientoDominante: a.dominant_sentiment || "Neutral",
    url: a.url,
  };
}

/** Amplificadores reales — de un proyecto o de todos (usuario demo), ordenados por riesgo/menciones. */
export async function obtenerAmplificadoresReales(proyectoId: string | null): Promise<Amplificador[]> {
  const crudo = proyectoId
    ? await backendGet<AmplificadorBackend[]>(`/api/projects/${proyectoId}/amplifiers`)
    : await backendGet<AmplificadorBackend[]>(`/api/all-amplifiers${await sufijoSesión()}`);
  return crudo.map(mapearAmplificador);
}
