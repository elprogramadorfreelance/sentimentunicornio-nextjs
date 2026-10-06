import type { MetricasVistaProyecto, TipoAlertaCrisis } from "@/types";

export const ETIQUETAS_ALERTA_CRISIS: Record<TipoAlertaCrisis, string> = {
  ninguna: "Ninguna",
  aumento_menciones_negativas: "Aumento de menciones negativas",
  crecimiento_fake_news: "Crecimiento de fake news",
  menciones_negativas: "Menciones negativas",
};

/** Valores fijos por proyecto semilla para demos predecibles. */
const METRICAS_POR_PROYECTO: Record<string, MetricasVistaProyecto> = {
  "adrian-rubalcava": {
    sentimientoPorcentaje: 74,
    alertaCrisis: "ninguna",
  },
  "maru-campos": {
    sentimientoPorcentaje: 38,
    alertaCrisis: "menciones_negativas",
  },
  "alejandro-armenta": {
    sentimientoPorcentaje: 62,
    alertaCrisis: "aumento_menciones_negativas",
  },
  "campana-morena-q3": {
    sentimientoPorcentaje: 45,
    alertaCrisis: "crecimiento_fake_news",
  },
  "claudia-sheinbaum": {
    sentimientoPorcentaje: 81,
    alertaCrisis: "ninguna",
  },
};

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

const ALERTAS_CICLO: TipoAlertaCrisis[] = [
  "ninguna",
  "aumento_menciones_negativas",
  "crecimiento_fake_news",
  "menciones_negativas",
];

/** Métricas de tarjeta por proyecto; proyectos nuevos reciben valores derivados del id. */
export function obtenerMetricasVistaProyecto(
  proyectoId: string,
): MetricasVistaProyecto {
  const fijo = METRICAS_POR_PROYECTO[proyectoId];
  if (fijo) return { ...fijo };

  const h = hashId(proyectoId);
  return {
    sentimientoPorcentaje: 25 + (h % 70),
    alertaCrisis: ALERTAS_CICLO[h % ALERTAS_CICLO.length],
  };
}

export type NivelCaraSentimiento = "triste" | "neutral" | "feliz";

// `porcentaje` aquí es favorabilidad (positivo entre positivo+negativo, ver
// calcularSentimientoPorcentual): 50% es el punto de empate real, no un
// extremo bajo. Por eso la banda "neutral" queda centrada ahí (45-55, empate
// dentro de margen) en vez de heredar los cortes de cuando el % se medía
// sobre el total de menciones (donde 50% ya era un resultado flojo).
export function nivelCaraSentimiento(porcentaje: number): NivelCaraSentimiento {
  if (porcentaje < 45) return "triste";
  if (porcentaje <= 55) return "neutral";
  return "feliz";
}
