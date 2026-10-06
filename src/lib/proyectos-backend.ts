// Lectura/escritura de proyectos reales contra sentiment-api. Las funciones
// de lectura (`obtenerProyectosReales`, `obtenerProyectoRealPorId`) se llaman
// directo desde Server Components — es el patrón recomendado en Next.js para
// evitar que el propio servidor se autoconsulte con una URL relativa, que no
// resuelve en SSR. Las de escritura las usan los Route Handlers bajo /api/proyectos.
import {
  BackendError,
  backendDelete,
  backendGet,
  backendGetRaw,
  backendPost,
  backendPut,
} from "@/lib/backend";
import { NOMBRE_ESTADO_MX } from "@/lib/estados-mexico";
import { gradienteDesdeNombre, inicialesDesdeNombre } from "@/lib/mock/proyectos";
import { obtenerSesión, paramsSesión } from "@/lib/session";
import type {
  PalabraClaveProyecto,
  Proyecto,
  RedSocialProyecto,
  ResumenProyectos,
  SolicitudActualizarProyecto,
  SolicitudCrearProyecto,
  TipoProyecto,
} from "@/types";

export type ProyectoBackend = {
  id: number;
  name: string;
  description: string | null;
  main_topic: string | null;
  region: string | null;
  language: string | null;
  status: string | null;
  image_url: string | null;
  project_type: string | null;
  country_code: string | null;
  updated_at: string | null;
  /** Solo viene en /api/projects (getProjectsForUser) — el resto de rutas
   * (getProjectById) no lo trae, por eso mapearProyectoBackend no puede
   * asumir que siempre existe. */
  connected_sources?: string[];
  /** Real, igual que connected_sources — solo en /api/projects. */
  analysis_count?: number | string;
  /** Real, igual que connected_sources — solo en /api/projects. */
  real_keywords?: string[];
};

// Mismos 8 países que ofrece el formulario real (ver PAISES en
// formulario-nuevo-proyecto.tsx) — se usan para mostrar un nombre real en vez
// del código ISO crudo ("ES") como región.
const NOMBRES_PAIS: Record<string, string> = {
  MX: "México",
  US: "Estados Unidos",
  ES: "España",
  AR: "Argentina",
  CO: "Colombia",
  CL: "Chile",
  PE: "Perú",
  BR: "Brasil",
};

const TIPOS_VALIDOS = new Set<string>([
  "influencer",
  "agencia",
  "politico",
  "marca",
  "figura_publica",
  "otro",
]);

