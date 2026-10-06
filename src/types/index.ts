// ─── Contrato de datos entre frontend y backend ──────────────────────────────
// Cualquier cambio en la forma de los datos se negocia aquí primero.

export type CategoríaSentimiento = "positivo" | "negativo" | "neutral";

export type PuntuaciónSentimiento = {
  categoría: CategoríaSentimiento;
  puntuación: number; // 0–100
  confianza: number; // 0–1
};

export type PuntoMétrica = {
  timestamp: string; // ISO 8601
  valor: number;
};

// ─── Pantalla /sentimiento — desglose real de tonalidad ──────────────────────

export type CategoríaTonalidad = "positivo" | "negativo" | "neutral" | "sin_calificar";

export type SegmentoTonalidad = {
  categoría: CategoríaTonalidad;
  valor: number;
  porcentaje: number;
};

export type PuntoTendenciaTonalidad = {
  fecha: string; // ISO date
  positivo: number;
  negativo: number;
  neutro: number;
};

export type TonalidadPorFuente = {
  fuente: string;
  positivo: number;
  negativo: number;
  neutro: number;
  sinCalificar: number;
};

export type PuntoSerieSentimiento = {
  fecha: string; // ISO date
  actualMenciones: number;
  anteriorMenciones: number;
  actualPorcentaje: number;
  anteriorPorcentaje: number;
};

// ─── Análisis de IA real (resumen ejecutivo, narrativas) ─────────────────────
// Lo que `gpt-4o` realmente escribió en la última corrida de "Analizar
// ahora" — existía en la BD (`analyses.response_json`, `narratives`) desde
// siempre pero ningún componente lo mostraba. Ver README.md, entrada 2026-08-19.

export type NivelRiesgo = "Bajo" | "Medio" | "Alto" | "Crítico" | string;

export type NarrativaReal = {
  nombre: string;
  menciones: string;
  sentimiento: CategoríaSentimiento | string;
  riesgo: string;
  tendencia: string;
};

export type DistribuciónFuenteReal = {
  fuente: string;
  porcentaje: number;
  sentimientoDominante: string;
};

export type AnálisisReal = {
  id: string;
  tema: string;
  creadoEn: string;
  nivelRiesgo: NivelRiesgo;
  resumenTitular: string;
  resumenEjecutivo: string;
  recomendaciones: string[];
  narrativas: NarrativaReal[];
  hashtags: string[];
  distribuciónFuentes: DistribuciónFuenteReal[];
};

/** Estado del análisis más reciente de un proyecto — "en_progreso" mientras el pipeline real (RSS/fuentes vivas/IA) corre en segundo plano. */
export type EstadoAnalisisProyecto =
  | { estado: "en_progreso"; iniciadoHaceSegundos: number }
  | { estado: "estancado"; iniciadoHaceSegundos: number }
  // completadoEn: real timestamp of the last SUCCESSFUL run, even if this
  // one errored — null only when no run has ever succeeded for the project.
  | { estado: "error"; error: string | null; completadoEn: string | null }
  | { estado: "completo"; completadoEn: string | null }
  | { estado: "sin_datos" };

// ─── Facturación ──────────────────────────────────────────────────────────────
// Sin pasarela de pago conectada todavía (ni Stripe ni Mercado Pago) — no hay
// fecha de corte, método de pago ni historial real que mostrar. Solo el
// plan/límite reales de la organización; "cambiar plan"/"cancelar" generan
// una solicitud real por correo a soporte, no un cobro.

export type TipoSolicitudFacturación = "cambiar_plan" | "cancelar";

export type RespuestaFacturación = {
  organización: string;
  plan: string;
  maxProyectos: number;
  proyectosActivos: number;
};

export type SolicitudFacturación = {
  tipo: TipoSolicitudFacturación;
  planDeseado?: string;
  comentario?: string;
};

export type RespuestaSolicitudFacturación = {
  mensaje: string;
  enviado: boolean;
};

