import { API_BASE } from "@/config/api";
import type {
  AnálisisReal,
  ConsumoUsuario,
  ErrorApi,
  EstadoAnalisisProyecto,
  EstadoProyecto,
  FiltrosMencionesDetalle,
  FuenteDatos,
  MenciónNarrativa,
  OrganizaciónAdmin,
  Proyecto,
  RespuestaActualizarProyecto,
  RespuestaAnalizarConversacion,
  RespuestaBenchmarking,
  RespuestaCambiarEstadoProyecto,
  RespuestaCrearProyecto,
  RespuestaDemo,
  RespuestaEliminarProyecto,
  RespuestaLogin,
  RespuestaEliminarCuenta,
  RespuestaEnviarOtp,
  RespuestaFacturación,
  RespuestaInfografia,
  RespuestaMenciones,
  RespuestaMencionesDetalle,
  RespuestaPanelGeneral,
  RespuestaPerfil,
  RespuestaRecuperarPassword,
  RespuestaRestablecerPassword,
  RespuestaSentimiento,
  RespuestaSolicitudFacturación,
  RespuestaTraspasarCuenta,
  RespuestaVerificarOtp,
  ResumenDashboard,
  ResumenProyectos,
  SolicitudActualizarPerfil,
  SolicitudActualizarProyecto,
  SolicitudAnalizarConversacion,
  SolicitudCambiarCorreo,
  SolicitudCambiarPassword,
  SolicitudCrearProyecto,
  SolicitudCrearTicket,
  SolicitudDemo,
  SolicitudEliminarCuenta,
  SolicitudFacturación,
  SolicitudEnviarOtp,
  SolicitudLogin,
  SolicitudRecuperarPassword,
  SolicitudRestablecerPassword,
  SolicitudTraspasarCuenta,
  SolicitudVerificarOtp,
  TendenciaSentimiento,
  TicketSoporte,
  UsuarioAdmin,
} from "@/types";

async function fetchApi<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    next: { revalidate: 60 }, // revalidar cada minuto en producción
  });

  if (!res.ok) {
    const error: ErrorApi = await res.json().catch(() => ({
      código: String(res.status),
      mensaje: res.statusText,
    }));
    throw new Error(`[${error.código}] ${error.mensaje}`);
  }

  return res.json() as Promise<T>;
}

async function postApi<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error: ErrorApi = await res.json().catch(() => ({
      código: String(res.status),
      mensaje: res.statusText,
    }));
    throw new Error(error.mensaje);
  }

  return res.json() as Promise<T>;
}

async function putApi<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const error: ErrorApi = await res.json().catch(() => ({
      código: String(res.status),
      mensaje: res.statusText,
    }));
    throw new Error(error.mensaje);
  }

  return res.json() as Promise<T>;
}

async function deleteApi<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "DELETE",
    cache: "no-store",
  });

  if (!res.ok) {
    const error: ErrorApi = await res.json().catch(() => ({
      código: String(res.status),
      mensaje: res.statusText,
    }));
    throw new Error(error.mensaje);
  }

  return res.json() as Promise<T>;
}

async function patchApi<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const error: ErrorApi = await res.json().catch(() => ({
      código: String(res.status),
      mensaje: res.statusText,
    }));
    throw new Error(error.mensaje);
  }

  return res.json() as Promise<T>;
}

export const apiResumenDashboard = () => fetchApi<ResumenDashboard>("/metrics");

export const apiTendencias = (días = 7) =>
  fetchApi<TendenciaSentimiento[]>(`/trends?días=${días}`);

export const apiFuentes = () => fetchApi<FuenteDatos[]>("/sources");

