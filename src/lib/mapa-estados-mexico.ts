// Códigos reales (3 letras) de los 32 estados — verificados contra
// public/data/mexico-estados.json (el GeoJSON real que ya usa el mapa de
// Narrativas), no inventados. Incluye alias comunes (con/sin acento, CDMX,
// nombres cortos) porque el texto real que llega de `projects.region` en la
// base de datos no sigue un catálogo fijo.
const CÓDIGO_POR_NOMBRE: Record<string, string> = {
  "aguascalientes": "AGU",
  "baja california": "BCN",
  "baja california norte": "BCN",
  "baja california sur": "BCS",
  "campeche": "CAM",
  "chiapas": "CHP",
  "chihuahua": "CHH",
  "ciudad de mexico": "CMX",
  "cdmx": "CMX",
  "distrito federal": "CMX",
  "df": "CMX",
  "coahuila": "COA",
  "coahuila de zaragoza": "COA",
  "colima": "COL",
  "durango": "DUR",
  "estado de mexico": "MEX",
  "edomex": "MEX",
  "mexico": "MEX",
  "guanajuato": "GUA",
  "guerrero": "GRO",
  "hidalgo": "HID",
  "jalisco": "JAL",
  "michoacan": "MIC",
  "michoacan de ocampo": "MIC",
  "morelos": "MOR",
  "nayarit": "NAY",
  "nuevo leon": "NLE",
  "oaxaca": "OAX",
  "puebla": "PUE",
  "queretaro": "QUE",
  "quintana roo": "ROO",
  "san luis potosi": "SLP",
  "sinaloa": "SIN",
  "sonora": "SON",
  "tabasco": "TAB",
  "tamaulipas": "TAM",
  "tlaxcala": "TLA",
  "veracruz": "VER",
  "veracruz de ignacio de la llave": "VER",
  "yucatan": "YUC",
  "zacatecas": "ZAC",
};

// Población real por estado (Censo INEGI 2020, redondeada) — se usa SOLO
// como peso para repartir visualmente, en el mapa, el total de un proyecto
// que declara cobertura en varios estados a la vez sin dato real de cuántas
// menciones tocó cada uno (pedido explícito del cliente, 2026-10-01: que
// los estados del mapa no se vean todos con el mismo número, sino
// repartidos de forma que sumen el total real). NO es un conteo real de
// menciones por estado — es una distribución estimada por tamaño de
// población, más razonable que repartir parejo entre los estados.
const POBLACIÓN_POR_CÓDIGO: Record<string, number> = {
  AGU: 1_425_607,
  BCN: 3_769_020,
  BCS: 798_447,
  CAM: 928_363,
  CHP: 5_543_828,
  CHH: 3_741_869,
  CMX: 9_209_944,
  COA: 3_146_771,
  COL: 731_391,
  DUR: 1_832_650,
  MEX: 16_992_418,
  GUA: 6_166_934,
  GRO: 3_540_685,
  HID: 3_082_841,
  JAL: 8_348_151,
  MIC: 4_748_846,
  MOR: 1_971_520,
  NAY: 1_235_456,
  NLE: 5_784_442,
  OAX: 4_132_148,
  PUE: 6_583_278,
  QUE: 2_368_467,
  ROO: 1_857_985,
  SLP: 2_822_255,
  SIN: 3_026_943,
  SON: 2_944_840,
  TAB: 2_402_598,
  TAM: 3_527_735,
  TLA: 1_342_977,
  VER: 8_062_579,
  YUC: 2_320_898,
  ZAC: 1_622_138,
};

/** Peso real (población) de un estado por su código — 1 como mínimo para que nunca quede en 0 ni rompa un reparto por peso. */
export function pesoPoblaciónEstado(código: string): number {
  return POBLACIÓN_POR_CÓDIGO[código] ?? 1;
}

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Código real (3 letras) de un estado mexicano a partir de su nombre, o null si no se reconoce. */
export function resolverCódigoEstado(nombre: string): string | null {
  return CÓDIGO_POR_NOMBRE[normalizar(nombre)] ?? null;
}

export const RUTA_GEOJSON_MEXICO = "/data/mexico-estados.json";