// ─── Perfil de usuario ───────────────────────────────────────────────────────
// Sin foto (no hay columna de avatar en la BD real) ni "título" de puesto
// libre (no existe ese campo) — se muestra el rol real (admin/editor/…) en
// su lugar. Iniciales/avatar nulo se resuelven igual que en el Topbar.

export type PerfilUsuario = {
  id: string;
  nombre: string;
  rol: SesiónUsuario["role"];
  email: string;
  iniciales: string;
};

export type RespuestaPerfil = { perfil: PerfilUsuario };

export type SolicitudActualizarPerfil = { nombre?: string };

export type PropósitoOtp = "cambiar_correo" | "cambiar_password" | "eliminar_cuenta" | "traspasar_cuenta";

export type SolicitudEnviarOtp = { propósito: PropósitoOtp };

export type RespuestaEnviarOtp = { mensaje: string; enviado: boolean };

export type SolicitudVerificarOtp = { propósito: PropósitoOtp; código: string };

export type RespuestaVerificarOtp = { válido: boolean; tokenCambio?: string; mensaje: string };

export type SolicitudCambiarCorreo = { nuevoEmail: string };

export type SolicitudCambiarPassword = { tokenCambio: string; nuevaPassword: string };

export type SolicitudEliminarCuenta = { tokenCambio: string };

export type RespuestaEliminarCuenta = { mensaje: string };

export type SolicitudTraspasarCuenta = { emailDestino: string };

export type RespuestaTraspasarCuenta = { mensaje: string };

export type RespuestaSentimiento = {
  proyectoId: string | null;
  período: { inicio: string; fin: string };
  límiteHistórico?: { activo: boolean; días: number };
  desglose: SegmentoTonalidad[];
  tendenciaTonalidad: PuntoTendenciaTonalidad[];
  tonalidadPorFuente: TonalidadPorFuente[];
  seriePositivo: PuntoSerieSentimiento[];
  serieNegativo: PuntoSerieSentimiento[];
  mencionesPositivas: MenciónEditorial[];
  mencionesNegativas: MenciónEditorial[];
};

export type TarjetaMétrica = {
  id: string;
  etiqueta: string;
  valor: number | string;
  cambio: number; // porcentaje, positivo = alza
  unidad?: string;
};

export type TipoFuente =
  | "twitter"
  | "instagram"
  | "facebook"
  | "noticias"
  | "reseñas"
  | "personalizado";

export type EstadoFuente = "activo" | "inactivo" | "error";

export type FuenteDatos = {
  id: string;
  nombre: string;
  tipo: TipoFuente;
  estado: EstadoFuente;
  últimaSincronización: string; // ISO 8601
  totalMenciones: number;
};

export type TipoFuenteMención =
  | "x"
  | "facebook"
  | "noticias"
  | "instagram"
  | "youtube"
  | "tiktok"
  | "blogs";

// ─── Panorama / Infografía — resumen visual para compartir, todo real ────────
export type ResumenInfografia = {
  proyectoId: string | null;
  nombreProyecto: string;
  período: { inicio: string; fin: string };
  mencionesTotales: number;
  cambioMenciones: number | null;
  // Delta real de menciones (actual - anterior), siempre calculable — mismo
  // criterio que cambioAbsoluto en FuenteMenciones (2026-10-02): respaldo
  // honesto cuando cambioMenciones es null por base chica.
  cambioMencionesAbsoluto: number;
  alcanceTotal: number;
  cambioAlcance: number | null;
  cambioAlcanceAbsoluto: number;
  sentimiento: { positivo: number; negativo: number; neutro: number; clasificadas: number; total: number };
  fuentesActivas: FuenteMenciones[];
  topEmisores: EmisorVolumen[];
  mencionesPopulares: MenciónEditorial[];
  regiones: { region: string; menciones: number }[];
};

export type RespuestaInfografia = { datos: ResumenInfografia };

