// Búsqueda en vivo real (Monitoreo → Búsqueda) — llama a sentiment-api, que a
// su vez consulta las mismas 7 fuentes reales que ya usa el pipeline de
// análisis de proyectos. Nada de outlets/alcance/fechas inventados.
import { backendPost } from "@/lib/backend";
import { normalizarTipoFuente } from "@/lib/menciones-backend";
import type { MenciónEditorial } from "@/types";

export type ItemBusquedaBackend = {
  title?: string;
  content?: string;
  source_name?: string;
  url?: string;
  published_at?: string;
  date?: string;
};

function mapearItemBusqueda(item: ItemBusquedaBackend, índice: number, consulta: string): MenciónEditorial {
  return {
    id: `busqueda-${índice}-${item.url ?? índice}`,
    proyectoId: "",
    título: item.title?.trim() || consulta,
    extracto: item.content?.trim() || "Sin extracto disponible.",
    fuente: item.source_name?.trim() || "Fuente desconocida",
    autor: item.source_name?.trim() || "",
    url: item.url || "",
    publicadaEn: item.published_at || item.date || new Date().toISOString(),
    // Búsqueda exploratoria — no pasa por el clasificador de sentimiento
    // (eso es costo real de IA por mención, aquí puede haber decenas de
    // resultados por búsqueda). "neutral" + sentimientoClasificado:false es
    // el mismo patrón honesto que usa el resto de la app para "aún sin
    // analizar", nunca se inventa un sentimiento.
    sentimiento: "neutral",
    tipoFuente: normalizarTipoFuente(item.url ?? null, null),
    alcance: 0,
    compartidos: 0,
    sentimientoClasificado: false,
  };
}

// Caché en memoria del propio proceso (un solo proceso PM2, sin cluster —
// mismo supuesto que ya usa el OTP de Perfil) de los items CRUDOS de la
// última búsqueda por consulta normalizada. Evita volver a golpear las 7
// fuentes externas en cada página de scroll infinito, y le da al endpoint de
// "analizar" los mismos items reales que el usuario ya vio, sin que el
// cliente tenga que reenviarlos.
type EntradaCache = { items: ItemBusquedaBackend[]; expira: number };
const cacheBusqueda = new Map<string, EntradaCache>();
const TTL_CACHE_MS = 10 * 60 * 1000;

function claveCache(consulta: string): string {
  return consulta.trim().toLowerCase();
}

async function buscarCrudoConCache(consulta: string): Promise<ItemBusquedaBackend[]> {
  const clave = claveCache(consulta);
  const previo = cacheBusqueda.get(clave);
  if (previo && previo.expira > Date.now()) return previo.items;

  const respuesta = await backendPost<{ query: string; items: ItemBusquedaBackend[]; total: number }>(
    "/api/search-live",
    { query: consulta },
  );
  if (!respuesta.data) throw new Error(respuesta.message ?? "No se pudo completar la búsqueda.");
  cacheBusqueda.set(clave, { items: respuesta.data.items, expira: Date.now() + TTL_CACHE_MS });
  return respuesta.data.items;
}

export type RespuestaBusquedaReal = {
  resultados: MenciónEditorial[];
  total: number;
  hayMás: boolean;
  totalFuentes: number;
};

export async function buscarEnVivo(consulta: string, página: number, tamaño: number): Promise<RespuestaBusquedaReal> {
  const items = await buscarCrudoConCache(consulta);
  const inicio = (página - 1) * tamaño;
  const página_items = items.slice(inicio, inicio + tamaño);
  const fuentes = new Set(items.map((i) => i.source_name).filter(Boolean));
  return {
    resultados: página_items.map((item, i) => mapearItemBusqueda(item, inicio + i, consulta)),
    total: items.length,
    hayMás: inicio + tamaño < items.length,
    totalFuentes: fuentes.size,
  };
}

type AnalisisBusquedaReal = {
  executive_summary?: string;
  narratives?: { name?: string; mentions?: string; sentiment?: string; risk?: string; trend?: string }[];
  recommendations?: string[];
  hashtags?: string[];
  risk_level?: string;
  sentiment?: { positive?: number; negative?: number; neutral?: number };
};

/** Análisis real de IA (gpt-4o) sobre los mismos resultados reales que ya se buscaron — usa el caché, no vuelve a buscar. */
export async function analizarBusquedaReal(consulta: string, userId?: string): Promise<AnalisisBusquedaReal> {
  const items = await buscarCrudoConCache(consulta);
  if (!items.length) throw new Error("No hay resultados reales que analizar todavía — busca primero.");
  const respuesta = await backendPost<AnalisisBusquedaReal>("/api/search-live/analizar", {
    query: consulta,
    items,
    user_id: userId,
  });
  if (!respuesta.data) throw new Error(respuesta.message ?? "No se pudo analizar la conversación.");
  return respuesta.data;
}