/** Panel de menciones — agregado o filtrado por proyecto, y opcionalmente por período (CalendarioMenciones). */
export async function apiMenciones(
  proyectoId?: string | string[] | null,
  soloResumen = false,
  rango?: { inicio: string; fin: string } | null,
) {
  const params = new URLSearchParams();
  if (Array.isArray(proyectoId)) {
    if (proyectoId.length > 0) params.set("proyecto", proyectoId.join(","));
  } else if (proyectoId) {
    params.set("proyecto", proyectoId);
  }
  // El dashboard de Menciones solo necesita el resumen y las más destacadas
  // (ver /api/menciones): pedir el array completo ahí tumbaba la carga con
  // miles de menciones que ni se mostraban. Narrativas sigue sin pasar esto
  // porque calcula palabras clave y países reales sobre todas las menciones.
  if (soloResumen) params.set("vista", "resumen");
  if (rango) {
    params.set("inicio", rango.inicio);
    params.set("fin", rango.fin);
  }
  const query = params.toString();
  const res = await fetch(`${API_BASE}/menciones${query ? `?${query}` : ""}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const error: ErrorApi = await res.json().catch(() => ({
      código: String(res.status),
      mensaje: res.statusText,
    }));
    throw new Error(`[${error.código}] ${error.mensaje}`);
  }
  return res.json() as Promise<RespuestaMenciones>;
}

/** Panorama → Infografía: resumen visual real, agregado o filtrado por proyecto y período. */
export async function apiInfografia(proyectoId?: string | null, diasPeriodo = 14) {
  const params = new URLSearchParams();
  if (proyectoId) params.set("proyecto", proyectoId);
  params.set("dias", String(diasPeriodo));
  const res = await fetch(`${API_BASE}/panorama/infografia?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const error: ErrorApi = await res.json().catch(() => ({
      código: String(res.status),
      mensaje: res.statusText,
    }));
    throw new Error(`[${error.código}] ${error.mensaje}`);
  }
  return res.json() as Promise<RespuestaInfografia>;
}

/** Amplificadores reales — agregado o filtrado por proyecto(s). */
export async function apiAmplificadores(proyectoId?: string | string[] | null) {
  const params = new URLSearchParams();
  if (Array.isArray(proyectoId)) {
    if (proyectoId.length > 0) params.set("proyecto", proyectoId.join(","));
  } else if (proyectoId) {
    params.set("proyecto", proyectoId);
  }
  const query = params.toString();
  const res = await fetch(`${API_BASE}/amplificadores${query ? `?${query}` : ""}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const error: ErrorApi = await res.json().catch(() => ({
      código: String(res.status),
      mensaje: res.statusText,
    }));
    throw new Error(`[${error.código}] ${error.mensaje}`);
  }
  return res.json() as Promise<{ amplificadores: import("@/lib/amplificadores-backend").Amplificador[] }>;
}

/** Alertas reales (abiertas y resueltas) — agregado o filtrado por proyecto(s). */
export async function apiAlertas(proyectoId?: string | string[] | null) {
  const params = new URLSearchParams();
  if (Array.isArray(proyectoId)) {
    if (proyectoId.length > 0) params.set("proyecto", proyectoId.join(","));
  } else if (proyectoId) {
    params.set("proyecto", proyectoId);
  }
  const query = params.toString();
  const res = await fetch(`${API_BASE}/alertas${query ? `?${query}` : ""}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const error: ErrorApi = await res.json().catch(() => ({
      código: String(res.status),
      mensaje: res.statusText,
    }));
    throw new Error(`[${error.código}] ${error.mensaje}`);
  }
  return res.json() as Promise<{ alertas: import("@/lib/alertas-backend").AlertaDetalle[] }>;
}