export type FuenteMenciones = {
  id: TipoFuenteMención;
  nombre: string;
  total: number;
  // null = el % no es confiable (base del período anterior muy chica — ver
  // VOLUMEN_MINIMO_CAMBIO, protege contra casos reales como "+847,366.7%").
  // Pedido explícito del cliente (2026-10-02): nunca mostrar "N/D" en su
  // lugar — cambioAbsoluto (abajo) SIEMPRE es real y se usa de respaldo.
  cambio: number | null;
  // Delta real de menciones (actual - anterior) — siempre calculable, a
  // diferencia del %, así que sirve de respaldo honesto cuando `cambio` es null.
  cambioAbsoluto: number;
  porcentaje: number;
  color: string;
};

export type PuntoTendenciaMenciones = {
  fecha: string; // ISO date
  actual: number;
  anterior: number;
  // Cuántas de `actual` no tienen fecha de publicación real (se les asignó
  // la fecha en que se detectaron, no la real) — para que la gráfica pueda
  // avisar cuándo el día está inflado por eso, no ocultarlo.
  estimadasActual: number;
};

export type MenciónEditorial = {
  id: string;
  proyectoId: string;
  título: string;
  extracto: string;
  fuente: string;
  autor: string;
  url: string;
  publicadaEn: string; // ISO 8601
  sentimiento: CategoríaSentimiento;
  tipoFuente: TipoFuenteMención;
  alcance: number;
  compartidos: number;
  // Texto libre original de `reach` ("Nacional", "451", "Alta"...) — se
  // preserva porque `alcance` arriba solo captura números puros (0 si no).
  // Sirve para estimaciones editoriales estándar, siempre marcadas "(estimado)".
  // Opcional: los datos mock que aún quedan en otras páginas no lo traen.
  alcanceEtiqueta?: string | null;
  // true si el análisis de IA sí trajo un valor de sentimiento para esta
  // mención; false si vino vacío (aún no se le corrió análisis de
  // sentimiento). Sin esto, las menciones sin analizar se contaban como
  // "neutral" y aplastaban artificialmente el % positivo/negativo real.
  sentimientoClasificado?: boolean;
  // true si esta mención NO tiene fecha de publicación real — `publicadaEn`
  // cae al fallback (fecha de detección/ingesta) en vez de la real. Sirve
  // para avisar en la gráfica de tendencia cuándo un día está inflado por
  // esto, no para ocultarlo.
  fechaEstimada?: boolean;
  // Imagen/interacciones reales — solo vienen de YouTube (construida a partir
  // del id de video) o de fuentes que de verdad las capturan (Instagram/TikTok
  // vía SocialCrawl). Ausentes (null) en el resto — nunca se inventa una.
  imagenUrl?: string | null;
  interacciones?: number | null;
};

// Cada cambio % puede ser null (base anterior muy chica, ver
// VOLUMEN_MINIMO_CAMBIO); el delta absoluto (actual - anterior) SIEMPRE es
// real y se muestra en su lugar — nunca "N/D" (pedido del cliente, 2026-10-02).
export type ResumenMenciones = {
  total: number;
  cambioTotal: number | null;
  cambioTotalAbsoluto: number;
  positivas: number;
  cambioPositivas: number | null;
  cambioPositivasAbsoluto: number;
  negativas: number;
  cambioNegativas: number | null;
  cambioNegativasAbsoluto: number;
  redesSociales: number;
  cambioRedesSociales: number | null;
  cambioRedesSocialesAbsoluto: number;
  editoriales: number;
  cambioEditoriales: number | null;
  cambioEditorialesAbsoluto: number;
};

export type RespuestaMenciones = {
  proyectoId: string | null;
  // Cuentas plan "basic" solo ven los últimos 7 días — `activo: true` cuando
  // el backend tuvo que acotar el rango pedido (o el default) por eso.
  límiteHistórico?: { activo: boolean; días: number };
  período: { inicio: string; fin: string };
  resumen: ResumenMenciones;
  fuentes: FuenteMenciones[];
  tendencia: PuntoTendenciaMenciones[];
  menciones: MenciónEditorial[];
};

export type CategoríaFuenteMenciónDetalle = "red_social" | "medio";

export type FuenteMenciónDetalle = {
  id: TipoFuenteMención;
  nombre: string;
  categoría: CategoríaFuenteMenciónDetalle;
};