export function mapearProyectoBackend(
  p: ProyectoBackend,
  incluirImagen = true,
): Proyecto {
  const gradiente = gradienteDesdeNombre(p.name);
  const tipo: TipoProyecto = TIPOS_VALIDOS.has(p.project_type ?? "")
    ? (p.project_type as TipoProyecto)
    : "otro";

  return {
    id: String(p.id),
    numero: p.id,
    nombre: p.name,
    iniciales: inicialesDesdeNombre(p.name),
    ubicacion: p.region || "México",
    idioma: p.language === "es" ? "Español" : p.language || "Español",
    palabraClave: p.main_topic || "",
    descripcion: p.description || "",
    // Antes fijo en 0 con el comentario "el backend no lo expone" — sí lo
    // expone (analysis_count, calculado en la misma consulta de
    // getProjectsForUser), este mapeo simplemente nunca lo leía. Bug real
    // reportado 2026-10-02: el Resumen IA decía "0 análisis, ingesta
    // inicial, no corre análisis completo" para un proyecto con 165
    // análisis reales — mismo patrón ya arreglado antes para redesConectadas.
    analisis: Number(p.analysis_count ?? 0),
    ultimoAnalisis: (p.updated_at ?? new Date().toISOString()).slice(0, 10),
    gradienteInicio: gradiente.inicio,
    gradienteFin: gradiente.fin,
    tipo,
    estado: (p.status ?? "active").toLowerCase().includes("activ") ? "activo" : "inactivo",
    // La imagen se guarda como data URL base64 completa — en un proyecto real
    // llega a pesar >2MB de texto. Incluirla en cada tarjeta de una lista
    // multiplica ese peso por proyecto y en /proyectos (force-dynamic, se
    // recalcula en cada navegación) esto agregaba 3-7s a cada cambio de
    // proyecto en el selector. Las listas no la piden; el detalle sí.
    imagenUrl: incluirImagen ? (p.image_url ?? null) : null,
    // Igual que redesConectadas/analisis arriba: real_keywords ya viene real
    // en /api/projects (SUBQUERY_PALABRAS_CLAVE) — antes esto solo envolvía
    // main_topic en un arreglo de 1, ignorando las palabras clave reales
    // configuradas (nombre/red_social/búsqueda).
    palabrasClave: p.real_keywords?.length ? p.real_keywords : p.main_topic ? [p.main_topic] : [],
    paises: [p.country_code || "MX"],
    estadosMexico: [],
    idiomas: [p.language || "es"],
    // Antes fijo en `[]` — /api/projects nunca traía esto, así que el
    // Resumen IA del Dashboard siempre decía "sin redes conectadas" aunque
    // el proyecto sí tuviera redes reales activas (bug real reportado por
    // el cliente, 2026-10-01). Ahora getProjectsForUser en el backend
    // agrega connected_sources en la misma consulta (ver SUBQUERY_REDES_
    // CONECTADAS en db.js) — rutas que no lo traen (getProjectById) caen al
    // `[]` de siempre, mismo comportamiento que antes para ellas.
    redesConectadas: (p.connected_sources ?? []) as Proyecto["redesConectadas"],
    fuentesNoticias: [],
  };
}

export async function obtenerProyectosReales(incluirImagen = false): Promise<{
  proyectos: Proyecto[];
  resumen: ResumenProyectos;
}> {
  const sesión = await obtenerSesión();
  const query = paramsSesión(sesión);
  const body = await backendGetRaw<{
    ok: boolean;
    data: ProyectoBackend[];
    max_projects: number;
  }>(`/api/projects${query ? `?${query}` : ""}`);

  const proyectos = (body.data ?? []).map((p) => mapearProyectoBackend(p, incluirImagen));
  const resumen: ResumenProyectos = {
    activos: proyectos.filter((p) => p.estado === "activo").length,
    // Real ahora que mapearProyectoBackend lee analysis_count de verdad
    // (ver ahí) en vez del 0 fijo de antes.
    analisisRealizados: proyectos.reduce((acc, p) => acc + p.analisis, 0),
    // alertasActivas sigue sin dato real aquí (necesitaría otra llamada al
    // backend) — fuera de alcance del bug de análisis/palabras clave.
    alertasActivas: 0,
    usados: proyectos.length,
    limite: body.max_projects ?? proyectos.length,
  };

  return { proyectos, resumen };
}

type PalabraClaveBackend = { id: number; keyword: string; type: string };
type FuenteBackend = { id: number; source_type: string; is_active: boolean };
type FeedBackend = { id: number; url: string; name: string | null };

const TIPOS_PALABRA_CLAVE_VÁLIDOS = new Set<PalabraClaveProyecto["tipo"]>([
  "nombre",
  "red_social",
  "busqueda",
]);
// Palabras clave guardadas antes de las 3 categorías reales (type="main" a
// secas) se tratan como "nombre" al precargar edición — es el fallback más
// seguro (nunca se descartan silenciosamente, y "nombre" es la categoría sin
// riesgo de colisión que se prioriza en las búsquedas reales).
function tipoPalabraClaveReal(tipo: string): PalabraClaveProyecto["tipo"] {
  return TIPOS_PALABRA_CLAVE_VÁLIDOS.has(tipo as PalabraClaveProyecto["tipo"])
    ? (tipo as PalabraClaveProyecto["tipo"])
    : "nombre";
}

// Redes que el formulario puede seleccionar vs. las que el pipeline de
// análisis realmente sabe buscar hoy (solo X tiene fetcher propio,
// fetchTwitterForTopic — no hay integración a Facebook/Instagram/TikTok).
export const REDES_CON_MONITOREO_REAL: RedSocialProyecto[] = ["x"];

