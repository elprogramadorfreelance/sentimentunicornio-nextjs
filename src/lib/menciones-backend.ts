// Lectura + normalización de menciones reales desde sentiment-api. Se usa
// tanto desde /api/menciones como desde /api/proyectos/panel — un solo lugar
// para el mapeo de sentimiento/canal/alcance, evita que los dos endpoints se
// desincronicen.
import { BackendError, backendGet } from "@/lib/backend";
import { repartirPorcentajesEnteros } from "@/lib/porcentajes";
import { sufijoSesión } from "@/lib/session";
import { letrasEnvueltasAAscii } from "./texto-letras";
import type {
  CategoríaSentimiento,
  EmisorVolumen,
  MenciónEditorial,
  NssPorTema,
  PuntoSerieSentimiento,
  PuntoTendenciaTonalidad,
  SegmentoTonalidad,
  TipoFuenteMención,
} from "@/types";

type MencionBackend = {
  id: number;
  project_id: number;
  title: string | null;
  content: string | null;
  url: string | null;
  source_name: string | null;
  source_type: string | null;
  author_name: string | null;
  published_at: string | null;
  sentiment: string | null;
  reach: string | null;
  created_at: string;
  thumbnail_url: string | null;
  engagement_score: number | null;
  // Fase 3/4 (arquitectura Luis v2, 2026-09-30): campos limpios via join a
  // source_types/authors — nulos en menciones que aún no pasaron por el
  // backfill (nuevas). autor_canonico en particular resuelve B9 (Google
  // News apareciendo repetido en top emisores con variantes de nombre).
  fuente_codigo?: string | null;
  fuente_nombre?: string | null;
  autor_canonico?: string | null;
  fecha_publicacion_confiable?: boolean | null;
};

// El `sentiment` real trae ~15 variantes (español/inglés, mayúsculas mixtas,
// compuestos como "Neutral-to-Negativo") porque lo genera la IA por análisis,
// sin catálogo fijo. Se normaliza por coincidencia de subcadena.
function normalizarSentimiento(raw: string | null): CategoríaSentimiento {
  const v = (raw ?? "").toLowerCase();
  if (v.includes("positiv")) return "positivo";
  if (v.includes("negativ")) return "negativo";
  return "neutral";
}

// `source_type` real describe el género editorial ("Crónica", "Reflexión
// académica"...), casi nunca el canal. El dominio de la URL sí es una señal
// real y confiable — verificado contra las 554 menciones reales: 49 de
// YouTube, 27 de X, 3 Facebook, 1 Instagram detectables por dominio que
// `source_type` solo no captaba. Se usa la URL primero; `source_type` como
// respaldo para los pocos casos donde si trae el valor literal.
const MAPA_CANAL_SOURCE_TYPE: Record<string, TipoFuenteMención> = {
  twitter: "x",
  x: "x",
  facebook: "facebook",
  instagram: "instagram",
  youtube: "youtube",
  tiktok: "tiktok",
};

export function normalizarTipoFuente(url: string | null, sourceType: string | null): TipoFuenteMención {
  const u = (url ?? "").toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("facebook.com")) return "facebook";
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("tiktok.com")) return "tiktok";
  if (u.includes("twitter.com") || u.includes("x.com")) return "x";
  return MAPA_CANAL_SOURCE_TYPE[(sourceType ?? "").toLowerCase()] ?? "noticias";
}

// Bug real (2026-10-02): TikTok se quedó fuera de este set — las menciones
// de TikTok caían silenciosamente en "Menciones editoriales" en vez de "En
// redes sociales" (Menciones Y Benchmarking usan este mismo set), aunque
// TikTok es tan red social como Instagram/X/Facebook/YouTube.
export const CANALES_SOCIALES = new Set<TipoFuenteMención>(["x", "facebook", "instagram", "youtube", "tiktok"]);

// `reach` real es texto libre ("451", "Nacional", oraciones completas). Solo
// se toma cuando es un número puro; el resto cuenta como 0 en vez de
// inventar una conversión de "Alta"/"Nacional" a una cifra.
function alcanceNumérico(reach: string | null): number {
  const limpio = reach?.trim() ?? "";
  return /^\d+$/.test(limpio) ? Number(limpio) : 0;
}

// B7 (arquitectura Luis v2): timestamps con hora exacta 00:00:00/07:00:00
// son fecha de detección disfrazada de fecha de publicación real — usarlos
// tal cual generaba picos artificiales en las series de tiempo (ej. el pico
// falso del 09/11 que documentó Luis). fecha_publicacion_confiable=false ya
// identifica estos casos reales (backfill Fase 3); ahí se usa created_at
// (cuándo de verdad se detectó) en vez de la fecha fabricada. null (aún sin
// backfill) o true (confiable) se comportan como antes.
function fechaMención(m: MencionBackend): Date {
  const fechaBase =
    m.fecha_publicacion_confiable === false
      ? m.created_at
      : (m.published_at ?? m.created_at);
  const fecha = new Date(fechaBase);
  return Number.isNaN(fecha.getTime()) ? new Date(m.created_at) : fecha;
}