export type MenciónDetalle = {
  id: string;
  proyectoId: string;
  tipoFuente: TipoFuenteMención;
  fuente: string;
  autor: string;
  usuario: string;
  contenido: string;
  url: string;
  publicadaEn: string; // ISO 8601
  sentimiento: CategoríaSentimiento;
  // null = "N/D" — no todas las fuentes reales capturan estos números (ver
  // aMenciónDetalle en app/api/menciones/detalle/route.ts): mostrar un 0
  // fijo daba a entender "cero interacciones reales" cuando en realidad es
  // "esta fuente no trae ese dato", ej. posts de Instagram/TikTok
  // encontrados vía Brave/SerpApi/GDELT (indexados por un buscador) en vez
  // de SocialCrawl (que sí scrapea la plataforma y trae vistas/likes reales).
  alcance: number | null;
  interacciones: number | null;
  compartidos: number | null;
  // true cuando la fuente no dio una fecha de publicación confiable y
  // `publicadaEn` en realidad es la fecha de detección (ver fechaMención en
  // menciones-backend.ts) — para que la tarjeta lo muestre honesto en vez de
  // dar a entender que la publicación es de hoy.
  fechaEstimada?: boolean;
};

export type FiltrosMencionesDetalle = {
  proyectoId?: string | null;
  búsqueda?: string;
  fuentes?: TipoFuenteMención[];
  // Una sola fuente: pagina SOLO dentro de esa fuente (ver RespuestaMencionesDetalle.hayMás)
  // en vez de una página mixta de todas las fuentes seleccionadas — sin esto,
  // una fuente chica (ej. Facebook con 7 menciones) quedaba enterrada detrás
  // de miles de menciones de X/noticias y nunca llegaba a cargarse.
  fuente?: TipoFuenteMención | null;
  sentimiento?: CategoríaSentimiento | null;
  página?: number;
  tamaño?: number;
};

export type RespuestaMencionesDetalle = {
  menciones: MenciónDetalle[];
  página: number;
  tamaño: number;
  // Total de TODAS las fuentes seleccionadas juntas (para el contador
  // "24 de 1403" del encabezado) — no cambia según `fuente`.
  total: number;
  // Con `fuente` en la solicitud: si esa fuente específica tiene más
  // páginas. Sin `fuente`: comportamiento viejo (mezcla de todas).
  hayMás: boolean;
  // Total real por fuente entre TODAS las menciones filtradas (no solo la
  // página actual) — el badge de cada columna necesita el conteo real, no
  // "cuántas se llevan cargadas hasta ahorita" (eso hacía ver, por ejemplo,
  // "4 menciones" en X cuando en realidad había 104).
  totalPorFuente: Partial<Record<TipoFuenteMención, number>>;
};

export type TendenciaSentimiento = {
  período: string; // e.g. "2026-07-01"
  positivo: number;
  negativo: number;
  neutral: number;
  total: number;
};

export type CondiciónAlerta = "mayor_que" | "menor_que" | "igual_a";
export type CanalNotificación = "email" | "slack" | "webhook";

export type Alerta = {
  id: string;
  nombre: string;
  condición: CondiciónAlerta;
  umbral: number;
  métrica: string;
  fuenteId?: string;
  habilitada: boolean;
  canalesNotificación: CanalNotificación[];
  creadaEn: string; // ISO 8601
};

export type ResumenDashboard = {
  sentimientoGeneral: PuntuaciónSentimiento;
  métricas: TarjetaMétrica[];
  fuentes: FuenteDatos[];
  últimaActualización: string; // ISO 8601
};

// Wrapper genérico para respuestas de la API
export type RespuestaApi<T> = {
  datos: T;
  meta?: {
    página?: number;
    tamaño?: number;
    total?: number;
  };
};

export type ErrorApi = {
  código: string;
  mensaje: string;
};

export type SolicitudRecuperarPassword = {
  email: string;
};

export type RespuestaRecuperarPassword = {
  mensaje: string;
};

export type SolicitudRestablecerPassword = {
  token: string;
  new_password: string;
};

export type RespuestaRestablecerPassword = {
  mensaje: string;
};