/** Trae un proyecto con su detalle completo (palabras clave, fuentes, redes) — para precargar el formulario de edición. */
export async function obtenerProyectoRealCompleto(id: string): Promise<Proyecto | null> {
  try {
    const [proyecto, keywords, sources, feeds, settings] = await Promise.all([
      backendGet<ProyectoBackend>(`/api/projects/${id}`),
      backendGet<PalabraClaveBackend[]>(`/api/projects/${id}/keywords`).catch(() => []),
      backendGet<FuenteBackend[]>(`/api/projects/${id}/sources`).catch(() => []),
      backendGetRaw<{ data: FeedBackend[] }>(`/api/projects/${id}/feeds`)
        .then((r) => r.data)
        .catch(() => []),
      // estados_mx vive en monitoring_settings, no en projects — sin esto el
      // formulario de edición siempre abría el paso de estados vacío aunque
      // sí se hubieran guardado (ver guardarEstadosMexico).
      backendGet<{ estados_mx?: string[] } | null>(`/api/projects/${id}/settings`).catch(
        () => null,
      ),
    ]);

    const base = mapearProyectoBackend(proyecto);
    const palabrasClave = keywords.map((k) => k.keyword);
    const palabrasClaveTipadas: PalabraClaveProyecto[] = keywords.map((k) => ({
      palabra: k.keyword,
      tipo: tipoPalabraClaveReal(k.type),
    }));
    return {
      ...base,
      palabraClave: palabrasClave[0] ?? base.palabraClave,
      palabrasClave: palabrasClave.length ? palabrasClave : base.palabrasClave,
      palabrasClaveTipadas,
      estadosMexico: settings?.estados_mx ?? [],
      redesConectadas: sources
        .filter((s) => s.is_active)
        .map((s) => s.source_type) as Proyecto["redesConectadas"],
      fuentesNoticias: feeds.map((f) => ({ id: String(f.id), url: f.url, nombre: f.name ?? "" })),
    };
  } catch {
    return null;
  }
}

export async function obtenerProyectoRealPorId(id: string): Promise<Proyecto | null> {
  try {
    const data = await backendGet<ProyectoBackend>(`/api/projects/${id}`);
    return mapearProyectoBackend(data);
  } catch {
    return null;
  }
}

// El esquema real solo guarda una región de texto libre (no arreglos de
// países/estados) en `projects.region`. Antes esto se colapsaba siempre a
// "Nacional" para México — ahora que el formulario sí captura estados reales
// (ver guardarEstadosMexico), se usan sus nombres para que "región" diga algo
// real ("Oaxaca", "Oaxaca, Puebla") en vez de un valor fijo sin información.
// Si no hay estados (otro país, o ninguno seleccionado) se conserva el
// comportamiento anterior. Para el resto de países se usa el nombre real del
// país (nunca el código ISO crudo).
function regiónDesdeSolicitud(datos: { paises: string[]; estadosMexico: string[] }): string {
  if (datos.paises.includes("MX")) {
    if (datos.estadosMexico.length > 0) {
      const nombres = datos.estadosMexico.map((c) => NOMBRE_ESTADO_MX[c] ?? c);
      return nombres.join(", ");
    }
    return "Nacional";
  }
  const codigo = datos.paises[0] || "MX";
  return NOMBRES_PAIS[codigo] || codigo;
}

function cuerpoDesdeSolicitud(datos: SolicitudCrearProyecto | SolicitudActualizarProyecto) {
  // main_topic (usado en TODO el pipeline real de búsqueda — YouTube, Brave,
  // GDELT, etc.) debe salir del nombre del funcionario, no de cualquier
  // palabra clave — antes venía de palabrasClave[0] sin importar su tipo, y
  // con la lista plana vieja eso a veces era el primer alias alfabético en
  // vez del nombre real.
  const primerNombre = datos.palabrasClave.find((k) => k.tipo === "nombre")?.palabra;
  return {
    name: datos.nombre.trim(),
    description: datos.descripcion ?? "",
    main_topic: primerNombre ?? datos.nombre.trim(),
    region: regiónDesdeSolicitud(datos),
    language: datos.idiomas[0] ?? "es",
    image_url: datos.imagenUrl ?? null,
    project_type: datos.tipo,
    country_code: datos.paises[0] ?? "MX",
  };
}

