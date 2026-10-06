import { resolverAlcanceMapa } from "@/lib/mapa-narrativas";
import type {
  AlcanceMapaNarrativas,
  RangoEdadNarrativas,
  RegiónCuotaVoz,
  RespuestaNarrativas,
  SegmentoGéneroNarrativas,
} from "@/types";

const HASHTAGS_BASE = [
  { id: "poramorpuebla", texto: "#poramorpuebla", menciones: 18_400 },
  { id: "puebla", texto: "#puebla", menciones: 14_200 },
  { id: "sheinbaum", texto: "#sheinbaum", menciones: 11_800 },
  { id: "armenta", texto: "#armenta", menciones: 9_650 },
  { id: "cdmx", texto: "#cdmx", menciones: 8_410 },
  { id: "seguridad", texto: "#seguridad", menciones: 7_220 },
  { id: "infraestructura", texto: "#infraestructura", menciones: 6_140 },
  { id: "elecciones", texto: "#elecciones", menciones: 5_380 },
  { id: "movilidad", texto: "#movilidad", menciones: 4_260 },
  { id: "transparencia", texto: "#transparencia", menciones: 3_890 },
  { id: "salud", texto: "#salud", menciones: 3_210 },
  { id: "educacion", texto: "#educación", menciones: 2_740 },
  { id: "medioambiente", texto: "#medioambiente", menciones: 2_180 },
  { id: "justicia", texto: "#justicia", menciones: 1_760 },
];

const FRASES_BASE = [
  { id: "ordenes", texto: "órdenes de gobierno", menciones: 12_400 },
  { id: "libertad", texto: "libertad de expresión", menciones: 9_870 },
  { id: "multas", texto: "multas de tránsito", menciones: 8_150 },
  { id: "maxima", texto: "máxima autoridad", menciones: 7_420 },
  { id: "presupuesto", texto: "presupuesto participativo", menciones: 6_330 },
  { id: "obra", texto: "obra pública", menciones: 5_810 },
  { id: "seguridad-f", texto: "seguridad ciudadana", menciones: 5_240 },
  { id: "percepcion", texto: "percepción ciudadana", menciones: 4_680 },
  { id: "desinformacion", texto: "desinformación", menciones: 4_120 },
  { id: "rendicion", texto: "rendición de cuentas", menciones: 3_540 },
  { id: "servicio", texto: "servicio público", menciones: 2_980 },
  { id: "crisis", texto: "manejo de crisis", menciones: 2_410 },
];

const REGIONES_MEXICO: { id: string; nombre: string; menciones: number }[] = [
  { id: "CMX", nombre: "Ciudad de México", menciones: 274_000 },
  { id: "MEX", nombre: "Estado de México", menciones: 118_500 },
  { id: "JAL", nombre: "Jalisco", menciones: 83_060 },
  { id: "NLE", nombre: "Nuevo León", menciones: 61_850 },
  { id: "PUE", nombre: "Puebla", menciones: 41_110 },
  { id: "VER", nombre: "Veracruz", menciones: 29_120 },
  { id: "GUA", nombre: "Guanajuato", menciones: 24_800 },
  { id: "CHH", nombre: "Chihuahua", menciones: 18_640 },
  { id: "BCN", nombre: "Baja California", menciones: 16_210 },
  { id: "MIC", nombre: "Michoacán", menciones: 14_980 },
  { id: "OAX", nombre: "Oaxaca", menciones: 13_420 },
  { id: "CHP", nombre: "Chiapas", menciones: 12_110 },
  { id: "TAM", nombre: "Tamaulipas", menciones: 11_040 },
  { id: "COA", nombre: "Coahuila", menciones: 10_280 },
  { id: "SON", nombre: "Sonora", menciones: 9_760 },
  { id: "SIN", nombre: "Sinaloa", menciones: 8_940 },
  { id: "GRO", nombre: "Guerrero", menciones: 8_210 },
  { id: "QUE", nombre: "Querétaro", menciones: 7_640 },
  { id: "HID", nombre: "Hidalgo", menciones: 6_880 },
  { id: "SLP", nombre: "San Luis Potosí", menciones: 6_210 },
  { id: "YUC", nombre: "Yucatán", menciones: 5_740 },
  { id: "TAB", nombre: "Tabasco", menciones: 5_180 },
  { id: "MOR", nombre: "Morelos", menciones: 4_620 },
  { id: "DUR", nombre: "Durango", menciones: 4_110 },
  { id: "ZAC", nombre: "Zacatecas", menciones: 3_840 },
  { id: "AGU", nombre: "Aguascalientes", menciones: 3_520 },
  { id: "NAY", nombre: "Nayarit", menciones: 3_180 },
  { id: "CAM", nombre: "Campeche", menciones: 2_940 },
  { id: "ROO", nombre: "Quintana Roo", menciones: 2_710 },
  { id: "TLA", nombre: "Tlaxcala", menciones: 2_480 },
  { id: "COL", nombre: "Colima", menciones: 2_120 },
  { id: "BCS", nombre: "Baja California Sur", menciones: 1_860 },
];

