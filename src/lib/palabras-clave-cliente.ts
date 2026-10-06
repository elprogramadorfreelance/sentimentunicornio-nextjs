// Versión cliente-segura de calcularPalabrasClaveReales (lib/menciones-backend.ts
// no se puede importar en componentes "use client" porque también exporta
// funciones de servidor con next/headers). Misma lógica exacta, sin catálogo
// curado — frecuencia real en título+extracto de menciones reales.
import type { MenciónEditorial } from "@/types";

const PALABRAS_VACÍAS = new Set([
  "para", "por", "con", "las", "los", "una", "uno", "del", "que", "sus",
  "esta", "este", "esto", "más", "sobre", "como", "entre", "hacia", "desde",
  "the", "and", "for", "with", "from", "this", "that",
]);

export type PalabraClaveReal = {
  palabra: string;
  total: number;
  efectividad: "Positivo" | "Neutro" | "Negativo";
};

const EXTRACTO_RELLENO = "sin extracto disponible.";

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Google News deja el título real tal cual "Titular - Medio" (normalizeItem/
 * fetchLiveNewsForTopic en el backend solo separan el nombre del medio para
 * guardarlo aparte en `fuente` — nunca limpian el título guardado) — sin
 * esto, el nombre del medio se cuenta como si fuera un tema real de la
 * mención. Caso real (2026-10-02): "jornada" con 57% de sus apariciones
 * viniendo solo del sufijo "- La Jornada" al final del título, ninguna
 * hablando de una jornada de verdad. Solo quita el sufijo EXACTO al final
 * (no cualquier aparición del nombre en el cuerpo) para no arriesgar quitar
 * una mención genuina del medio dentro del texto real.
 */
function tituloSinSufijoFuente(m: MenciónEditorial): string {
  const fuente = (m.fuente || "").trim();
  if (!fuente) return m.título;
  const sufijo = new RegExp(`\\s*-\\s*${escaparRegex(fuente)}\\s*$`, "i");
  return m.título.replace(sufijo, "");
}

/**
 * Quita URLs y @menciones/#hashtags de un texto ya en minúsculas — de lo
 * contrario dejan residuos como "https" o "marucampos" (de un @MaruCampos
 * sin el @), o cuelan un hashtag de marca del propio medio como si fuera
 * tema real (caso real 2026-10-02: "#Cambio21", el hashtag fijo que ese
 * medio pone en TODOS sus posts, hacía que la palabra "cambio" abriera
 * menciones que no tienen nada que ver con "cambio" como tema).
 */
function sinHashtagsNiUrls(texto: string): string {
  return texto.replace(/https?:\/\/\S+/gi, " ").replace(/[@#]\w+/g, " ");
}

/** Texto base (título+extracto, minúsculas) limpio — ver sinHashtagsNiUrls. */
function textoLimpio(m: MenciónEditorial): string {
  const extracto = m.extracto.toLowerCase().trim() === EXTRACTO_RELLENO ? "" : m.extracto;
  const texto = `${tituloSinSufijoFuente(m)} ${extracto}`.toLowerCase();
  return sinHashtagsNiUrls(texto);
}

export function calcularPalabrasClaveReales(menciones: MenciónEditorial[]): PalabraClaveReal[] {
  const conteo = new Map<string, { total: number; pos: number; neg: number }>();
  for (const m of menciones) {
    const texto = textoLimpio(m);
    const palabras = texto.match(/[a-záéíóúñ]{5,}/g) ?? [];
    const vistosEnEstaMención = new Set<string>();
    for (const palabra of palabras) {
      if (PALABRAS_VACÍAS.has(palabra) || vistosEnEstaMención.has(palabra)) continue;
      vistosEnEstaMención.add(palabra);
      const actual = conteo.get(palabra) ?? { total: 0, pos: 0, neg: 0 };
      actual.total += 1;
      if (m.sentimiento === "positivo") actual.pos += 1;
      if (m.sentimiento === "negativo") actual.neg += 1;
      conteo.set(palabra, actual);
    }
  }
  return Array.from(conteo.entries())
    .filter(([, v]) => v.total >= 2)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 40)
    .map(([palabra, v]) => ({
      palabra,
      total: v.total,
      efectividad:
        v.pos > v.neg && v.pos > v.total - v.pos - v.neg
          ? ("Positivo" as const)
          : v.neg > v.pos && v.neg > v.total - v.pos - v.neg
            ? ("Negativo" as const)
            : ("Neutro" as const),
    }));
}

/**
 * Menciones reales cuyo título o extracto contiene la palabra (case-insensitive).
 * Limpia URLs/hashtags/@menciones igual que calcularPalabrasClaveReales —
 * necesario para que lo que se cuenta como keyword real sea exactamente lo
 * mismo que lo que aparece al hacer clic en ella (antes buscaba en el texto
 * crudo, así que un hashtag de marca ajeno al tema colaba menciones falsas).
 *
 * Excluye `fechaEstimada` (sin fecha real verificable — ~27% de las
 * menciones de un proyecto real llegan así, vía búsquedas que no dan fecha
 * para Instagram/Facebook). Caso real (2026-10-02): un post real pero de
 * mayo 2025 seguía apareciendo en "lo que se discute esta semana" aunque ya
 * se marcara honestamente con "~" — mostrarlo marcado no basta cuando la
 * vista entera implica actualidad; aquí se excluye del todo. La lista
 * general de Menciones (con su propio calendario) sigue mostrando este
 * contenido sin recortar — el recorte es solo para estas vistas de
 * "tendencia"/clic en una palabra o tema.
 *
 * `palabra` puede ser una palabra suelta de la nube (ya limpia) O el título
 * completo tal cual de un tema de "Principales temas" — este último SÍ
 * puede traer un hashtag literal (ej. "🔴#AHORA| ..."). Bug real
 * (2026-10-02): se limpiaba el texto de cada mención pero no `palabra`, así
 * que un hashtag en el título buscado ya no aparecía en el texto limpio y el
 * tema mostraba "sin menciones" pese a tener evidencia real — se limpia
 * `palabra` con el mismo criterio para que ambos lados comparen lo mismo.
 */
export function mencionesConPalabra(menciones: MenciónEditorial[], palabra: string): MenciónEditorial[] {
  const limpio = sinHashtagsNiUrls(palabra.toLowerCase()).trim();
  const objetivo = limpio || palabra.toLowerCase();
  return menciones.filter((m) => !m.fechaEstimada && textoLimpio(m).includes(objetivo));
}