function extraerProyecto(cuerpo: { data?: ProyectoBackend }): ProyectoBackend {
  if (!cuerpo.data) throw new BackendError(502, "El backend no regresó el proyecto esperado.");
  return cuerpo.data;
}

/**
 * Persiste palabras clave (alimentan los feeds automáticos de Google News,
 * ver /api/projects/:id/feeds) y redes seleccionadas (se guardan, aunque el
 * pipeline de análisis hoy solo sabe buscar en X — ver REDES_CON_MONITOREO_REAL).
 * Las fuentes de noticias personalizadas van al mecanismo real de RSS
 * (/api/projects/:id/feeds) — solo se agregan las nuevas (sin id numérico aún).
 */
async function guardarDetalleProyecto(
  id: string,
  datos: SolicitudCrearProyecto | SolicitudActualizarProyecto,
): Promise<void> {
  await Promise.all([
    backendPost(`/api/projects/${id}/keywords`, {
      keywords: datos.palabrasClave.map((k) => ({ keyword: k.palabra, type: k.tipo })),
    }),
    backendPost(`/api/projects/${id}/sources`, { sources: datos.redesConectadas }),
    ...datos.fuentesNoticias
      .filter((f) => !("id" in f) || !/^\d+$/.test(String((f as { id?: string }).id ?? "")))
      .map((f) => backendPost(`/api/projects/${id}/feeds`, { url: f.url, name: f.nombre })),
    ...(datos.paises.includes("MX") ? [guardarEstadosMexico(id, datos.estadosMexico)] : []),
  ]);
}

// Los estados de México no viven en `projects` (region ya se arma con sus
// nombres en regiónDesdeSolicitud) sino en monitoring_settings.estados_mx —
// esa fila también guarda config de monitoreo administrada aparte (keywords
// de riesgo, límites diarios...), así que se lee lo existente primero para
// no pisarla: saveMonitoringSettings hace un UPDATE de todas las columnas a
// la vez, no un merge parcial.
async function guardarEstadosMexico(id: string, estados: string[]): Promise<void> {
  const actual = await backendGet<Record<string, unknown> | null>(
    `/api/projects/${id}/settings`,
  ).catch(() => null);
  await backendPost(`/api/projects/${id}/settings`, { ...actual, estados_mx: estados });
}

export async function crearProyectoReal(
  datos: SolicitudCrearProyecto,
  userId: number,
): Promise<Proyecto> {
  const creado = await backendPost<ProyectoBackend>("/api/projects", {
    ...cuerpoDesdeSolicitud(datos),
    user_id: userId,
  });
  const proyecto = extraerProyecto(creado);
  await guardarDetalleProyecto(String(proyecto.id), datos);
  return mapearProyectoBackend(proyecto);
}

export async function actualizarProyectoReal(
  id: string,
  datos: SolicitudActualizarProyecto,
): Promise<Proyecto> {
  const actualizado = await backendPut<ProyectoBackend>(
    `/api/projects/${id}`,
    cuerpoDesdeSolicitud(datos),
  );
  await guardarDetalleProyecto(id, datos);
  return mapearProyectoBackend(extraerProyecto(actualizado));
}

export async function cambiarEstadoProyectoReal(
  id: string,
  estado: "activo" | "inactivo",
): Promise<Proyecto> {
  const actualizado = await backendPut<ProyectoBackend>(`/api/projects/${id}`, {
    status: estado === "activo" ? "active" : "inactive",
  });
  return mapearProyectoBackend(extraerProyecto(actualizado));
}

/** El backend real archiva en vez de borrar físicamente (ver deleteProject en db.js). */
export async function archivarProyectoReal(id: string): Promise<void> {
  await backendDelete(`/api/projects/${id}`);
}