// Algunas fuentes (Brave/SocialCrawl/Perplexity) entregan texto con entidades
// HTML sin decodificar — "&quot;&quot;" se veía literal en las tarjetas
// (reportado por el cliente, 2026-10-03). Se decodifica en el mapeo, así
// cubre también menciones ya guardadas sin tocar la base.
const ENTIDADES_HTML: Record<string, string> = {
  "&quot;": '"', "&#34;": '"', "&apos;": "'", "&#39;": "'", "&#x27;": "'",
  "&amp;": "&", "&lt;": "<", "&gt;": ">", "&nbsp;": " ", "&ndash;": "–", "&mdash;": "—",
};
export function decodificarEntidadesHtml(texto: string): string {
  return texto
    .replace(/&(quot|apos|amp|lt|gt|nbsp|ndash|mdash);|&#39;|&#34;|&#x27;/g, (e) => ENTIDADES_HTML[e] ?? e)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

function mapearMención(m: MencionBackend): MenciónEditorial {
  // fuente_codigo (Fase 3/4) ya viene resuelto por dominio real de URL desde
  // el backfill — se prefiere sobre volver a derivarlo aquí; solo se cae a
  // la heurística vieja para menciones nuevas que todavía no tienen el join.
  const tipoFuente = m.fuente_codigo
    ? (MAPA_CANAL_SOURCE_TYPE[m.fuente_codigo] ?? "noticias")
    : normalizarTipoFuente(m.url, m.source_type);
  // YouTube siempre tiene miniatura real (CDN pública de YouTube, construida
  // del id del video). El resto solo la tiene si la fuente de verdad la
  // capturó (Instagram/TikTok vía SocialCrawl) — nunca se inventa una.
  const idYoutube = tipoFuente === "youtube" && m.url ? idVideoYoutube(m.url) : null;
  const imagenUrl = idYoutube ? `https://img.youtube.com/vi/${idYoutube}/mqdefault.jpg` : m.thumbnail_url || null;
  return {
    id: String(m.id),
    proyectoId: String(m.project_id),
    título: decodificarEntidadesHtml(letrasEnvueltasAAscii(m.title || "(Sin título)")),
    extracto: decodificarEntidadesHtml(letrasEnvueltasAAscii(m.content?.trim() || "Sin extracto disponible.")),
    fuente: decodificarEntidadesHtml(letrasEnvueltasAAscii(m.source_name || "Fuente desconocida")),
    autor: m.autor_canonico || m.author_name || m.source_name || "Redacción",
    url: m.url || "",
    publicadaEn: fechaMención(m).toISOString(),
    sentimiento: normalizarSentimiento(m.sentiment),
    tipoFuente,
    alcance: alcanceNumérico(m.reach),
    // No existe en el esquema actual (ni en la tabla ni en raw_json).
    compartidos: 0,
    alcanceEtiqueta: m.reach?.trim() || null,
    sentimientoClasificado: !!(m.sentiment ?? "").trim(),
    imagenUrl,
    interacciones: m.engagement_score ?? null,
    fechaEstimada: !m.published_at || m.fecha_publicacion_confiable === false,
  };
}

export function estimarAlcance(m: MenciónEditorial): number {
  // Solo cuenta alcance cuando hay una cifra REAL medida (reach/reach_numeric
  // de la plataforma). Antes, cuando no había cifra real, se rellenaba con
  // una etiqueta cualitativa ("Nacional"=500k, "Internacional"=1M) o, si
  // tampoco había etiqueta, con un default fijo de 3,000 — ambos inventados.
  // Esa etiqueta es casi siempre el "estimated_reach" que gpt-4o le pone a
  // sus propias citas de contexto ("relevant_publications"/amplificadores,
  // ver saveMentionsFromAnalysis) — y a diferencia de lo que se pensó al
  // arreglar esto la primera vez, NO todas esas citas vienen sin URL: varias
  // sí traen una URL real pero igual cargan la etiqueta inventada de la IA,
  // así que un filtro "solo si no hay URL" no bastaba (8 citas "Nacional"
  // CON url cayeron el mismo día e inflaron el alcance en 4,000,000 de la
  // nada). La regla real y a prueba de esto: sin cifra medida, no hay
  // alcance — 0, no un número inventado. La mención sigue contando igual.
  return m.alcance > 0 ? m.alcance : 0;
}

/** Trae y normaliza menciones reales — de un proyecto o de todos los de la organización en sesión. */
export async function obtenerMencionesReales(proyectoId: string | null): Promise<MenciónEditorial[]> {
  const crudo = proyectoId
    ? await backendGet<MencionBackend[]>(`/api/projects/${proyectoId}/mentions`)
    : await backendGet<MencionBackend[]>(`/api/all-mentions${await sufijoSesión()}`);

  return crudo
    .map(mapearMención)
    .sort((a, b) => new Date(b.publicadaEn).getTime() - new Date(a.publicadaEn).getTime());
}

/** NSS real por narrativa — sentiment-api ya hace el match mención↔narrativa (detected_narrative) y el cálculo. */
export async function obtenerNssPorTemaReal(
  proyectoId: string | null,
  rango?: { inicio: string; fin: string } | null,
): Promise<NssPorTema[]> {
  const paramsRango = rango ? `inicio=${rango.inicio}&fin=${rango.fin}` : "";
  if (proyectoId) {
    return backendGet<NssPorTema[]>(
      `/api/projects/${proyectoId}/nss-por-narrativa${paramsRango ? `?${paramsRango}` : ""}`,
    );
  }
  const sufijo = await sufijoSesión();
  const resto = paramsRango ? `${sufijo ? "&" : "?"}${paramsRango}` : "";
  return backendGet<NssPorTema[]>(`/api/all-nss-por-narrativa${sufijo}${resto}`);
}

// "Redacción" es el relleno genérico de mapearMención cuando ni author_name
// ni source_name vienen en el dato real (ver arriba) — agruparlo como si
// fuera un solo emisor mezclaría outlets distintos bajo una identidad falsa.
const EMISOR_GENÉRICO = "Redacción";

/**
 * `autor` cae a `source_name` cuando no hay autor real (posts de Facebook
 * sin autor expuesto, resultados de búsqueda genéricos) — y `source_name`
 * no siempre viene normalizado igual entre ingestas distintas: la misma
 * fuente llega unas veces como "www.facebook.com" y otras como
 * "facebook.com", partiendo lo que debería ser UN SOLO emisor en dos filas
 * (bug real reportado por el cliente, 2026-10-01: "Top 10 emisores" con
 * Facebook repetido). Solo se le quita "www." a algo que de verdad parece
 * un hostname (tiene un punto, sin espacios) — un nombre de persona real
 * nunca entra en ese patrón, así que no se toca.
 */
function clavesAgrupaciónEmisor(autor: string): string {
  const esHostname = /^www\.[^\s]+\.[^\s]+$/i.test(autor.trim());
  return esHostname ? autor.trim().replace(/^www\./i, "") : autor;
}

/** Top emisores reales por volumen de menciones — a partir de MenciónEditorial.autor, ya real. */
export function calcularTopEmisores(menciones: MenciónEditorial[]): EmisorVolumen[] {
  const conteo = new Map<string, number>();
  for (const m of menciones) {
    if (!m.autor || m.autor === EMISOR_GENÉRICO) continue;
    const clave = clavesAgrupaciónEmisor(m.autor);
    conteo.set(clave, (conteo.get(clave) ?? 0) + 1);
  }
  return Array.from(conteo.entries())
    .map(([emisor, total]) => ({ emisor, menciones: total }))
    .sort((a, b) => b.menciones - a.menciones)
    .slice(0, 10);
}

/** Lanza BackendError(404) si el proyecto no existe — usar antes de pedir sus menciones. */
export async function verificarProyectoExiste(proyectoId: string): Promise<void> {
  await backendGet(`/api/projects/${proyectoId}`);
}

// null = "N/D" — sin período anterior real contra el cual comparar, mostrar
// un % inventado (100% si actual>0, 0% si no) es peor que ser honestos: un
// proyecto nuevo con 1 mención hoy y 0 ayer NO creció "100%", no hay base de
// comparación real todavía.
//
// Segundo caso real encontrado (2026-09-30): con anterior>0 no basta —
// SocialCrawl/keywords/cron se arreglaron apenas esta semana, así que un mes
// viejo como agosto tiene casi nada de datos reales comparado con septiembre
// (46 vs 2,485 menciones reales, un caso real verificado), produciendo
// "+15,727%" — matemáticamente correcto, pero ningún cliente se lo va a
// creer y hace ver la plataforma como rota. Se descarta cuando el período
// actual es más de 10x el anterior; esto se autocorrige solo conforme se
// acumula historial real mes a mes, no hace falta quitarlo a mano después.
const PROPORCIÓN_MÁXIMA_CAMBIO_CREÍBLE = 10;

export function cambioPorcentual(actual: number, anterior: number): number | null {
  if (anterior === 0) return null;
  if (actual / anterior > PROPORCIÓN_MÁXIMA_CAMBIO_CREÍBLE) return null;
  return Number((((actual - anterior) / anterior) * 100).toFixed(1));
}

// Bug real encontrado en producción (2026-09-30, arquitectura Luis v2): que
// `anterior` no sea CERO no basta — una base de 1-2 menciones ya produce
// cambios absurdos ("Noticias/Web +847,366.7%" fue el caso real que lo
// destapó). Mismo umbral que ya usa v_cambio_porcentual en la base de datos
// (categoría raíz 5 de Luis: "cálculos matemáticamente correctos pero
// comunicacionalmente rotos", sus bugs B8/B12). Se aplica en cada llamador
// de cambioPorcentual con la cuenta real de menciones del período anterior
// disponible — no dentro de cambioPorcentual mismo, porque algunos
// llamadores comparan alcance (dinero/reach) y necesitan la cuenta de
// menciones por separado para decidir si hay muestra suficiente.
export const VOLUMEN_MINIMO_CAMBIO = 10;

const MS_DÍA = 86_400_000;

// El pipeline de datos reales (SocialCrawl, keywords corregidas, cron) se
// terminó de activar a fondo el 2026-09-21 — las gráficas de tendencia con
// ventanas fijas (12/21 días) arrancaban varios días antes de esa fecha,
// mostrándose casi vacías al principio. `díasHastaPiso` acota la ventana
// para que nunca empiece antes de esa fecha real, sin tocar el cálculo del
// período anterior con el que se comparan (que sigue usando la misma
// cantidad de días, solo que más corta).
const FECHA_PISO_DATOS_REALES = "2026-09-21";

/**
 * `menciones`, si se pasa, acota el piso aún más al primer día real con
 * datos DE ESA selección específica — una cuenta demo nueva (ej. SEMARNAT,
 * con menciones solo desde hace unos días) seguía arrancando las gráficas en
 * la fecha global de activación del pipeline (2026-09-21), mostrando tramos
 * vacíos propios de esa cuenta aunque el piso global ya no aplicara. Se usa
 * el piso MÁS RESTRICTIVO (el más cercano a hoy) entre el global y el real
 * de la selección — nunca se amplía la ventana más allá del piso global.
 */
export function díasHastaPiso(referenciaMs?: number, menciones?: MenciónEditorial[]): number {
  const hoy = referenciaMs ?? inicioDeDía(new Date());
  let piso = inicioDeDía(new Date(`${FECHA_PISO_DATOS_REALES}T00:00:00`));
  if (menciones && menciones.length > 0) {
    const fechas = menciones
      .map((m) => inicioDeDía(new Date(m.publicadaEn)))
      .filter((t) => !Number.isNaN(t));
    if (fechas.length > 0) {
      const primeraReal = Math.min(...fechas);
      piso = Math.max(piso, primeraReal);
    }
  }
  return Math.max(1, Math.round((hoy - piso) / MS_DÍA) + 1);
}

function inicioDeDía(fecha: Date): number {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()).getTime();
}

export type SerieSemanal = {
  total: number;
  cambio: number | null; // null = "N/D", sin período anterior real que comparar
  dias: readonly [number, number, number, number, number, number, number];
};

/**
 * `total` es la suma de los 7 días que se ven en `dias` — a propósito, para
 * que el número grande del widget "Menciones totales" sea literalmente el
 * desglose de su propia gráfica (antes era el histórico completo de todas
 * las menciones del proyecto, que no tiene relación visual con un sparmark
 * de 7 barras y generaba precisamente esa duda: "¿por qué las barras no
 * suman el total?"). El histórico completo real ya se ve aparte, en la
 * ficha del proyecto y en menciones/detalle.
 */
export function calcularSerieSemanal(
  menciones: MenciónEditorial[],
  referenciaMs?: number,
): SerieSemanal {
  const hoy = referenciaMs ?? inicioDeDía(new Date());
  const inicioActual = hoy - 6 * MS_DÍA;
  const inicioAnterior = inicioActual - 7 * MS_DÍA;

  const porDía = new Map<number, number>();
  let totalAnterior = 0;

  for (const m of menciones) {
    const t = inicioDeDía(new Date(m.publicadaEn));
    if (t >= inicioActual && t <= hoy) {
      porDía.set(t, (porDía.get(t) ?? 0) + 1);
    } else if (t >= inicioAnterior && t < inicioActual) {
      totalAnterior += 1;
    }
  }

  const dias = Array.from(
    { length: 7 },
    (_, i) => porDía.get(inicioActual + i * MS_DÍA) ?? 0,
  ) as unknown as SerieSemanal["dias"];
  const totalSemana = dias.reduce((a, b) => a + b, 0);

  return {
    total: totalSemana,
    cambio: totalAnterior >= VOLUMEN_MINIMO_CAMBIO ? cambioPorcentual(totalSemana, totalAnterior) : null,
    dias,
  };
}

export type ResumenPeriodo = {
  total: number;
  cambio: number | null; // null = base anterior muy chica, ver VOLUMEN_MINIMO_CAMBIO
  // Delta real (actual - anterior), siempre calculable — se muestra cuando
  // `cambio` es null, nunca "N/D" (pedido del cliente, 2026-10-03).
  cambioAbsoluto: number;
  dias: number[];
  período: { inicio: string; fin: string };
};

const DÍAS_PERIODO_DEFECTO = 30;

/**
 * Bug real reportado por el cliente (2026-09-30): "/proyectos" mostraba
 * "Menciones totales: 6" y "/menciones" mostraba "Total de menciones: 12"
 * para el mismo proyecto — misma etiqueta, dos definiciones distintas.
 * "/proyectos" usaba calcularSerieSemanal (SIEMPRE los últimos 7 días,
 * ignorando el calendario); "/menciones" usaba su propio cálculo (sin rango
 * elegido: últimos 30 días; con rango: el período exacto — ver
 * construirResumenYTendencia en app/api/menciones/route.ts).
 *
 * Esta función es la fuente única para ambas pantallas: sin rango, últimos
 * 30 días (mismo criterio que ya usaba /menciones); con rango, el período
 * exacto elegido en el calendario. `valorDe` permite reusar la misma lógica
 * para contar menciones (valorDe = () => 1) o sumar alcance estimado
 * (valorDe = estimarAlcance) sin duplicar la ventana de fechas dos veces.
 */
function calcularResumenPeriodo(
  menciones: MenciónEditorial[],
  valorDe: (m: MenciónEditorial) => number,
  rango?: { inicio: string; fin: string } | null,
  referenciaMs?: number,
): ResumenPeriodo {
  const hoy = referenciaMs ?? inicioDeDía(new Date());
  const inicioActual = rango
    ? inicioDeDía(new Date(`${rango.inicio}T00:00:00`))
    : hoy - (DÍAS_PERIODO_DEFECTO - 1) * MS_DÍA;
  const finActual = rango ? inicioDeDía(new Date(`${rango.fin}T00:00:00`)) : hoy;
  const duraciónDías = Math.round((finActual - inicioActual) / MS_DÍA) + 1;
  const inicioAnterior = inicioActual - duraciónDías * MS_DÍA;

  const porDíaActual = new Map<number, number>();
  let totalAnterior = 0;
  let conteoAnterior = 0;

  for (const m of menciones) {
    const t = inicioDeDía(new Date(m.publicadaEn));
    if (t >= inicioActual && t <= finActual) {
      porDíaActual.set(t, (porDíaActual.get(t) ?? 0) + valorDe(m));
    } else if (t >= inicioAnterior && t < inicioActual) {
      totalAnterior += valorDe(m);
      conteoAnterior += 1;
    }
  }

  const dias = Array.from(
    { length: duraciónDías },
    (_, i) => porDíaActual.get(inicioActual + i * MS_DÍA) ?? 0,
  );
  const total = dias.reduce((a, b) => a + b, 0);

  return {
    total,
    cambio: conteoAnterior >= VOLUMEN_MINIMO_CAMBIO ? cambioPorcentual(total, totalAnterior) : null,
    cambioAbsoluto: total - totalAnterior,
    dias,
    período: {
      inicio: new Date(inicioActual).toISOString().slice(0, 10),
      fin: new Date(finActual).toISOString().slice(0, 10),
    },
  };
}

/** "Menciones totales" real — misma fuente que usa /menciones para "Total de menciones". */
export function calcularResumenMenciones(
  menciones: MenciónEditorial[],
  rango?: { inicio: string; fin: string } | null,
  referenciaMs?: number,
): ResumenPeriodo {
  return calcularResumenPeriodo(menciones, () => 1, rango, referenciaMs);
}

/** "Alcance total" real — mismo período que calcularResumenMenciones, sumando alcance estimado en vez de contar. */
export function calcularResumenAlcance(
  menciones: MenciónEditorial[],
  rango?: { inicio: string; fin: string } | null,
  referenciaMs?: number,
): ResumenPeriodo {
  return calcularResumenPeriodo(menciones, estimarAlcance, rango, referenciaMs);
}

/**
 * Filtra menciones a un rango de fechas [inicio, fin] inclusive — usado por
 * el calendario para acotar "Menciones totales" a los días seleccionados.
 */
export function filtrarMencionesPorRango(
  menciones: MenciónEditorial[],
  inicioIso: string,
  finIso: string,
): MenciónEditorial[] {
  const inicio = inicioDeDía(new Date(inicioIso));
  const fin = inicioDeDía(new Date(finIso));
  return menciones.filter((m) => {
    const t = inicioDeDía(new Date(m.publicadaEn));
    return t >= inicio && t <= fin;
  });
}

/**
 * % positivo/negativo/neutro — SOLO sobre menciones que la IA sí clasificó.
 * Las que llegan sin análisis de sentimiento (campo vacío en el backend) se
 * excluyen del denominador: contarlas como "neutral" aplastaba el % real
 * (ej. 42 de 47 sin clasificar hacía ver 4% positivo cuando, de las 5 que
 * sí tienen sentimiento real, 2 son positivas — 40%).
 */
export function calcularSentimientoPorcentual(menciones: MenciónEditorial[]): {
  positivo: number;
  negativo: number;
  neutro: number;
  favorabilidad: number;
  clasificadas: number;
  total: number;
} {
  const clasificadas = menciones.filter((m) => m.sentimientoClasificado !== false);
  if (clasificadas.length === 0) {
    return { positivo: 0, negativo: 0, neutro: 0, favorabilidad: 50, clasificadas: 0, total: menciones.length };
  }
  const positivo = clasificadas.filter((m) => m.sentimiento === "positivo").length;
  const negativo = clasificadas.filter((m) => m.sentimiento === "negativo").length;
  const neutro = clasificadas.length - positivo - negativo;
  // "Percepción positiva" (favorabilidad) es un indicador aparte del desglose
  // positivo/negativo/neutro de arriba: se calcula SOLO entre menciones con
  // postura definida (positivo+negativo), sin contar neutrales en el
  // divisor. Con neutrales en el divisor, cualquier proyecto con bastante
  // cobertura informativa (neutra, no negativa) parecía "mal" aunque tuviera
  // muchas más menciones positivas que negativas — un proyecto con 14
  // positivas y 8 negativas se veía en rojo con 30% (14 de 46 totales) en
  // vez de reflejar que, de quienes sí tomaron postura, 64% fue favorable.
  const polarizadas = positivo + negativo;
  const favorabilidad = polarizadas > 0 ? Math.round((positivo / polarizadas) * 100) : 50;
  const [pPct, nPct, uPct] = repartirPorcentajesEnteros([positivo, negativo, neutro], clasificadas.length);
  return {
    positivo: pPct,
    negativo: nPct,
    neutro: uPct,
    favorabilidad,
    clasificadas: clasificadas.length,
    total: menciones.length,
  };
}

/**
 * Desglose real de tonalidad (para la dona de /sentimiento) — mismo criterio
 * de clasificación que calcularSentimientoPorcentual. Ya no se expone
 * "sin_calificar" como categoría propia: el pipeline clasifica todo con
 * gpt-4o, así que en la práctica siempre daba 0 y solo generaba la duda de
 * "¿qué es esto?" en el cliente — se sigue calculando `clasificadas` para
 * los % reales de las 3 categorías visibles, simplemente no se muestra un
 * cuarto bloque para lo no clasificado.
 */
export function calcularDesgloseTonalidad(menciones: MenciónEditorial[]): SegmentoTonalidad[] {
  const total = menciones.length;
  const clasificadas = menciones.filter((m) => m.sentimientoClasificado !== false);
  const positivo = clasificadas.filter((m) => m.sentimiento === "positivo").length;
  const negativo = clasificadas.filter((m) => m.sentimiento === "negativo").length;
  const neutro = clasificadas.length - positivo - negativo;

  const valores: Record<string, number> = { positivo, negativo, neutral: neutro };
  return (["positivo", "negativo", "neutral"] as const).map((categoría) => ({
    categoría,
    valor: valores[categoría],
    porcentaje: total > 0 ? (valores[categoría] / total) * 100 : 0,
  }));
}

/** Tonalidad real día a día (últimos `días`) — para la línea de tendencia de /sentimiento. */
export function calcularTendenciaTonalidad(
  menciones: MenciónEditorial[],
  días = 30,
  referenciaMs?: number,
): PuntoTendenciaTonalidad[] {
  return bucketearPorDía(menciones, días, referenciaMs).map(({ fecha, menciones: delDía }) => {
    const clasificadas = delDía.filter((m) => m.sentimientoClasificado !== false);
    const positivo = clasificadas.filter((m) => m.sentimiento === "positivo").length;
    const negativo = clasificadas.filter((m) => m.sentimiento === "negativo").length;
    return {
      fecha: new Date(fecha).toISOString().slice(0, 10),
      positivo,
      negativo,
      neutro: clasificadas.length - positivo - negativo,
    };
  });
}

/**
 * Serie real actual-vs-período-anterior para una categoría de sentimiento —
 * mismo patrón que calcularTendenciaAlcance (ventana actual vs. la ventana
 * inmediata anterior, misma longitud). `actualPorcentaje`/`anteriorPorcentaje`
 * son sobre el total de menciones CLASIFICADAS de ese día (no sobre el total
 * crudo), para no aplastar el % con menciones sin analizar.
 */
export function calcularSerieSentimiento(
  menciones: MenciónEditorial[],
  categoría: "positivo" | "negativo",
  días = 30,
  referenciaMs?: number,
): PuntoSerieSentimiento[] {
  const buckets = bucketearPorDía(menciones, días, referenciaMs);
  return buckets.map(({ fecha, menciones: delDía }) => {
    const fechaAnterior = fecha - días * MS_DÍA;
    const delDíaAnterior = menciones.filter((m) => inicioDeDía(new Date(m.publicadaEn)) === fechaAnterior);

    const clasificadasActual = delDía.filter((m) => m.sentimientoClasificado !== false);
    const clasificadasAnterior = delDíaAnterior.filter((m) => m.sentimientoClasificado !== false);
    const actualMenciones = clasificadasActual.filter((m) => m.sentimiento === categoría).length;
    const anteriorMenciones = clasificadasAnterior.filter((m) => m.sentimiento === categoría).length;

    return {
      fecha: new Date(fecha).toISOString().slice(0, 10),
      actualMenciones,
      anteriorMenciones,
      actualPorcentaje: clasificadasActual.length > 0 ? (actualMenciones / clasificadasActual.length) * 100 : 0,
      anteriorPorcentaje: clasificadasAnterior.length > 0 ? (anteriorMenciones / clasificadasAnterior.length) * 100 : 0,
    };
  });
}

const ETIQUETA_CANAL: Record<TipoFuenteMención, string> = {
  x: "X (Twitter)",
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  noticias: "Noticias / Web",
  blogs: "Blogs",
};

const COLOR_CANAL: Record<TipoFuenteMención, string> = {
  x: "var(--color-sky)",
  facebook: "var(--color-navy)",
  instagram: "var(--color-accent)",
  youtube: "var(--color-warning)",
  tiktok: "var(--color-blue)",
  noticias: "var(--color-primary)",
  blogs: "var(--color-success)",
};

function formatearCorto(valor: number): string {
  return valor >= 1000 ? `${(valor / 1000).toFixed(1)}K` : String(valor);
}

/** Menciones reales por canal (dominio de URL) — solo canales con al menos 1 mención real. */
export function calcularTraficoPorFuente(
  menciones: MenciónEditorial[],
): { id: TipoFuenteMención; fuente: string; menciones: string; porcentaje: number; color: string }[] {
  if (menciones.length === 0) return [];
  const conteo = new Map<TipoFuenteMención, number>();
  for (const m of menciones) conteo.set(m.tipoFuente, (conteo.get(m.tipoFuente) ?? 0) + 1);

  return Array.from(conteo.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([canal, total]) => ({
      id: canal,
      fuente: ETIQUETA_CANAL[canal],
      menciones: formatearCorto(total),
      porcentaje: Math.round((total / menciones.length) * 100),
      color: COLOR_CANAL[canal],
    }));
}

/** Sentimiento real desglosado por canal — mismo criterio que Menciones, sin inventar canales sin datos. */
export function calcularTonalidadPorFuente(
  menciones: MenciónEditorial[],
): { fuente: string; positivo: number; negativo: number; neutro: number; sinCalificar: number }[] {
  const porCanal = new Map<TipoFuenteMención, MenciónEditorial[]>();
  for (const m of menciones) {
    const lista = porCanal.get(m.tipoFuente) ?? [];
    lista.push(m);
    porCanal.set(m.tipoFuente, lista);
  }

  return Array.from(porCanal.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .map(([canal, lista]) => ({
      fuente: ETIQUETA_CANAL[canal],
      positivo: lista.filter((m) => m.sentimiento === "positivo").length,
      negativo: lista.filter((m) => m.sentimiento === "negativo").length,
      neutro: lista.filter((m) => m.sentimiento === "neutral").length,
      sinCalificar: 0,
    }));
}

/** Desglose real por canal con cambio % vs. período anterior — para el panel de Menciones. */
export function calcularFuentesConCambio(
  actuales: MenciónEditorial[],
  anteriores: MenciónEditorial[],
  totalGeneral: number,
): { id: TipoFuenteMención; nombre: string; total: number; cambio: number | null; cambioAbsoluto: number; porcentaje: number; color: string }[] {
  const conteoActual = new Map<TipoFuenteMención, number>();
  for (const m of actuales) conteoActual.set(m.tipoFuente, (conteoActual.get(m.tipoFuente) ?? 0) + 1);
  const conteoAnterior = new Map<TipoFuenteMención, number>();
  for (const m of anteriores) conteoAnterior.set(m.tipoFuente, (conteoAnterior.get(m.tipoFuente) ?? 0) + 1);

  return Array.from(conteoActual.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([canal, total]) => {
      const anterior = conteoAnterior.get(canal) ?? 0;
      return {
        id: canal,
        nombre: ETIQUETA_CANAL[canal],
        total,
        cambio: anterior >= VOLUMEN_MINIMO_CAMBIO ? cambioPorcentual(total, anterior) : null,
        cambioAbsoluto: total - anterior,
        porcentaje: totalGeneral > 0 ? Math.round((total / totalGeneral) * 100) : 0,
        color: COLOR_CANAL[canal],
      };
    });
}

// ─── Series diarias de alcance estimado (para tendencia-alcance / combo) ────

// `referenciaMs` es el día que cuenta como "hoy" para la ventana de N días —
// por default el hoy real (todos los llamadores existentes siguen igual);
// cuando el panel de /proyectos tiene un rango de calendario activo, se le
// pasa el fin de ese rango para que la ventana de N días termine ahí en vez
// de en el día real, así el widget no se queda vacío al elegir un período
// que no toca los últimos días.
function bucketearPorDía(
  menciones: MenciónEditorial[],
  días: number,
  referenciaMs?: number,
): { fecha: number; menciones: MenciónEditorial[] }[] {
  const hoy = referenciaMs ?? inicioDeDía(new Date());
  const buckets: { fecha: number; menciones: MenciónEditorial[] }[] = [];
  for (let i = días - 1; i >= 0; i--) {
    const fecha = hoy - i * MS_DÍA;
    buckets.push({
      fecha,
      menciones: menciones.filter((m) => inicioDeDía(new Date(m.publicadaEn)) === fecha),
    });
  }
  return buckets;
}

/**
 * `total` es la suma de los 7 días que se ven en `dias` (mismo criterio que
 * calcularSerieSemanal, ver su comentario) — no el alcance histórico de
 * todas las menciones, que no tiene relación visual con una gráfica de 7
 * barras. Para el widget "Alcance total".
 */
export function calcularAlcanceEstimadoSemanal(
  menciones: MenciónEditorial[],
  referenciaMs?: number,
): SerieSemanal {
  const buckets = bucketearPorDía(menciones, 7, referenciaMs);
  const dias = buckets.map((b) =>
    b.menciones.reduce((s, m) => s + estimarAlcance(m), 0),
  ) as unknown as SerieSemanal["dias"];

  const hoy = referenciaMs ?? inicioDeDía(new Date());
  const inicioAnterior = hoy - 13 * MS_DÍA;
  const finAnterior = hoy - 7 * MS_DÍA;
  const mencionesAnteriores = menciones.filter((m) => {
    const t = inicioDeDía(new Date(m.publicadaEn));
    return t >= inicioAnterior && t < finAnterior;
  });
  const alcanceAnterior = mencionesAnteriores.reduce((s, m) => s + estimarAlcance(m), 0);
  const alcanceActual = dias.reduce((a, b) => a + b, 0);

  return {
    total: alcanceActual,
    cambio: mencionesAnteriores.length >= VOLUMEN_MINIMO_CAMBIO
      ? cambioPorcentual(alcanceActual, alcanceAnterior)
      : null,
    dias,
  };
}

/** Puntos actual-vs-período-anterior (`días` días reales vs. los mismos `días` previos). */
export function calcularTendenciaAlcance(
  menciones: MenciónEditorial[],
  referenciaMs?: number,
  días = 12,
): { fecha: number; actual: number; anterior: number }[] {
  const actuales = bucketearPorDía(menciones, días, referenciaMs);
  return actuales.map(({ fecha, menciones: delDía }) => {
    const fechaAnterior = fecha - días * MS_DÍA;
    const delDíaAnterior = menciones.filter(
      (m) => inicioDeDía(new Date(m.publicadaEn)) === fechaAnterior,
    );
    return {
      fecha,
      actual: delDía.reduce((s, m) => s + estimarAlcance(m), 0),
      anterior: delDíaAnterior.reduce((s, m) => s + estimarAlcance(m), 0),
    };
  });
}

/** Menciones + alcance estimado por día — para el combo de tendencia. */
export function calcularTendenciaMencionesAlcance(
  menciones: MenciónEditorial[],
  referenciaMs?: number,
  días = 21,
): { menciones: number; alcance: number }[] {
  return bucketearPorDía(menciones, días, referenciaMs).map(({ menciones: delDía }) => ({
    menciones: delDía.length,
    alcance: delDía.reduce((s, m) => s + estimarAlcance(m), 0),
  }));
}

/** Alcance potencial estimado por canal — para "Alcance por tipo de fuente". */
/**
 * `anteriores` es el mismo rango de días, inmediatamente antes de `actuales`
 * — así `cambioPorcentaje` compara de verdad en vez de quedar fijo en 0
 * (como estaba antes: nunca se calculaba). Si no se pasa `anteriores`
 * (llamadas viejas), el cambio queda en 0 tal como antes, no se rompe nada.
 */
export function calcularAlcancePorFuente(
  actuales: MenciónEditorial[],
  anteriores: MenciónEditorial[] = [],
): {
  posicion: number;
  fuente: string;
  alcance: number;
  cambioPorcentaje: number | null;
  porcentajeTotal: number;
}[] {
  const porCanal = new Map<TipoFuenteMención, number>();
  for (const m of actuales) {
    porCanal.set(m.tipoFuente, (porCanal.get(m.tipoFuente) ?? 0) + estimarAlcance(m));
  }
  const porCanalAnterior = new Map<TipoFuenteMención, number>();
  const conteoAnteriorPorCanal = new Map<TipoFuenteMención, number>();
  for (const m of anteriores) {
    porCanalAnterior.set(m.tipoFuente, (porCanalAnterior.get(m.tipoFuente) ?? 0) + estimarAlcance(m));
    conteoAnteriorPorCanal.set(m.tipoFuente, (conteoAnteriorPorCanal.get(m.tipoFuente) ?? 0) + 1);
  }
  const total = Array.from(porCanal.values()).reduce((a, b) => a + b, 0) || 1;
  return Array.from(porCanal.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([canal, alcance], i) => {
      const conteoAnterior = conteoAnteriorPorCanal.get(canal) ?? 0;
      return {
        posicion: i + 1,
        fuente: ETIQUETA_CANAL[canal],
        alcance,
        cambioPorcentaje: conteoAnterior >= VOLUMEN_MINIMO_CAMBIO
          ? cambioPorcentual(alcance, porCanalAnterior.get(canal) ?? 0)
          : null,
        porcentajeTotal: Math.round((alcance / total) * 1000) / 10,
      };
    });
}

// Movida a regiones-presencia.ts (función pura, sin imports de servidor) para
// que componentes cliente la puedan importar directo sin arrastrar este
// módulo completo al bundle del navegador — se reexporta aquí para que los
// callers existentes (panel/route.ts, infografia-backend.ts) no cambien.
export { calcularRegionesPresencia } from "./regiones-presencia";

const MÍNIMO_MENCIONES_TEMA = 2;
const MÍNIMO_FUENTES_TEMA = 2;

/**
 * Temas emergentes — ranking real por título de mención en los últimos 7
 * días vs los 7 anteriores (mismo criterio que el resto del producto: sin
 * integración a trending topics de X, se usa lo que sí se tiene). Solo
 * entran temas con al menos MÍNIMO_MENCIONES_TEMA menciones de al menos
 * MÍNIMO_FUENTES_TEMA fuentes distintas.
 */
// Mismo texto de un titular aparece con variantes: emojis, #hashtags, negritas
// Unicode ("𝗔𝗟𝗜𝗦𝗧𝗔") y mayúsculas. Se agrupa por una clave limpia, y el
// nombre que se muestra sale de esa misma limpieza.
function limpiarTitulo(titulo: string): string {
  return letrasEnvueltasAAscii(titulo)
    .normalize("NFKC")
    .replace(/[\u{1F000}-\u{1FFFF}☀-➿️]/gu, " ")
    .replace(/[#@]\w+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Las menciones que forman un tema salen de este mismo cálculo, así que al dar
// clic en el tema siempre hay algo que mostrar (no se vuelve a buscar por texto).
// Un enlace por medio distinto primero, y como máximo 6 por tema.
function unaPorMedioPrimero(menciones: MenciónEditorial[]): MenciónEditorial[] {
  const ordenadas = [...menciones].sort(
    (a, b) => new Date(b.publicadaEn).getTime() - new Date(a.publicadaEn).getTime(),
  );
  const vistos = new Set<string>();
  const primeras: MenciónEditorial[] = [];
  const resto: MenciónEditorial[] = [];
  for (const m of ordenadas) {
    if (vistos.has(m.fuente)) resto.push(m);
    else {
      vistos.add(m.fuente);
      primeras.push(m);
    }
  }
  return [...primeras, ...resto].slice(0, 6);
}

export function calcularTendenciasEmergentes(
  menciones: MenciónEditorial[],
  referenciaMs?: number,
): { posicion: number; nombre: string; cambio: number; url: string | null; menciones: MenciónEditorial[] }[] {
  const hoy = referenciaMs ?? Date.now();
  const semana = 7 * MS_DÍA;
  const claveDe = (titulo: string) =>
    limpiarTitulo(titulo).replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim().toLowerCase();
  const mencionesPorClave = new Map<string, MenciónEditorial[]>();
  const nombrePorClave = new Map<string, string>();
  const actual = new Map<string, number>();
  const previo = new Map<string, number>();
  // Una URL real representativa por tema — la más reciente con URL entre las
  // menciones que lo comparten — para poder "ver el tema" desde el widget.
  const urlPorClave = new Map<string, { url: string; publicadaEn: number }>();
  // Un tema no es "principal" con una sola mención o una sola fuente (caso
  // real 2026-10-03: "#AHORA..." con 3 notas, 2 de la misma cuenta).
  const fuentesPorClave = new Map<string, Set<string>>();

  for (const m of menciones) {
    if (!m.título || m.título === "(Sin título)") continue;
    // Sin esto, un tema podía rankear #1 solo con menciones de fecha sin
    // verificar (ej. un post real pero de hace más de un año, indexado por
    // un buscador que nunca dio fecha) — mismo criterio ya aplicado al clic
    // en mencionesConPalabra (2026-10-02): si no se puede confirmar que es
    // de esta semana, no cuenta como "tema de esta semana".
    if (m.fechaEstimada) continue;
    const clave = claveDe(m.título);
    if (!clave) continue;
    const t = new Date(m.publicadaEn).getTime();
    if (t >= hoy - semana) {
      if (!nombrePorClave.has(clave)) nombrePorClave.set(clave, limpiarTitulo(m.título));
      actual.set(clave, (actual.get(clave) ?? 0) + 1);
      mencionesPorClave.set(clave, [...(mencionesPorClave.get(clave) ?? []), m]);
      const fuentes = fuentesPorClave.get(clave) ?? new Set<string>();
      fuentes.add(m.fuente);
      fuentesPorClave.set(clave, fuentes);
      if (m.url) {
        const actualUrl = urlPorClave.get(clave);
        if (!actualUrl || t > actualUrl.publicadaEn) {
          urlPorClave.set(clave, { url: m.url, publicadaEn: t });
        }
      }
    } else if (t >= hoy - 2 * semana) {
      previo.set(clave, (previo.get(clave) ?? 0) + 1);
    }
  }

  const ranking = Array.from(actual.entries())
    .filter(([clave, cantidad]) =>
      cantidad >= MÍNIMO_MENCIONES_TEMA && (fuentesPorClave.get(clave)?.size ?? 0) >= MÍNIMO_FUENTES_TEMA)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const rankingPrevio = Array.from(previo.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([clave]) => clave);

  return ranking.map(([clave], i) => {
    const posPrevia = rankingPrevio.indexOf(clave);
    return {
      posicion: i + 1,
      nombre: nombrePorClave.get(clave) ?? clave,
      cambio: posPrevia === -1 ? 0 : posPrevia - i,
      url: urlPorClave.get(clave)?.url ?? null,
      menciones: unaPorMedioPrimero(mencionesPorClave.get(clave) ?? []),
    };
  });
}

const PALABRAS_VACÍAS = new Set([
  "para", "por", "con", "las", "los", "una", "uno", "del", "que", "sus",
  "esta", "este", "esto", "más", "sobre", "como", "entre", "hacia", "desde",
  "the", "and", "for", "with", "from", "this", "that",
]);

const EXTRACTO_RELLENO = "sin extracto disponible.";

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Google News deja el título real tal cual "Titular - Medio" (el backend
// solo separa el nombre del medio para guardarlo aparte en `fuente`, nunca
// limpia el título guardado) — sin esto, el nombre del medio se cuenta como
// si fuera un tema real. Caso real (2026-10-02, mismo copy que
// lib/palabras-clave-cliente.ts): "jornada" con 57% de sus apariciones
// viniendo solo del sufijo "- La Jornada" al final del título. Solo quita el
// sufijo EXACTO al final, no cualquier aparición del nombre en el cuerpo.
function tituloSinSufijoFuente(m: MenciónEditorial): string {
  const fuente = (m.fuente || "").trim();
  if (!fuente) return m.título;
  const sufijo = new RegExp(`\\s*-\\s*${escaparRegex(fuente)}\\s*$`, "i");
  return m.título.replace(sufijo, "");
}

/** Palabras clave reales por frecuencia en título+extracto de menciones (sin catálogo curado). */
export function calcularPalabrasClaveReales(
  menciones: MenciónEditorial[],
): { palabra: string; efectividad: "Positivo" | "Neutro" | "Negativo" }[] {
  const conteo = new Map<string, { total: number; pos: number; neg: number }>();
  for (const m of menciones) {
    const extracto = m.extracto.toLowerCase().trim() === EXTRACTO_RELLENO ? "" : m.extracto;
    let texto = `${tituloSinSufijoFuente(m)} ${extracto}`.toLowerCase();
    // Fuera URLs completas y @menciones/#hashtags — de lo contrario dejan
    // residuos como "https" o "marucampos" (de un @MaruCampos sin el @).
    texto = texto.replace(/https?:\/\/\S+/gi, " ").replace(/[@#]\w+/g, " ");
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
    .slice(0, 8)
    .map(([palabra, v]) => ({
      palabra,
      efectividad:
        v.pos > v.neg && v.pos > v.total - v.pos - v.neg
          ? ("Positivo" as const)
          : v.neg > v.pos && v.neg > v.total - v.pos - v.neg
            ? ("Negativo" as const)
            : ("Neutro" as const),
    }));
}

function idVideoYoutube(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1) || null;
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
  } catch {
    return null;
  }
  return null;
}

/** Menciones de YouTube reales con miniatura real (img.youtube.com) — nada inventado. */
// Imágenes/videos reales — cualquier mención con imagenUrl real (YouTube +
// Instagram/TikTok vía SocialCrawl).
//
// Antes se ordenaba TODO por interacciones reales (views+likes) y se
// cortaba a 18. Bug real encontrado en producción (proyectos 40/41, sep-2026,
// cliente reportó "muy pocos videos e imágenes"): solo Instagram/TikTok vía
// SocialCrawl traen ese número; YouTube nunca lo tiene (queda null → -1 al
// ordenar). En cuanto un proyecto acumulaba más de 18 posts reales de
// Instagram/TikTok con interacciones, esos ganaban los 18 lugares completos
// y YouTube desaparecía del todo del widget — confirmado: 287-292 videos
// reales de YouTube en esos proyectos, ninguno visible, aunque Instagram/
// TikTok combinados ya alcanzaban 64-142 posts reales por sí solos. Además,
// el "total" que mostraba el widget era el tamaño del propio arreglo ya
// cortado (siempre "18 de 18", 100% aunque el total real fuera de cientos).
//
// Ahora: se reparte por turnos entre canales (más reciente primero dentro de
// cada uno) para que cada fuente real tenga representación, se sube el tope
// de 18 a 30, y se devuelve el total real de menciones elegibles (antes de
// cortar) para que el widget pueda mostrar "30 de 351" en vez de "18 de 18".
const LÍMITE_MEDIA_REAL = 30;

export function calcularVideoReal(
  menciones: MenciónEditorial[],
): {
  items: { id: string; imagenUrl: string; fuente: string; referencia: string; url: string; interacciones: number | null }[];
  total: number;
} {
  const elegibles = menciones.filter(
    (m): m is MenciónEditorial & { imagenUrl: string } => !!m.imagenUrl,
  );

  const porCanal = new Map<string, typeof elegibles>();
  for (const m of elegibles) {
    const lista = porCanal.get(m.tipoFuente) ?? [];
    lista.push(m);
    porCanal.set(m.tipoFuente, lista);
  }
  for (const lista of porCanal.values()) {
    lista.sort((a, b) => new Date(b.publicadaEn).getTime() - new Date(a.publicadaEn).getTime());
  }
  const canales = [...porCanal.values()];

  const repartidos: typeof elegibles = [];
  for (let fila = 0; repartidos.length < LÍMITE_MEDIA_REAL && canales.some((c) => c[fila]); fila++) {
    for (const lista of canales) {
      if (repartidos.length >= LÍMITE_MEDIA_REAL) break;
      if (lista[fila]) repartidos.push(lista[fila]);
    }
  }

  return {
    items: repartidos.map((m) => ({
      id: m.id,
      imagenUrl: m.imagenUrl,
      fuente: m.tipoFuente === "youtube" ? "YouTube" : m.tipoFuente === "instagram" ? "Instagram" : m.tipoFuente === "tiktok" ? "TikTok" : m.fuente,
      referencia: m.título,
      url: m.url,
      interacciones: m.interacciones ?? null,
    })),
    total: elegibles.length,
  };
}

/**
 * Alerta de crisis por proyecto — heurística real sobre alertas abiertas +
 * tendencia de menciones negativas (no un valor fijo/hash como antes). Mismo
 * criterio ya usado en el sitio estático: primero fake news (más grave),
 * luego tendencia al alza de negativas, luego proporción negativa alta.
 */
export function calcularAlertaCrisis(
  menciones: MenciónEditorial[],
  descripcionesAlertas: string[],
): "ninguna" | "aumento_menciones_negativas" | "crecimiento_fake_news" | "menciones_negativas" {
  const now = Date.now();
  const semana = 7 * MS_DÍA;
  const esNegativa = (m: MenciónEditorial) => m.sentimiento === "negativo";
  const fechaMs = (m: MenciónEditorial) => new Date(m.publicadaEn).getTime();

  const negUltimos7 = menciones.filter((m) => esNegativa(m) && fechaMs(m) >= now - semana).length;
  const negPrevios7 = menciones.filter(
    (m) => esNegativa(m) && fechaMs(m) >= now - 2 * semana && fechaMs(m) < now - semana,
  ).length;
  const clasificadas = menciones.filter((m) => m.sentimientoClasificado !== false);
  const totalNeg = clasificadas.filter(esNegativa).length;
  const hayFakeNews = descripcionesAlertas.some((d) => /desinformaci|fake|bulo|noticia falsa/i.test(d));

  if (hayFakeNews) return "crecimiento_fake_news";
  // "aumento_menciones_negativas" DESACTIVADA temporalmente (2026-09-02,
  // decisión explícita del usuario para la demo de hoy — ver conversación).
  // El arreglo de negPrevios7 > 0 evita el caso "0 antes → infinito ahora",
  // pero no arregla el problema de fondo: el pipeline real recién empezó a
  // encontrar cobertura completa ESTA semana (arreglos del 2026-09-02), así
  // que "semana pasada" está artificialmente vacía en TODOS los proyectos —
  // no porque el personaje monitoreado haya mejorado, sino porque la
  // herramienta apenas hoy se puso a la altura. Cualquier comparación
  // semana-contra-semana hecha ahora mismo es injusta. Reactivar cuando haya
  // pasado suficiente tiempo de operación normal (sin ráfagas de backfill)
  // para que ambas semanas comparadas reflejen la misma capacidad real de
  // búsqueda — un par de semanas de uso normal debería bastar. El criterio
  // de abajo (mitad o más de las menciones clasificadas son negativas) no
  // tiene este problema porque no depende de cuándo se ingirió el dato.
  // if (negUltimos7 >= 3 && negPrevios7 > 0 && negUltimos7 > negPrevios7) return "aumento_menciones_negativas";
  void negUltimos7;
  void negPrevios7;
  if (clasificadas.length >= 3 && totalNeg / clasificadas.length >= 0.5) return "menciones_negativas";
  return "ninguna";
}

/** Menciones agrupadas por proyecto — base para burbujas de rendimiento y Resumen IA real. */
export function agruparMencionesPorProyecto(
  menciones: MenciónEditorial[],
): Map<string, MenciónEditorial[]> {
  const mapa = new Map<string, MenciónEditorial[]>();
  for (const m of menciones) {
    const lista = mapa.get(m.proyectoId) ?? [];
    lista.push(m);
    mapa.set(m.proyectoId, lista);
  }
  return mapa;
}

export { BackendError };