export type SolicitudLogin = {
  email: string;
  password: string;
  recordar?: boolean;
};

export type RespuestaLogin = {
  mensaje: string;
  usuario?: SesiónUsuario;
};

/** Usuario real resuelto desde la cookie de sesión — ver src/lib/session.ts. */
export type SesiónUsuario = {
  id: number;
  name: string;
  email: string;
  role: "superadmin" | "admin" | "editor" | "viewer";
  organization_id: number;
  /** Plan real de la organización (basic/pro/enterprise) — null si la
   * organización fue borrada o no tiene plan asignado. */
  plan: string | null;
};

// ─── Administración (Super Usuario) ──────────────────────────────────────────

export type RolUsuario = "admin" | "editor" | "viewer";

export type UsuarioAdmin = {
  id: number;
  name: string;
  email: string;
  role: SesiónUsuario["role"];
  status: "active" | "archived";
  created_at: string;
  organization_id: number;
};

export type OrganizaciónAdmin = {
  id: number;
  name: string;
  plan: string;
  max_projects: number;
  user_count: number;
  project_count: number;
};

/** Consumo real de IA (tokens) por usuario — de la tabla usage_logs. */
export type ConsumoUsuario = {
  id: number;
  name: string;
  email: string;
  role: SesiónUsuario["role"];
  organization_id: number;
  eventos: number;
  tokens_entrada: number;
  tokens_salida: number;
  ultimo_uso: string | null;
};

// ─── Demo / lead ─────────────────────────────────────────────────────────────

export type SolicitudDemo = {
  nombre: string;
  apellidos?: string;
  telefono?: string;
  email: string;
  comentario?: string;
};

export type RespuestaDemo = {
  mensaje: string;
};

// ─── Soporte / tickets ───────────────────────────────────────────────────────

export type EstadoTicket = "abierto" | "resuelto";

export type TicketSoporte = {
  id: number;
  ticket_id: string;
  organization_id: number;
  user_id: number;
  subject: string;
  tipo_error: string | null;
  seccion: string | null;
  prioridad: string;
  descripcion: string;
  status: EstadoTicket;
  resolution_summary: string | null;
  created_at: string;
  resolved_at: string | null;
};

/** Mención real citada por la IA como evidencia de una narrativa (ver detected_narrative en raw_json). */
export type MenciónNarrativa = {
  id: number;
  title: string | null;
  url: string | null;
  source_name: string | null;
  sentiment: string | null;
  published_at: string | null;
  content: string | null;
};

// ─── Benchmarking real entre proyectos ────────────────────────────────────
// Mismas 10 métricas que la referencia de Bruno, menos "Presence Score" y
// "AVE" (Advertising Value Equivalency): son métricas de PR que requieren una
// fórmula propia o tarifas publicitarias reales que no tenemos — se omiten en
// vez de inventar un puntaje o un valor en pesos sin base real.
export type MétricasProyectoBenchmarking = {
  proyectoId: string;
  nombre: string;
  color: string;
  mencionesTotales: number;
  mencionesRedesSociales: number;
  mencionesFueraRedes: number;
  mencionesPositivas: number;
  mencionesPositivasPorcentaje: number;
  mencionesNegativas: number;
  mencionesNegativasPorcentaje: number;
  alcanceRedesSociales: number;
  alcanceFueraRedes: number;
  // Menciones reales en canales de publicación directa de usuarios
  // (X/Facebook/Instagram/TikTok) — se excluyen Noticias/YouTube/Blogs por
  // ser canales de contenido más producido que espontáneo. Es una definición
  // razonable, no una medición oficial de "UGC".
  contenidoGeneradoUsuarios: number;
};

export type PuntoTendenciaBenchmarking = {
  fecha: string;
  valoresPorProyecto: Record<string, number>;
};

export type TonalidadPorProyecto = {
  proyectoId: string;
  nombre: string;
  positivo: number;
  negativo: number;
  neutral: number;
  sinCalificar: number;
};