/** Narrativas reales detectadas por la IA — agregado o filtrado por proyecto. */
export async function apiNarrativas(proyectoId?: string | null) {
  const params = new URLSearchParams();
  if (proyectoId) params.set("proyecto", proyectoId);
  const query = params.toString();
  const res = await fetch(`${API_BASE}/narrativas${query ? `?${query}` : ""}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const error: ErrorApi = await res.json().catch(() => ({
      código: String(res.status),
      mensaje: res.statusText,
    }));
    throw new Error(`[${error.código}] ${error.mensaje}`);
  }
  return res.json() as Promise<{ narrativas: import("@/lib/narrativas-backend").NarrativaDetalle[] }>;
}

/** Reglas de alerta reales configuradas por el usuario (vigilar palabra/narrativa) — siempre de un proyecto específico. */
export async function apiReglasAlerta(proyectoId: string) {
  const res = await fetch(`${API_BASE}/alert-rules?proyecto=${encodeURIComponent(proyectoId)}`, { cache: "no-store" });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ código: String(res.status), mensaje: res.statusText }));
    throw new Error(error.mensaje);
  }
  return res.json() as Promise<{ reglas: import("@/lib/alert-rules-backend").ReglaAlerta[] }>;
}

export async function apiCrearReglaAlerta(datos: {
  proyectoId: string;
  tipo: import("@/lib/alert-rules-backend").TipoReglaAlerta;
  valor: string;
  fechaInicio: string;
  fechaFin: string;
}) {
  const res = await fetch(`${API_BASE}/alert-rules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.mensaje ?? "No se pudo crear la regla.");
  return body as { regla: import("@/lib/alert-rules-backend").ReglaAlerta };
}

export async function apiActualizarReglaAlerta(
  reglaId: string,
  datos: { proyectoId: string; valor?: string; fechaInicio?: string; fechaFin?: string; activa?: boolean },
) {
  const res = await fetch(`${API_BASE}/alert-rules/${reglaId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.mensaje ?? "No se pudo actualizar la regla.");
  return body as { regla: import("@/lib/alert-rules-backend").ReglaAlerta };
}

export async function apiEliminarReglaAlerta(reglaId: string, proyectoId: string) {
  const res = await fetch(`${API_BASE}/alert-rules/${reglaId}?proyecto=${encodeURIComponent(proyectoId)}`, {
    method: "DELETE",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.mensaje ?? "No se pudo eliminar la regla.");
}

/** Búsqueda en vivo real (Monitoreo → Búsqueda) — consulta las mismas 7 fuentes reales que el pipeline de análisis. */
export async function apiBusqueda(datos: { consulta: string; proyectoIds: string[]; página: number; tamaño: number }) {
  const res = await fetch(`${API_BASE}/busqueda`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.mensaje ?? "No se pudo completar la búsqueda.");
  return body as import("@/lib/busqueda-backend").RespuestaBusquedaReal & {
    consulta: string;
    proyectoIds: string[];
    totalFuentes: number;
    actualizadoEn: string;
    página: number;
    tamaño: number;
  };
}

/** Análisis real de IA (gpt-4o) sobre los resultados reales que ya se buscaron. */
export async function apiAnalizarBusqueda(consulta: string) {
  const res = await fetch(`${API_BASE}/busqueda/analizar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ consulta }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.mensaje ?? "No se pudo analizar la conversación.");
  return body.analisis as {
    executive_summary?: string;
    narratives?: { name?: string; mentions?: string; sentiment?: string; risk?: string; trend?: string }[];
    recommendations?: string[];
    hashtags?: string[];
    risk_level?: string;
    sentiment?: { positive?: number; negative?: number; neutral?: number };
  };
}

