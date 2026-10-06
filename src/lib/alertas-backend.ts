// Lectura + normalización de alertas reales desde sentiment-api.
import { backendGet } from "@/lib/backend";
import type { AlertaPanel, NivelAlertaPanel } from "@/lib/mock/metricas-panel";
import { sufijoSesión } from "@/lib/session";

type AlertaBackend = {
  id: number;
  project_id: number;
  project_name?: string;
  title: string | null;
  description: string | null;
  alert_type: string | null;
  risk_level: string | null;
  status: string | null;
  created_at: string;
  narrative_id?: number | null;
  amplifier_id?: number | null;
};

// Tipos reales para los que getAlertEvidence (sentiment-api/db.js) de verdad
// sabe buscar notas — deja fuera "ai" (texto libre de la IA, sin palabra/
// fuente/análisis estructurado al que buscar) para no ofrecer un enlace que
// siempre abre vacío.
const TIPOS_CON_EVIDENCIA = new Set([
  "sentiment_drop", "negative_spike", "critical_keywords",
  "sensitive_source", "high_risk_amplifier", "user_keyword",
]);

export type AlertaDetalle = {
  id: string;
  proyectoId: string;
  proyecto: string;
  nivel: NivelAlertaPanel;
  riesgo: string;
  tipo: string;
  título: string;
  mensaje: string;
  creadaEn: string;
  estado: "abierta" | "resuelta";
  /** Real, no inventado. "narrativas" abre el modal de evidencia por
   * narrativa (id = narrative_id, criterio detected_narrative, ya filtrado
   * en el backend para garantizar que siempre hay evidencia real). Cualquier
   * otra alerta abierta ("evidencia") abre el modal genérico por alerta
   * (id = el id de la propia alerta) — el backend despacha por tipo real en
   * getAlertEvidence (db.js): sentiment_drop/negative_spike/critical_keywords/
   * sensitive_source/high_risk_amplifier (2026-10-02, pedido de Darinka). */
  enlace: { destino: "narrativas" | "evidencia"; id: string } | null;
};

function mapearAlertaDetalle(a: AlertaBackend): AlertaDetalle {
  return {
    id: String(a.id),
    proyectoId: String(a.project_id),
    proyecto: a.project_name ?? `Proyecto ${a.project_id}`,
    nivel: normalizarNivel(a.risk_level),
    riesgo: a.risk_level || "Sin clasificar",
    tipo: a.alert_type || "general",
    título: a.title?.trim() || "Alerta",
    mensaje: a.description?.trim() || a.title?.trim() || "Alerta sin descripción.",
    creadaEn: a.created_at,
    estado: (a.status ?? "open").toLowerCase() === "open" ? "abierta" : "resuelta",
    enlace: a.narrative_id
      ? { destino: "narrativas", id: String(a.narrative_id) }
      : TIPOS_CON_EVIDENCIA.has(a.alert_type || "")
        ? { destino: "evidencia", id: String(a.id) }
        : null,
  };
}

/** Todas las alertas reales (abiertas y resueltas) — de un proyecto o de todos. */
export async function obtenerAlertasDetalle(proyectoId: string | null): Promise<AlertaDetalle[]> {
  const crudo = proyectoId
    ? await backendGet<AlertaBackend[]>(`/api/projects/${proyectoId}/alerts`)
    : await backendGet<AlertaBackend[]>(`/api/all-alerts${await sufijoSesión()}`);
  return crudo.map(mapearAlertaDetalle).sort((a, b) => (a.creadaEn < b.creadaEn ? 1 : -1));
}

function normalizarNivel(riskLevel: string | null): NivelAlertaPanel {
  const v = (riskLevel ?? "").toLowerCase();
  if (v.includes("crít") || v.includes("crit") || v.includes("alto")) return "critica";
  if (v.includes("medio") || v.includes("moder")) return "advertencia";
  return "info";
}

function mapearAlerta(a: AlertaBackend): AlertaPanel {
  return {
    id: String(a.id),
    nivel: normalizarNivel(a.risk_level),
    mensaje: a.description?.trim() || a.title?.trim() || "Alerta sin descripción.",
    enlace: a.narrative_id
      ? { destino: "narrativas", id: String(a.narrative_id) }
      : TIPOS_CON_EVIDENCIA.has(a.alert_type || "")
        ? { destino: "evidencia", id: String(a.id) }
        : null,
  };
}

export const LÍMITE_ALERTAS = 10;

/** Trae alertas reales abiertas — de un proyecto o de todos (usuario demo). */
export async function obtenerAlertasReales(proyectoId: string | null): Promise<AlertaPanel[]> {
  const crudo = proyectoId
    ? await backendGet<AlertaBackend[]>(`/api/projects/${proyectoId}/alerts`)
    : await backendGet<AlertaBackend[]>(`/api/all-alerts${await sufijoSesión()}`);

  return crudo
    .filter((a) => (a.status ?? "open").toLowerCase() === "open")
    .slice(0, LÍMITE_ALERTAS)
    .map(mapearAlerta);
}
