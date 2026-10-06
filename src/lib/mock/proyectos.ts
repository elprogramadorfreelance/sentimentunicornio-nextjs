import type {
  EstadoProyecto,
  Proyecto,
  ResumenProyectos,
  SolicitudActualizarProyecto,
  SolicitudCrearProyecto,
  TipoProyecto,
} from "@/types";

export type { Proyecto };

const GRADIENTES = [
  ["#4353CC", "#6B3AC9"],
  ["#BF1A8A", "#9B3DC5"],
  ["#1A9E6A", "#2DB876"],
  ["#C4370A", "#E05A1C"],
  ["#0B5EA8", "#1BB8E1"],
  ["#0056A4", "#1F3C7A"],
  ["#6C1AD9", "#1BB8E1"],
] as const;

export const ETIQUETAS_TIPO_PROYECTO: Record<TipoProyecto, string> = {
  influencer: "Influencer",
  agencia: "Agencia",
  politico: "Político",
  marca: "Marca",
  figura_publica: "Figura pública",
  otro: "Otro",
};

export function inicialesDesdeNombre(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0] ?? ""}${partes[1][0] ?? ""}`.toUpperCase();
}

export function gradienteDesdeNombre(nombre: string): {
  inicio: string;
  fin: string;
} {
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
    hash = (hash * 31 + nombre.charCodeAt(i)) >>> 0;
  }
  const [inicio, fin] = GRADIENTES[hash % GRADIENTES.length];
  return { inicio, fin };
}

const SEMILLA: Omit<Proyecto, "estado">[] = [
  {
    id: "adrian-rubalcava",
    numero: 1,
    nombre: "Adrián Rubalcava Suárez",
    iniciales: "AR",
    ubicacion: "México",
    idioma: "Español",
    palabraClave: "Preferencias",
    descripcion:
      "Monitoreo continuo de percepción y menciones en medios digitales y redes sociales.",
    analisis: 2,
    ultimoAnalisis: "2026-07-03",
    gradienteInicio: "#4353CC",
    gradienteFin: "#6B3AC9",
    tipo: "politico",
    palabrasClave: ["Preferencias"],
    paises: ["MX"],
    estadosMexico: ["CMX", "MEX", "JAL"],
    idiomas: ["es"],
    redesConectadas: ["x", "facebook"],
    fuentesNoticias: [],
  },
  {
    id: "maru-campos",
    numero: 2,
    nombre: "Maru Campos",
    iniciales: "MC",
    ubicacion: "México",
    idioma: "Español",
    palabraClave: "Maru Campos ante la FGR caso CIA",
    descripcion:
      "Monitoreo de riesgo reputacional y menciones nacionales en tiempo real.",
    analisis: 4,
    ultimoAnalisis: "2026-06-23",
    gradienteInicio: "#BF1A8A",
    gradienteFin: "#9B3DC5",
    tipo: "politico",
    palabrasClave: ["Maru Campos ante la FGR caso CIA"],
    paises: ["MX"],
    estadosMexico: ["CHH"],
    idiomas: ["es"],
    redesConectadas: ["x"],
    fuentesNoticias: [],
  },
  {
    id: "alejandro-armenta",
    numero: 3,
    nombre: "Alejandro Armenta",
    iniciales: "AA",
    ubicacion: "México",
    idioma: "Español",
    palabraClave: "Alejandro Armenta gobernador de Puebla",
    descripcion: "Seguimiento de conversación pública y medios de Puebla.",
    analisis: 2,
    ultimoAnalisis: "2026-06-24",
    gradienteInicio: "#1A9E6A",
    gradienteFin: "#2DB876",
    tipo: "politico",
    palabrasClave: ["Alejandro Armenta gobernador de Puebla"],
    paises: ["MX"],
    estadosMexico: ["PUE"],
    idiomas: ["es"],
    redesConectadas: ["x", "facebook", "instagram"],
    fuentesNoticias: [],
  },
  {
    id: "campana-morena-q3",
    numero: 4,
    nombre: "Campaña Morena Q3",
    iniciales: "CM",
    ubicacion: "México",
    idioma: "Español",
    palabraClave: "Morena elecciones 2026",
    descripcion:
      "Análisis de sentimiento y cobertura mediática de la campaña nacional rumbo a las elecciones intermedias.",
    analisis: 7,
    ultimoAnalisis: "2026-07-10",
    gradienteInicio: "#C4370A",
    gradienteFin: "#E05A1C",
    tipo: "agencia",
    palabrasClave: ["Morena elecciones 2026"],
    paises: ["MX"],
    estadosMexico: [
      "AGU",
      "BCN",
      "BCS",
      "CAM",
      "CHP",
      "CHH",
      "CMX",
      "COA",
      "COL",
      "DUR",
      "GUA",
      "GRO",
      "HID",
      "JAL",
      "MEX",
      "MIC",
      "MOR",
      "NAY",
      "NLE",
      "OAX",
      "PUE",
      "QUE",
      "ROO",
      "SLP",
      "SIN",
      "SON",
      "TAB",
      "TAM",
      "TLA",
      "VER",
      "YUC",
      "ZAC",
    ],
    idiomas: ["es"],
    redesConectadas: ["x", "tiktok"],
    fuentesNoticias: [],
  },
  {
    id: "claudia-sheinbaum",
    numero: 5,
    nombre: "Claudia Sheinbaum",
    iniciales: "CS",
    ubicacion: "México",
    idioma: "Español",
    palabraClave: "Sheinbaum aprobación julio",
    descripcion:
      "Tracking de aprobación presidencial y cobertura en medios nacionales e internacionales.",
    analisis: 12,
    ultimoAnalisis: "2026-07-18",
    gradienteInicio: "#0B5EA8",
    gradienteFin: "#1BB8E1",
    tipo: "figura_publica",
    palabrasClave: ["Sheinbaum aprobación julio"],
    paises: ["MX"],
    estadosMexico: ["CMX", "MEX"],
    idiomas: ["es", "en"],
    redesConectadas: ["x", "facebook", "instagram"],
    fuentesNoticias: [],
  },
];

/** Store en memoria para el mock API (dev). */
let proyectosStore: Proyecto[] = SEMILLA.map((p) => ({
  ...p,
  estado: "activo" as const,
}));

export function obtenerProyectosMock(): Proyecto[] {
  return proyectosStore.map((p) => ({ ...p }));
}

export function obtenerResumenProyectosMock(): ResumenProyectos {
  const usados = proyectosStore.length;
  const activos = proyectosStore.filter((p) => p.estado === "activo").length;
  return {
    activos,
    analisisRealizados: proyectosStore.reduce((acc, p) => acc + p.analisis, 0),
    alertasActivas: 13,
    usados,
    limite: 10,
  };
}

const PAISES_ETIQUETA: Record<string, string> = {
  MX: "México",
  US: "Estados Unidos",
  ES: "España",
  AR: "Argentina",
  CO: "Colombia",
  CL: "Chile",
  PE: "Perú",
  BR: "Brasil",
};

const IDIOMAS_ETIQUETA: Record<string, string> = {
  es: "Español",
  en: "Inglés",
  fr: "Francés",
  pt: "Portugués",
};

export function crearProyectoMock(datos: SolicitudCrearProyecto): Proyecto {
  const numero =
    proyectosStore.reduce((max, p) => Math.max(max, p.numero), 0) + 1;
  const gradiente = gradienteDesdeNombre(datos.nombre);
  const id = `${datos.nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${numero}`;

  const proyecto: Proyecto = {
    id,
    numero,
    nombre: datos.nombre.trim(),
    iniciales: inicialesDesdeNombre(datos.nombre),
    ubicacion: datos.paises.map((c) => PAISES_ETIQUETA[c] ?? c).join(", "),
    idioma: datos.idiomas.map((i) => IDIOMAS_ETIQUETA[i] ?? i).join(", "),
    palabraClave: datos.palabrasClave.find((k) => k.tipo === "nombre")?.palabra ?? "",
    descripcion: datos.descripcion.trim(),
    analisis: 0,
    ultimoAnalisis: new Date().toISOString().slice(0, 10),
    gradienteInicio: gradiente.inicio,
    gradienteFin: gradiente.fin,
    tipo: datos.tipo,
    imagenUrl: datos.imagenUrl ?? null,
    palabrasClave: datos.palabrasClave.map((k) => k.palabra),
    paises: [...datos.paises],
    estadosMexico: datos.paises.includes("MX") ? [...datos.estadosMexico] : [],
    idiomas: [...datos.idiomas],
    redesConectadas: [...datos.redesConectadas],
    fuentesNoticias: datos.fuentesNoticias.map((f, i) => ({
      id: `fuente-${numero}-${i}`,
      url: f.url,
      nombre: f.nombre,
    })),
    estado: "activo",
  };

  proyectosStore = [proyecto, ...proyectosStore];
  return { ...proyecto };
}

export function obtenerProyectoPorIdMock(id: string): Proyecto | null {
  const proyecto = proyectosStore.find((p) => p.id === id);
  return proyecto ? { ...proyecto } : null;
}

export function actualizarProyectoMock(
  id: string,
  datos: SolicitudActualizarProyecto,
): Proyecto | null {
  const index = proyectosStore.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const actual = proyectosStore[index];
  const actualizado: Proyecto = {
    ...actual,
    nombre: datos.nombre.trim(),
    iniciales: inicialesDesdeNombre(datos.nombre),
    ubicacion: datos.paises.map((c) => PAISES_ETIQUETA[c] ?? c).join(", "),
    idioma: datos.idiomas.map((i) => IDIOMAS_ETIQUETA[i] ?? i).join(", "),
    palabraClave: datos.palabrasClave.find((k) => k.tipo === "nombre")?.palabra ?? "",
    descripcion: datos.descripcion.trim(),
    tipo: datos.tipo,
    imagenUrl: datos.imagenUrl ?? null,
    palabrasClave: datos.palabrasClave.map((k) => k.palabra),
    paises: [...datos.paises],
    estadosMexico: datos.paises.includes("MX") ? [...datos.estadosMexico] : [],
    idiomas: [...datos.idiomas],
    redesConectadas: [...datos.redesConectadas],
    fuentesNoticias: datos.fuentesNoticias.map((f, i) => {
      const existente = actual.fuentesNoticias.find((x) => x.url === f.url);
      return {
        id: existente?.id ?? `fuente-${actual.numero}-${i}`,
        url: f.url,
        nombre: f.nombre,
      };
    }),
  };

  proyectosStore = proyectosStore.map((p, i) =>
    i === index ? actualizado : p,
  );
  return { ...actualizado };
}

export function eliminarProyectoMock(id: string): boolean {
  const antes = proyectosStore.length;
  proyectosStore = proyectosStore.filter((p) => p.id !== id);
  return proyectosStore.length < antes;
}

export function cambiarEstadoProyectoMock(
  id: string,
  estado: EstadoProyecto,
): Proyecto | null {
  const index = proyectosStore.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const actualizado: Proyecto = { ...proyectosStore[index], estado };
  proyectosStore = proyectosStore.map((p, i) =>
    i === index ? actualizado : p,
  );
  return { ...actualizado };
}

/** @deprecated usar obtenerProyectosMock — se mantiene para imports existentes */
export const PROYECTOS_MOCK = SEMILLA;

/** @deprecated usar obtenerResumenProyectosMock */
export const RESUMEN_PROYECTOS = obtenerResumenProyectosMock();