/** Panel general (/proyectos) — menciones/sentimiento/alertas reales, agregado, por proyecto o por un subconjunto de proyectos. */
export async function apiPanelGeneral(
  proyectoId?: string | string[] | null,
  rango?: { inicio: string; fin: string } | null,
) {
  const params = new URLSearchParams();
  if (Array.isArray(proyectoId)) {
    if (proyectoId.length > 0) params.set("proyecto", proyectoId.join(","));
  } else if (proyectoId) {
    params.set("proyecto", proyectoId);
  }
  if (rango) {
    params.set("inicio", rango.inicio);
    params.set("fin", rango.fin);
  }
  const query = params.toString();
  const res = await fetch(`${API_BASE}/proyectos/panel${query ? `?${query}` : ""}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const error: ErrorApi = await res.json().catch(() => ({
      código: String(res.status),
      mensaje: res.statusText,
    }));
    throw new Error(`[${error.código}] ${error.mensaje}`);
  }
  return res.json() as Promise<RespuestaPanelGeneral>;
}

/** Último análisis de IA real de un proyecto (resumen ejecutivo, narrativas) — null si nunca se ha corrido uno. */
export async function apiAnalisisReal(proyectoId: string) {
  const res = await fetch(`${API_BASE}/proyectos/analisis?proyecto=${encodeURIComponent(proyectoId)}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json() as Promise<AnálisisReal | null>;
}

/** Estado del análisis más reciente de un proyecto — para el banner "todavía recolectando información". */
export async function apiEstadoAnalisis(proyectoId: string) {
  const res = await fetch(`${API_BASE}/proyectos/estado-analisis?proyecto=${encodeURIComponent(proyectoId)}`, {
    cache: "no-store",
  });
  if (!res.ok) return { estado: "sin_datos" as const };
  return res.json() as Promise<EstadoAnalisisProyecto>;
}

/** Explorador paginado de menciones para scroll infinito. */
export async function apiMencionesDetalle(filtros: FiltrosMencionesDetalle) {
  const params = new URLSearchParams();
  if (filtros.proyectoId) params.set("proyecto", filtros.proyectoId);
  if (filtros.búsqueda) params.set("búsqueda", filtros.búsqueda);
  if (filtros.fuentes?.length) {
    params.set("fuentes", filtros.fuentes.join(","));
  }
  if (filtros.fuente) {
    params.set("fuente", filtros.fuente);
  }
  if (filtros.sentimiento) {
    params.set("sentimiento", filtros.sentimiento);
  }
  params.set("página", String(filtros.página ?? 1));
  params.set("tamaño", String(filtros.tamaño ?? 24));

  const res = await fetch(`${API_BASE}/menciones/detalle?${params}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const error: ErrorApi = await res.json().catch(() => ({
      código: String(res.status),
      mensaje: res.statusText,
    }));
    throw new Error(`[${error.código}] ${error.mensaje}`);
  }
  return res.json() as Promise<RespuestaMencionesDetalle>;
}

export const apiRecuperarPassword = (datos: SolicitudRecuperarPassword) =>
  postApi<RespuestaRecuperarPassword>("/auth/recuperar-password", datos);

export const apiRestablecerPassword = (datos: SolicitudRestablecerPassword) =>
  postApi<RespuestaRestablecerPassword>("/auth/reset-password", datos);

/** Facturación real (plan/límite de la organización) — sesión vía cookie httpOnly. */
export async function apiObtenerFacturación() {
  const res = await fetch(`${API_BASE}/facturacion`, { cache: "no-store" });
  if (!res.ok) {
    const error: ErrorApi = await res.json().catch(() => ({
      código: String(res.status),
      mensaje: res.statusText,
    }));
    throw new Error(error.mensaje);
  }
  return res.json() as Promise<RespuestaFacturación>;
}

export const apiSolicitarFacturación = (datos: SolicitudFacturación) =>
  postApi<RespuestaSolicitudFacturación>("/facturacion/solicitud", datos);

/** Perfil del usuario autenticado real — /api/perfil (sesión vía cookie httpOnly). */
export async function apiObtenerPerfil() {
  const res = await fetch(`${API_BASE}/perfil`, { cache: "no-store" });
  if (!res.ok) {
    const error: ErrorApi = await res.json().catch(() => ({
      código: String(res.status),
      mensaje: res.statusText,
    }));
    throw new Error(error.mensaje);
  }
  return res.json() as Promise<RespuestaPerfil>;
}

export const apiActualizarPerfil = (datos: SolicitudActualizarPerfil) =>
  patchApi<RespuestaPerfil>("/perfil", datos);

export const apiEnviarOtpPerfil = (datos: SolicitudEnviarOtp) =>
  postApi<RespuestaEnviarOtp>("/perfil/otp/enviar", datos);

export const apiVerificarOtpPerfil = (datos: SolicitudVerificarOtp) =>
  postApi<RespuestaVerificarOtp>("/perfil/otp/verificar", datos);

export const apiSolicitarCambioCorreo = (datos: SolicitudCambiarCorreo) =>
  postApi<{ mensaje: string }>("/perfil/correo", datos);

export const apiCambiarPasswordPerfil = (datos: SolicitudCambiarPassword) =>
  postApi<{ mensaje: string }>("/perfil/password", datos);

export const apiEliminarCuenta = (datos: SolicitudEliminarCuenta) =>
  postApi<RespuestaEliminarCuenta>("/perfil/eliminar", datos);

export const apiSolicitarTraspaso = (datos: SolicitudTraspasarCuenta) =>
  postApi<RespuestaTraspasarCuenta>("/perfil/traspasar", datos);

/** Desglose de sentimiento real — agregado o filtrado por proyecto. */
export async function apiSentimiento(
  proyectoId?: string | null,
  rango?: { inicio: string; fin: string } | null,
) {
  const params = new URLSearchParams();
  if (proyectoId) params.set("proyecto", proyectoId);
  if (rango) {
    params.set("inicio", rango.inicio);
    params.set("fin", rango.fin);
  }
  const query = params.toString();
  const res = await fetch(`${API_BASE}/sentimiento${query ? `?${query}` : ""}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const error: ErrorApi = await res.json().catch(() => ({
      código: String(res.status),
      mensaje: res.statusText,
    }));
    throw new Error(`[${error.código}] ${error.mensaje}`);
  }
  return res.json() as Promise<RespuestaSentimiento>;
}

/**
 * Login — hoy pega al mock en /api/auth/login.
 * Conexión real: sin cambios aquí si NEXT_PUBLIC_API_URL apunta al backend;
 * el endpoint remoto debe respetar el contrato SolicitudLogin / RespuestaLogin.
 */
export const apiLogin = (datos: SolicitudLogin) =>
  postApi<RespuestaLogin>("/auth/login", datos);

/** Solicitud de demo — mock en /api/demo. */
export const apiSolicitarDemo = (datos: SolicitudDemo) =>
  postApi<RespuestaDemo>("/demo", datos);

/** Listado de proyectos reales — /api/proyectos (sin cache para reflejar altas). */
export async function apiListarProyectos() {
  const res = await fetch(`${API_BASE}/proyectos`, { cache: "no-store" });
  if (!res.ok) {
    const error: ErrorApi = await res.json().catch(() => ({
      código: String(res.status),
      mensaje: res.statusText,
    }));
    throw new Error(`[${error.código}] ${error.mensaje}`);
  }
  return res.json() as Promise<{
    proyectos: Proyecto[];
    resumen: ResumenProyectos;
  }>;
}

/** Detalle de proyecto real — /api/proyectos/[id]. */
export async function apiObtenerProyecto(id: string) {
  const res = await fetch(`${API_BASE}/proyectos/${id}`, { cache: "no-store" });
  if (!res.ok) {
    const error: ErrorApi = await res.json().catch(() => ({
      código: String(res.status),
      mensaje: res.statusText,
    }));
    throw new Error(error.mensaje);
  }
  return res.json() as Promise<{ proyecto: Proyecto }>;
}

/** Alta de proyecto real — /api/proyectos. */
export const apiCrearProyecto = (datos: SolicitudCrearProyecto) =>
  postApi<RespuestaCrearProyecto>("/proyectos", datos);

/** Actualización de proyecto real — /api/proyectos/[id]. */
export const apiActualizarProyecto = (
  id: string,
  datos: SolicitudActualizarProyecto,
) => putApi<RespuestaActualizarProyecto>(`/proyectos/${id}`, datos);

/** Baja de proyecto real (el backend archiva, no borra físicamente) — /api/proyectos/[id]. */
export const apiEliminarProyecto = (id: string) =>
  deleteApi<RespuestaEliminarProyecto>(`/proyectos/${id}`);

/** Activar / desactivar proyecto real — /api/proyectos/[id]. */
export const apiCambiarEstadoProyecto = (id: string, estado: EstadoProyecto) =>
  patchApi<RespuestaCambiarEstadoProyecto>(`/proyectos/${id}`, { estado });

/**
 * Crea un proyecto a partir de un tema libre y dispara el análisis real
 * sobre él (ingesta + búsquedas en vivo + IA) — /api/proyectos/analizar.
 * Tarda hasta ~30s y consume créditos reales de IA en cada llamada.
 */
export const apiAnalizarConversacion = (datos: SolicitudAnalizarConversacion) =>
  postApi<RespuestaAnalizarConversacion>("/proyectos/analizar", datos);

// ─── Soporte / tickets — pega directo al backend real (nginx enruta /api/soporte/* sin pasar por un Route Handler propio). ──
export const apiCrearTicket = (datos: SolicitudCrearTicket) =>
  postApi<TicketSoporte>("/soporte/tickets", {
    user_id: datos.userId,
    tipo_error: datos.tipoError,
    seccion: datos.seccion,
    prioridad: datos.prioridad,
    descripcion: datos.descripcion,
  });

/** Tickets del usuario en sesión. */
export async function apiMisTickets(userId: string) {
  const res = await fetch(`${API_BASE}/soporte/tickets?user_id=${encodeURIComponent(userId)}`, { cache: "no-store" });
  if (!res.ok) return [];
  const body = (await res.json()) as { data?: TicketSoporte[] };
  return body.data ?? [];
}

/** Todos los tickets de la organización — solo admin (el backend valida el rol de resolverId). */
export async function apiTicketsAdmin(resolverId: string) {
  const res = await fetch(`${API_BASE}/soporte/tickets/admin?resolver_id=${encodeURIComponent(resolverId)}`, { cache: "no-store" });
  if (!res.ok) return [];
  const body = (await res.json()) as { data?: TicketSoporte[] };
  return body.data ?? [];
}

export const apiResolverTicket = (ticketId: number, resolverId: string, resolutionSummary: string) =>
  postApi<TicketSoporte>(`/soporte/tickets/${ticketId}/resolver`, {
    resolver_id: resolverId,
    resolution_summary: resolutionSummary,
  });

/**
 * Menciones reales detrás de una narrativa — solo las que la IA citó
 * explícitamente al detectarla (ver detected_narrative en raw_json). Un
 * resultado chico o vacío es honesto: no todas las menciones ingeridas se
 * asocian a una narrativa específica.
 */
export async function apiMencionesNarrativa(narrativaId: string) {
  const res = await fetch(`${API_BASE}/narratives/${narrativaId}/mentions`, { cache: "no-store" });
  if (!res.ok) return [] as MenciónNarrativa[];
  const body = (await res.json()) as { data?: { mentions?: MenciónNarrativa[] } };
  return body.data?.mentions ?? [];
}

/**
 * Notas reales detrás de cualquier alerta automática que no sea de narrativa
 * (sentiment_drop/negative_spike/critical_keywords/sensitive_source/
 * high_risk_amplifier/user_keyword) — el backend despacha por el tipo real
 * de la alerta en getAlertEvidence (db.js), nunca se inventa la relación.
 */
export async function apiEvidenciaAlerta(alertaId: string) {
  const res = await fetch(`${API_BASE}/alerts/${alertaId}/evidencia`, { cache: "no-store" });
  if (!res.ok) return [] as MenciónNarrativa[];
  const body = (await res.json()) as { data?: { mentions?: MenciónNarrativa[] } };
  return body.data?.mentions ?? [];
}

export type HashtagReal = { hashtag: string; total: number };

/**
 * Hashtags reales generados por la IA en cada análisis de UN proyecto. Para
 * "todos los proyectos" se llama una vez por proyecto y se combinan los
 * resultados en el cliente (evita depender de user_id/role, que un
 * componente cliente no puede resolver de forma segura — la lista de
 * proyectos que sí recibe ya viene filtrada por la sesión real).
 */
export async function apiHashtagsProyecto(proyectoId: string) {
  const res = await fetch(`${API_BASE}/projects/${proyectoId}/hashtags`, { cache: "no-store" });
  if (!res.ok) return [] as HashtagReal[];
  const body = (await res.json()) as { data?: HashtagReal[] };
  return body.data ?? [];
}

/**
 * Hashtags de TODOS los proyectos en una sola llamada real (agregados y
 * ordenados en el backend) — usar en vez de mapear apiHashtagsProyecto sobre
 * cada id cuando el combo del sidebar tiene "todos" seleccionado. Evita 1
 * viaje de red por proyecto activo (con 10 proyectos, 10 llamadas ⇒ 1).
 */
export async function apiHashtagsTodos() {
  const res = await fetch(`/api/proyectos/hashtags-todos`, { cache: "no-store" });
  if (!res.ok) return [] as HashtagReal[];
  const body = (await res.json()) as { hashtags?: HashtagReal[] };
  return body.hashtags ?? [];
}

/**
 * Menciones reales que vinieron del mismo análisis que generó este hashtag —
 * el hashtag es un dato a nivel de análisis, no de publicación individual, así
 * que este es el vínculo más fino que existe (ver server.js).
 */
export async function apiMencionesHashtag(proyectoId: string, hashtag: string) {
  const res = await fetch(
    `${API_BASE}/projects/${proyectoId}/hashtags/${encodeURIComponent(hashtag)}/mentions`,
    { cache: "no-store" },
  );
  if (!res.ok) return [] as MenciónNarrativa[];
  const body = (await res.json()) as { data?: MenciónNarrativa[] };
  return body.data ?? [];
}

/**
 * Benchmarking real entre 2+ proyectos. A diferencia de los demás `api*` de
 * este archivo, pega contra nuestra propia ruta Next (`/api/benchmarking`,
 * con regla nginx dedicada) y no directo al backend crudo — necesita
 * resolver los nombres reales de proyecto contra la sesión, no confiar en lo
 * que mande el cliente.
 */
export async function apiBenchmarking(proyectoIds: string[]) {
  const res = await fetch(`${API_BASE}/benchmarking?proyectos=${proyectoIds.join(",")}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const error: ErrorApi = await res.json().catch(() => ({
      código: String(res.status),
      mensaje: res.statusText,
    }));
    throw new Error(`[${error.código}] ${error.mensaje}`);
  }
  return res.json() as Promise<RespuestaBenchmarking>;
}

// ─── Administración (Super Usuario) ──────────────────────────────────────────
// A diferencia de apiListarProyectos (pega directo al backend crudo), estas
// pasan por rutas propias de Next (/api/admin/*) que reenvían la sesión real
// del usuario que hace la petición — el backend filtra por organización
// según su rol real, no según el fallback demo.

async function fetchNext<T>(endpoint: string): Promise<T> {
  const res = await fetch(endpoint, { cache: "no-store" });
  const body = await res.json().catch(() => ({ ok: false, message: res.statusText }));
  if (!res.ok || !body.ok) throw new Error(body.message ?? "Error del servidor.");
  return body.data as T;
}

async function postNext<T>(endpoint: string, datos: unknown): Promise<T> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  const body = await res.json().catch(() => ({ ok: false, message: res.statusText }));
  if (!res.ok || !body.ok) throw new Error(body.message ?? "Error del servidor.");
  return body.data as T;
}

export const apiListarUsuariosAdmin = () => fetchNext<UsuarioAdmin[]>("/api/admin/usuarios");

export const apiCrearUsuarioAdmin = (organizationId: number, datos: {
  name: string;
  email: string;
  password: string;
  role: string;
}) => postNext<UsuarioAdmin>("/api/admin/usuarios", { organizationId, ...datos });

export const apiListarConsumo = () => fetchNext<ConsumoUsuario[]>("/api/admin/consumo");

export const apiListarOrganizaciones = () =>
  fetchNext<OrganizaciónAdmin[]>("/api/admin/organizaciones");

export const apiCrearOrganizacion = (datos: { name: string; plan?: string; max_projects?: number }) =>
  postNext<OrganizaciónAdmin>("/api/admin/organizaciones", datos);