export type CategoríasPorProyecto = {
  proyectoId: string;
  nombre: string;
  x: number;
  facebook: number;
  instagram: number;
  tiktok: number;
  noticias: number;
  youtube: number;
  blogs: number;
};

export type ResumenBenchmarking = {
  titular: string;
  liderMenciones: string;
  liderAlcance: string;
  liderSentimiento: string;
  lectura: string[];
};

export type RespuestaBenchmarking = {
  período: { inicio: string; fin: string };
  proyectos: MétricasProyectoBenchmarking[];
  tendenciaMenciones: PuntoTendenciaBenchmarking[];
  tendenciaAlcance: PuntoTendenciaBenchmarking[];
  tendenciaSentimientoPositivo: PuntoTendenciaBenchmarking[];
  tendenciaSentimientoNegativo: PuntoTendenciaBenchmarking[];
  tonalidad: TonalidadPorProyecto[];
  categorías: CategoríasPorProyecto[];
  resumen: ResumenBenchmarking;
};

export type SolicitudCrearTicket = {
  userId: string;
  tipoError: string;
  seccion: string;
  prioridad: string;
  descripcion: string;
};

// ─── Agenda / calendario ─────────────────────────────────────────────────────

export type TipoEventoAgenda = "campaña" | "cita" | "evento";

export type EventoAgenda = {
  id: string;
  título: string;
  tipo: TipoEventoAgenda;
  fecha: string; // ISO date YYYY-MM-DD
};

export type RangoFechas = {
  inicio: string; // ISO date YYYY-MM-DD
  fin: string; // ISO date YYYY-MM-DD
};

// ─── Multitenant / organizaciones ────────────────────────────────────────────

export type Organizacion = {
  id: string;
  nombre: string;
  slug: string;
};

// ─── Notificaciones ──────────────────────────────────────────────────────────

export type TipoNotificacion = "alerta" | "mencion" | "reporte" | "sistema";

export type Notificacion = {
  id: string;
  tipo: TipoNotificacion;
  título: string;
  mensaje: string;
  creadaEn: string; // ISO 8601
  leida: boolean;
  href?: string;
};

// ─── Proyectos ───────────────────────────────────────────────────────────────

export type TipoProyecto =
  | "influencer"
  | "agencia"
  | "politico"
  | "marca"
  | "figura_publica"
  | "otro";

export type RedSocialProyecto =
  | "x"
  | "facebook"
  | "instagram"
  | "tiktok"
  | "google_analytics";

export type FuenteNoticiaPersonalizada = {
  id: string;
  url: string;
  nombre?: string;
};

// Tres categorías reales (2026-09-29) en vez de una lista plana sin límite —
// el formulario viejo dejaba pegar decenas de palabras clave sueltas, y con
// suficientes términos cortos/genéricos ("GPO", "CAMe"...) terminaba trayendo
// contenido real pero ajeno al proyecto (caso real: SEMARNAT, ver
// project_youtube_query_fix). "nombre" alimenta project.main_topic en el
// backend — siempre debe llevar al menos uno.
export type TipoPalabraClave = "nombre" | "red_social" | "busqueda";

export type PalabraClaveProyecto = {
  palabra: string;
  tipo: TipoPalabraClave;
};

export const TOPES_PALABRAS_CLAVE: Record<TipoPalabraClave, number> = {
  nombre: 5,
  red_social: 6,
  busqueda: 5,
};

export type EstadoProyecto = "activo" | "inactivo";

export type Proyecto = {
  id: string;
  numero: number;
  nombre: string;
  iniciales: string;
  ubicacion: string;
  idioma: string;
  palabraClave: string;
  descripcion: string;
  analisis: number;
  ultimoAnalisis: string; // ISO date
  gradienteInicio: string;
  gradienteFin: string;
  tipo: TipoProyecto;
  estado: EstadoProyecto;
  imagenUrl?: string | null;
  palabrasClave: string[];
  /** Solo la trae obtenerProyectoRealCompleto (precarga del formulario de edición) — con el tipo real de cada una para repartirlas en las 3 secciones. Ausente en la lista/tarjetas. */
  palabrasClaveTipadas?: PalabraClaveProyecto[];
  paises: string[];
  /** Entidades federativas cuando el alcance incluye México. */
  estadosMexico: string[];
  idiomas: string[];
  redesConectadas: RedSocialProyecto[];
  fuentesNoticias: FuenteNoticiaPersonalizada[];
};

