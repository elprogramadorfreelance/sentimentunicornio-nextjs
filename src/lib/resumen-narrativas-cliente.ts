// Construye el mismo "Resumen IA" que trae la referencia de Bruno (texto +
// chips + lectura), pero con datos 100% reales — mismo criterio de
// estimación de alcance que ya usa el resto del producto (ver estimarAlcance
// en menciones-backend.ts), copiado aquí porque ese archivo no se puede
// importar en un componente cliente.
import { formatearAlcanceCompacto } from "@/lib/mock/dashboard-general";
import type { PalabraClaveReal } from "@/lib/palabras-clave-cliente";
import type { HashtagReal } from "@/lib/api";
import type { PaisMapa } from "@/components/charts/grafica-mapa-paises";
import type { FuenteMenciones, MenciónEditorial } from "@/types";

// Antes tenía un fallback a etiquetas cualitativas inventadas ("Nacional" =
// 500k, "Internacional" = 1M) para menciones sin cifra real — el mismo bug
// que infló el alcance del dashboard con citas de IA sin medición real
// (corregido 2026-10-01 en menciones-backend.ts, pero esta copia nunca se
// actualizó). Sin cifra real medida, el alcance es honestamente 0.
function estimarAlcance(m: MenciónEditorial): number {
  return m.alcance > 0 ? m.alcance : 0;
}

export type ResumenNarrativasReal = {
  titular: string;
  texto: string;
  chips: { etiqueta: string; valor: string }[];
  lectura: string[];
};

export function construirResumenNarrativasReal(
  menciones: MenciónEditorial[],
  hashtags: HashtagReal[],
  palabrasClave: PalabraClaveReal[],
  países: PaisMapa[],
  fuentes: FuenteMenciones[],
  alcanceEtiqueta: string,
): ResumenNarrativasReal | null {
  if (menciones.length === 0) return null;

  const alcanceTotal = menciones.reduce((s, m) => s + estimarAlcance(m), 0);
  const topPaís = países[0];
  const cuotaVoz = topPaís ? (topPaís.menciones / menciones.length) * 100 : 0;
  const topHashtag = hashtags[0]?.hashtag ?? "hashtags emergentes";
  const topFrase = palabrasClave[0]?.palabra ?? "temas clave";
  const topFuente = fuentes[0]?.nombre ?? "las redes";

  return {
    titular: `Narrativa dominante: **${topHashtag}**, cuota de voz concentrada en **${topPaís?.pais ?? "un solo origen"}**.`,
    texto:
      `En ${alcanceEtiqueta}, la conversación se concentra en **${topHashtag}** ` +
      `y en la palabra "**${topFrase}**". ` +
      `**${topPaís?.pais ?? "Tu proyecto"}** concentra la mayor cuota de voz ` +
      `(**${cuotaVoz.toFixed(1)}%**) y **${topFuente}** lidera el alcance.`,
    chips: [
      { etiqueta: "Menciones", valor: formatearAlcanceCompacto(menciones.length) },
      { etiqueta: "Alcance (estimado)", valor: formatearAlcanceCompacto(alcanceTotal) },
      { etiqueta: "Cuota de voz", valor: `${cuotaVoz.toFixed(1)}%` },
    ],
    lectura: [
      topPaís
        ? `**${topPaís.pais}** concentra la mayor cuota de voz con **${formatearAlcanceCompacto(topPaís.menciones)}** menciones.`
        : "Todavía no hay suficientes menciones reales para identificar el país dominante.",
      `El hashtag **${topHashtag}** y la palabra "**${topFrase}**" articulan la narrativa dominante.`,
      fuentes[0]
        ? `**${fuentes[0].nombre}** aporta la mayor actividad (**${fuentes[0].porcentaje}%** del total).`
        : "Todavía no hay suficientes menciones reales para identificar la fuente dominante.",
    ],
  };
}