const REGIONES_ESPANA: { id: string; nombre: string; menciones: number }[] = [
  { id: "MD", nombre: "Madrid", menciones: 91_400 },
  { id: "CT", nombre: "Cataluña", menciones: 74_200 },
  { id: "AN", nombre: "Andalucía", menciones: 62_800 },
  { id: "VC", nombre: "Comunitat Valenciana", menciones: 41_150 },
  { id: "PV", nombre: "País Vasco", menciones: 28_640 },
  { id: "GA", nombre: "Galicia", menciones: 22_310 },
  { id: "CL", nombre: "Castilla y León", menciones: 18_420 },
  { id: "CM", nombre: "Castilla-La Mancha", menciones: 14_870 },
  { id: "CN", nombre: "Canarias", menciones: 13_210 },
  { id: "IB", nombre: "Baleares", menciones: 11_040 },
  { id: "AR", nombre: "Aragón", menciones: 9_760 },
  { id: "MC", nombre: "Murcia", menciones: 8_940 },
  { id: "AS", nombre: "Asturias", menciones: 7_620 },
  { id: "EX", nombre: "Extremadura", menciones: 6_410 },
  { id: "NC", nombre: "Navarra", menciones: 5_880 },
  { id: "CB", nombre: "Cantabria", menciones: 4_210 },
  { id: "RI", nombre: "La Rioja", menciones: 3_180 },
  { id: "CE", nombre: "Ceuta", menciones: 1_240 },
  { id: "ML", nombre: "Melilla", menciones: 1_080 },
];

const ISO2_A_ISO3: Record<string, string> = {
  MX: "MEX",
  US: "USA",
  ES: "ESP",
  AR: "ARG",
  CO: "COL",
  CL: "CHL",
  PE: "PER",
  BR: "BRA",
};

const PAISES_MUNDO: {
  id: string;
  iso2?: string;
  nombre: string;
  menciones: number;
}[] = [
  { id: "MEX", iso2: "MX", nombre: "México", menciones: 274_000 },
  { id: "USA", iso2: "US", nombre: "Estados Unidos", menciones: 198_000 },
  { id: "ESP", iso2: "ES", nombre: "España", menciones: 156_000 },
  { id: "BRA", iso2: "BR", nombre: "Brasil", menciones: 121_000 },
  { id: "COL", iso2: "CO", nombre: "Colombia", menciones: 84_500 },
  { id: "ARG", iso2: "AR", nombre: "Argentina", menciones: 71_200 },
  { id: "CHL", iso2: "CL", nombre: "Chile", menciones: 48_300 },
  { id: "PER", iso2: "PE", nombre: "Perú", menciones: 39_800 },
  { id: "GBR", nombre: "Reino Unido", menciones: 28_400 },
  { id: "FRA", nombre: "Francia", menciones: 24_100 },
  { id: "DEU", nombre: "Alemania", menciones: 19_600 },
  { id: "CAN", nombre: "Canadá", menciones: 16_200 },
  { id: "ITA", nombre: "Italia", menciones: 14_800 },
  { id: "PRT", nombre: "Portugal", menciones: 11_300 },
];