export type SolicitudCrearProyecto = {
  nombre: string;
  descripcion: string;
  tipo: TipoProyecto;
  imagenUrl?: string | null;
  palabrasClave: PalabraClaveProyecto[];
  paises: string[];
  estadosMexico: string[];
  idiomas: string[];
  redesConectadas: RedSocialProyecto[];
  fuentesNoticias: Omit<FuenteNoticiaPersonalizada, "id">[];
};

export type RespuestaCrearProyecto = {
  mensaje: string;
  proyecto: Proyecto;
};

export type SolicitudActualizarProyecto = SolicitudCrearProyecto;

export type RespuestaActualizarProyecto = {
  mensaje: string;
  proyecto: Proyecto;
};

export type RespuestaEliminarProyecto = {
  mensaje: string;
  id: string;
};

export type SolicitudCambiarEstadoProyecto = {
  estado: EstadoProyecto;
};

export type RespuestaCambiarEstadoProyecto = {
  mensaje: string;
  proyecto: Proyecto;
};

export type ResumenProyectos = {
  activos: number;
  analisisRealizados: number;
  alertasActivas: number;
  usados: number;
  limite: number;
};

/** Alertas de crisis visibles en tarjetas de proyecto (mock / contrato). */
export type TipoAlertaCrisis =
  | "ninguna"
  | "aumento_menciones_negativas"
  | "crecimiento_fake_news"
  | "menciones_negativas";

/** Métricas resumidas por proyecto para la vista de listado (Dashboard). */
export type MetricasVistaProyecto = {
  sentimientoPorcentaje: number;
  alertaCrisis: TipoAlertaCrisis;
};

// ─── Panel general (/proyectos) — solo los campos con respaldo real ──────────
// Tráfico/tonalidad por canal se detectan por dominio de URL (ver
// menciones-backend.ts). El resto (alcance por fuente, trending topics,
// palabras clave, países, imágenes/video) no tiene dato real detrás hoy —
// se muestra como "Próximamente" en vez de inventar cifras.

export type SerieSemanalPanel = {
  total: number;
  cambio: number | null;
  /** Delta real actual - anterior; se muestra cuando `cambio` es null (nunca "N/D"). */
  cambioAbsoluto?: number;
  // Largo variable a propósito (2026-09-30): sin rango elegido son 30 días,
  // con rango elegido es el período exacto — ya no está atado a "siempre 7
  // días" (ver calcularResumenMenciones/calcularResumenAlcance).
  dias: readonly number[];
  período?: { inicio: string; fin: string };
};

export type TraficoFuentePanel = {
  id: TipoFuenteMención;
  fuente: string;
  menciones: string;
  porcentaje: number;
  color: string;
};

export type TonalidadFuentePanel = {
  fuente: string;
  positivo: number;
  negativo: number;
  neutro: number;
  sinCalificar: number;
};

export type MetricasProyectoPanel = {
  positivo: number;
  negativo: number;
  neutro: number;
  favorabilidad: number;
  mencionesSemana: readonly [number, number, number, number, number, number, number];
  alcance: number;
  alertas: number;
  menciones: number;
  clasificadas: number;
  alertaCrisis: TipoAlertaCrisis;
  // Reales, calculados sobre las menciones del proyecto (no config): las dos
  // fuentes que más publican y los dos temas que más se repiten.
  fuentesPrincipales: string[];
  temasPrincipales: string[];
};

export type RespuestaPanelGeneral = {
  proyectoId: string | null;
  // Cuentas plan "basic" solo ven los últimos 7 días — `activo: true` cuando
  // el backend tuvo que acotar el rango pedido (o el default) por eso.
  límiteHistórico?: { activo: boolean; días: number };
  menciones: SerieSemanalPanel;
  sentimiento: {
    positivo: number;
    negativo: number;
    neutro: number;
    favorabilidad: number;
    clasificadas: number;
    total: number;
  };
  alertas: { id: string; nivel: "critica" | "advertencia" | "info"; mensaje: string }[];
  trafico: TraficoFuentePanel[];
  tonalidad: TonalidadFuentePanel[];
  // Widgets reales agregados en esta iteración — todos calculados a partir
  // de menciones/alertas reales (ver menciones-backend.ts), sin datos mock.
  alcanceTotal: SerieSemanalPanel;
  alcancePorFuente: {
    posicion: number;
    fuente: string;
    alcance: number;
    cambioPorcentaje: number | null; // null = "N/D", sin período anterior real que comparar
    porcentajeTotal: number;
  }[];
  regiones: { region: string; menciones: number }[];
  tendencias: { posicion: number; nombre: string; cambio: number; url: string | null; menciones?: MenciónEditorial[] }[];
  palabrasClave: { palabra: string; efectividad: "Positivo" | "Neutro" | "Negativo" }[];
  video: { id: string; imagenUrl: string; fuente: string; referencia: string; url: string }[];
  // Total real de menciones con imagen/video elegibles ANTES de cortar a lo
  // que se muestra en `video` — para no mostrar "18 de 18" cuando en
  // realidad hay cientos (ver comentario en calcularVideoReal).
  videoTotal: number;
  tendenciaAlcance: { fecha: number; actual: number; anterior: number }[];
  tendenciaMencionesAlcance: { menciones: number; alcance: number }[];
  rendimiento: { proyectoId: string; nombre: string; x: number; y: number; z: number }[];
  metricasPorProyecto: Record<string, MetricasProyectoPanel>;
  nssPorTema: NssPorTema[];
  topEmisores: EmisorVolumen[];
};

// NSS (Net Sentiment Score) real por narrativa detectada por la IA — ver
// getNssPorNarrativaByProject en sentiment-api/db.js.
export type NssPorTema = { tema: string; nss: number; n: number };

// Top emisores por volumen real de menciones (autor/fuente) — calculado en
// el propio Next.js a partir de MenciónEditorial.autor, sin llamada extra al backend.
export type EmisorVolumen = { emisor: string; menciones: number };

// ─── Análisis rápido (buscador del Dashboard) ────────────────────────────────
// Crea un proyecto a partir de un tema libre y dispara el análisis real
// (ingesta + búsquedas en vivo + IA) sobre él en un solo paso.

export type SolicitudAnalizarConversacion = { tema: string };

export type RespuestaAnalizarConversacion = {
  mensaje: string;
  proyecto: Proyecto;
};

export type RegiónCuotaVoz = {
  id: string;
  nombre: string;
  menciones: number;
};

/** Recorte geográfico del mapa de cuota de voz, según países del proyecto. */
export type AlcanceMapaNarrativas = "mexico" | "espana" | "mundo";

export type RangoEdadNarrativas = {
  id: string;
  rango: string;
  femenino: number;
  masculino: number;
};

export type SegmentoGéneroNarrativas = {
  id: GéneroComentarios;
  comentarios: number;
  porcentaje: number;
};

export type RespuestaNarrativas = {
  período: {
    inicio: string;
    fin: string;
  };
  hashtags: TérminoNubeNarrativas[];
  frasesClave: TérminoNubeNarrativas[];
  edad: RangoEdadNarrativas[];
  género: SegmentoGéneroNarrativas[];
  mapa: {
    alcance: AlcanceMapaNarrativas;
  };
  regiones: RegiónCuotaVoz[];
  fuentes: FuenteAlcanceNarrativas[];
  resumen: ResumenIaNarrativas;
};

export type TérminoNubeNarrativas = {
  id: string;
  texto: string;
  menciones: number;
};

export type FuenteAlcanceNarrativas = {
  id: string;
  fuente: string;
  alcance: number;
  porcentaje: number;
};

export type GéneroComentarios = "femenino" | "masculino";

export type ResumenIaNarrativas = {
  menciones: number;
  alcance: number;
  cuotaVoz: number;
  lectura: string[];
};