const EDAD_BASE: Omit<RangoEdadNarrativas, "id">[] = [
  { rango: "18-24", femenino: 38_200, masculino: 26_100 },
  { rango: "25-34", femenino: 52_400, masculino: 36_200 },
  { rango: "35-44", femenino: 41_100, masculino: 29_400 },
  { rango: "45-54", femenino: 28_600, masculino: 21_300 },
  { rango: "55-64", femenino: 19_800, masculino: 14_200 },
  { rango: "65+", femenino: 11_900, masculino: 8_400 },
];

const FUENTES_BASE = [
  { id: "x", fuente: "X", alcance: 3_510_000 },
  { id: "facebook", fuente: "Facebook", alcance: 2_910_000 },
  { id: "instagram", fuente: "Instagram", alcance: 1_840_000 },
  { id: "noticias", fuente: "Noticias", alcance: 1_420_000 },
  { id: "youtube", fuente: "YouTube", alcance: 980_000 },
  { id: "tiktok", fuente: "TikTok", alcance: 760_000 },
  { id: "blogs", fuente: "Blogs", alcance: 410_000 },
];

function semillaDe(ids: string[]): number {
  const clave = ids.slice().sort().join("|");
  let hash = 0;
  for (let i = 0; i < clave.length; i++) {
    hash = (hash * 31 + clave.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function factor(ids: string[], índice: number, semilla: number): number {
  const n = Math.max(ids.length, 1);
  const variación = 0.82 + ((semilla + índice * 19) % 37) / 100;
  return n * 0.35 * variación;
}

export function formatearCifraCompacta(valor: number): string {
  if (valor >= 1_000_000_000) {
    return `${(valor / 1_000_000_000).toFixed(1)}B`;
  }
  if (valor >= 1_000_000) {
    return `${(valor / 1_000_000).toFixed(valor >= 10_000_000 ? 0 : 1)}M`;
  }
  if (valor >= 1_000) {
    return `${(valor / 1_000).toFixed(valor >= 10_000 ? 0 : 1)}K`;
  }
  return valor.toLocaleString("es-MX");
}

export function construirTextoResumenIaNarrativas(
  datos: RespuestaNarrativas,
  alcance: string,
): string {
  const topHashtag = datos.hashtags[0];
  const topFrase = datos.frasesClave[0];
  const topRegión = [...datos.regiones].sort(
    (a, b) => b.menciones - a.menciones,
  )[0];
  const topFuente = datos.fuentes[0];

  return (
    `En ${alcance}, la conversación se concentra en ${topHashtag?.texto ?? "hashtags emergentes"} ` +
    `y en la frase “${topFrase?.texto ?? "temas clave"}”. ` +
    `${topRegión?.nombre ?? "Varias entidades"} concentra la mayor cuota de voz ` +
    `(${datos.resumen.cuotaVoz.toFixed(1)}%) y ${topFuente?.fuente ?? "las redes"} lidera el alcance.`
  );
}

export function chipsResumenIaNarrativas(datos: RespuestaNarrativas): {
  etiqueta: string;
  valor: string;
}[] {
  return [
    {
      etiqueta: "Menciones",
      valor: formatearCifraCompacta(datos.resumen.menciones),
    },
    {
      etiqueta: "Alcance",
      valor: formatearCifraCompacta(datos.resumen.alcance),
    },
    {
      etiqueta: "Cuota de voz",
      valor: `${datos.resumen.cuotaVoz.toFixed(1)}%`,
    },
  ];
}

function segmentosGéneroDesdeEdad(
  rangos: RangoEdadNarrativas[],
): SegmentoGéneroNarrativas[] {
  const femenino = rangos.reduce((suma, item) => suma + item.femenino, 0);
  const masculino = rangos.reduce((suma, item) => suma + item.masculino, 0);
  const total = femenino + masculino;
  const porcentaje = (parte: number) =>
    total ? Math.round((parte / total) * 1000) / 10 : 0;

  return [
    { id: "femenino", comentarios: femenino, porcentaje: porcentaje(femenino) },
    {
      id: "masculino",
      comentarios: masculino,
      porcentaje: porcentaje(masculino),
    },
  ];
}

function catálogoRegiones(
  alcance: AlcanceMapaNarrativas,
  paises: string[],
): { id: string; nombre: string; menciones: number }[] {
  if (alcance === "mexico") return REGIONES_MEXICO;
  if (alcance === "espana") return REGIONES_ESPANA;

  const iso2 = new Set(paises.map((código) => código.toUpperCase()));
  const idsPrioritarios = new Set(
    [...iso2].map((código) => ISO2_A_ISO3[código]).filter(Boolean),
  );

  return PAISES_MUNDO.filter((país) => {
    if (idsPrioritarios.size === 0) return true;
    if (idsPrioritarios.has(país.id)) return true;
    return !país.iso2;
  }).map((país) => ({
    id: país.id,
    nombre: país.nombre,
    menciones: idsPrioritarios.has(país.id)
      ? país.menciones
      : Math.round(país.menciones * 0.18),
  }));
}

/** Reutilizado por otros mocks (ej. infografía) que necesitan el mismo mapa de regiones. */
export function generarRegionesMock(
  alcance: AlcanceMapaNarrativas,
  paises: string[],
  ids: string[],
  semilla: number,
): RegiónCuotaVoz[] {
  return catálogoRegiones(alcance, paises).map((item, índice) => ({
    ...item,
    menciones: Math.max(
      40,
      Math.round(item.menciones * factor(ids, índice + 3, semilla)),
    ),
  }));
}

export function obtenerNarrativasMock(
  proyectoIds: string[],
  paises: string[] = ["MX"],
): RespuestaNarrativas {
  const semilla = semillaDe(proyectoIds);
  const alcance = resolverAlcanceMapa(paises);
  const hashtags = HASHTAGS_BASE.map((item, índice) => ({
    ...item,
    menciones: Math.max(
      120,
      Math.round(item.menciones * factor(proyectoIds, índice, semilla)),
    ),
  })).sort((a, b) => b.menciones - a.menciones);

  const frasesClave = FRASES_BASE.map((item, índice) => ({
    ...item,
    menciones: Math.max(
      80,
      Math.round(item.menciones * factor(proyectoIds, índice + 8, semilla)),
    ),
  })).sort((a, b) => b.menciones - a.menciones);

  const edad: RangoEdadNarrativas[] = EDAD_BASE.map((item, índice) => ({
    id: item.rango,
    rango: item.rango,
    femenino: Math.max(
      40,
      Math.round(item.femenino * factor(proyectoIds, índice + 21, semilla)),
    ),
    masculino: Math.max(
      30,
      Math.round(item.masculino * factor(proyectoIds, índice + 27, semilla)),
    ),
  }));
  const género = segmentosGéneroDesdeEdad(edad);

  const regiones = generarRegionesMock(alcance, paises, proyectoIds, semilla);

  const fuentesRaw = FUENTES_BASE.map((item, índice) => ({
    ...item,
    alcance: Math.max(
      1_000,
      Math.round(item.alcance * factor(proyectoIds, índice + 11, semilla)),
    ),
  })).sort((a, b) => b.alcance - a.alcance);

  const alcanceTotal = fuentesRaw.reduce(
    (suma, item) => suma + item.alcance,
    0,
  );
  const fuentes = fuentesRaw.map((item) => ({
    ...item,
    porcentaje: alcanceTotal
      ? Math.round((item.alcance / alcanceTotal) * 1000) / 10
      : 0,
  }));

  const menciones = regiones.reduce((suma, item) => suma + item.menciones, 0);
  const topRegión = [...regiones].sort((a, b) => b.menciones - a.menciones)[0];
  const cuotaVoz = menciones ? (topRegión.menciones / menciones) * 100 : 0;

  return {
    período: { inicio: "2026-05-27", fin: "2026-08-25" },
    hashtags,
    frasesClave,
    edad,
    género,
    mapa: { alcance },
    regiones,
    fuentes,
    resumen: {
      menciones,
      alcance: alcanceTotal,
      cuotaVoz,
      lectura: [
        `${topRegión.nombre} concentra la mayor cuota de voz con ${formatearCifraCompacta(topRegión.menciones)} menciones.`,
        `El hashtag ${hashtags[0]?.texto ?? "—"} y la frase “${frasesClave[0]?.texto ?? "—"}” articulan la narrativa dominante.`,
        `${fuentes[0]?.fuente ?? "X"} aporta el mayor alcance (${fuentes[0]?.porcentaje ?? 0}% del total).`,
      ],
    },
  };
}
