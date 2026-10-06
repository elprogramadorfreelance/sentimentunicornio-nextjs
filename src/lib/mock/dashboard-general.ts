import type { Proyecto } from "@/types";

// ─── Regiones con mayor presencia ────────────────────────────────────────────

export type RegionPresencia = {
  region: string;
  menciones: number;
};

const REGIONES_PRESENCIA_MOCK: RegionPresencia[] = [
  { region: "Ciudad de México", menciones: 274_000 },
  { region: "Estado de México", menciones: 118_500 },
  { region: "Jalisco", menciones: 83_060 },
  { region: "Nuevo León", menciones: 61_850 },
  { region: "Puebla", menciones: 41_110 },
  { region: "Veracruz", menciones: 29_120 },
];

export function obtenerRegionesPresenciaMock(): RegionPresencia[] {
  return REGIONES_PRESENCIA_MOCK;
}

// ─── Alcance potencial por tipo de fuente ────────────────────────────────────

export type FuentePotencial = {
  posicion: number;
  fuente: string;
  alcance: number;
  cambioPorcentaje: number | null; // null = "N/D", sin período anterior real que comparar
  porcentajeTotal: number;
};

const ALCANCE_POR_FUENTE_MOCK: FuentePotencial[] = [
  {
    posicion: 1,
    fuente: "Noticias: en línea",
    alcance: 5_760_000_000,
    cambioPorcentaje: 12.8,
    porcentajeTotal: 41.3,
  },
  {
    posicion: 2,
    fuente: "X",
    alcance: 3_510_000_000,
    cambioPorcentaje: 9.64,
    porcentajeTotal: 25.2,
  },
  {
    posicion: 3,
    fuente: "Facebook",
    alcance: 2_910_000_000,
    cambioPorcentaje: 18,
    porcentajeTotal: 20.8,
  },
  {
    posicion: 4,
    fuente: "Blogs",
    alcance: 1_140_000_000,
    cambioPorcentaje: 122,
    porcentajeTotal: 8.2,
  },
  {
    posicion: 5,
    fuente: "YouTube",
    alcance: 294_000_000,
    cambioPorcentaje: 2.11,
    porcentajeTotal: 2.11,
  },
  {
    posicion: 6,
    fuente: "Instagram",
    alcance: 277_000_000,
    cambioPorcentaje: 1.27,
    porcentajeTotal: 1.99,
  },
];

export function obtenerAlcancePorFuenteMock(): FuentePotencial[] {
  return ALCANCE_POR_FUENTE_MOCK;
}

/** Formato compacto tipo "5760M" / "1.1B" para cifras de alcance. */
export function formatearAlcanceCompacto(valor: number): string {
  if (valor >= 1_000_000_000) {
    return `${(valor / 1_000_000_000).toFixed(valor % 1_000_000_000 === 0 ? 0 : 1)}B`;
  }
  if (valor >= 1_000_000) {
    return `${(valor / 1_000_000).toFixed(valor % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (valor >= 1_000) {
    return `${(valor / 1_000).toFixed(valor % 1_000 === 0 ? 0 : 1)}K`;
  }
  return String(valor);
}

// ─── Tonalidad por tipo de fuente ────────────────────────────────────────────

export type TonalidadFuente = {
  fuente: string;
  positivo: number;
  negativo: number;
  neutro: number;
  sinCalificar: number;
};

const TONALIDAD_POR_FUENTE_MOCK: TonalidadFuente[] = [
  {
    fuente: "X",
    positivo: 222_000,
    neutro: 331_000,
    negativo: 135_000,
    sinCalificar: 18_000,
  },
  {
    fuente: "Facebook",
    positivo: 84_000,
    neutro: 96_000,
    negativo: 22_000,
    sinCalificar: 6_000,
  },
  {
    fuente: "Noticias: en línea",
    positivo: 41_000,
    neutro: 58_000,
    negativo: 19_000,
    sinCalificar: 4_000,
  },
  {
    fuente: "YouTube",
    positivo: 22_000,
    neutro: 15_000,
    negativo: 9_000,
    sinCalificar: 1_500,
  },
  {
    fuente: "Instagram",
    positivo: 18_000,
    neutro: 12_000,
    negativo: 3_000,
    sinCalificar: 900,
  },
  {
    fuente: "Blogs",
    positivo: 9_500,
    neutro: 7_200,
    negativo: 2_100,
    sinCalificar: 400,
  },
];

export function obtenerTonalidadPorFuenteMock(): TonalidadFuente[] {
  return TONALIDAD_POR_FUENTE_MOCK;
}

// ─── Tendencia de menciones y alcance ────────────────────────────────────────

export type PuntoTendenciaMencionesAlcance = {
  fecha?: string;
  menciones: number;
  alcance: number;
};

export function obtenerTendenciaMencionesAlcanceMock(): PuntoTendenciaMencionesAlcance[] {
  const puntos: PuntoTendenciaMencionesAlcance[] = [];
  for (let i = 0; i < 24; i++) {
    const oscilacion = Math.sin(i / 2.3) * 0.35 + Math.sin(i / 5.1) * 0.2;
    const menciones = Math.round(
      1200 + oscilacion * 900 + (i % 7 === 0 ? 1800 : 0),
    );
    const alcance = Math.round(
      180_000 + oscilacion * 140_000 + (i % 5 === 0 ? 60_000 : 0),
    );
    puntos.push({
      menciones: Math.max(120, menciones),
      alcance: Math.max(20_000, alcance),
    });
  }
  return puntos;
}

// ─── Tendencia de alcance potencial (actual vs período anterior) ────────────

export type PuntoTendenciaAlcance = {
  fecha: number;
  actual: number;
  anterior: number;
};

const MS_DÍA_TENDENCIA = 24 * 60 * 60 * 1000;

export function obtenerTendenciaAlcanceMock(): PuntoTendenciaAlcance[] {
  const puntos: PuntoTendenciaAlcance[] = [];
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  for (let i = 0; i < 24; i++) {
    const oscilacion = Math.sin(i / 2.1) * 0.4 + Math.sin(i / 6) * 0.25;
    const actual = Math.round(
      320_000 + oscilacion * 260_000 + (i % 8 === 0 ? 400_000 : 0),
    );
    const anterior = Math.round(280_000 + Math.sin(i / 2.6) * 200_000);
    puntos.push({
      fecha: hoy.getTime() - (23 - i) * MS_DÍA_TENDENCIA,
      actual: Math.max(20_000, actual),
      anterior: Math.max(20_000, anterior),
    });
  }
  return puntos;
}

// ─── Rendimiento por proyecto (burbujas: alcance × engagement × menciones) ──

export type BurbujaRendimiento = {
  proyectoId: string;
  nombre: string;
  alcance: number;
  engagement: number;
  menciones: number;
};

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

/**
 * Posiciones por percentil (no por suma de hash + analisis): con pocos
 * proyectos, un multiplicador lineal por `analisis` puede dominar un eje
 * y apelotonar todas las burbujas en una esquina. Distribuir por índice
 * (eje X) y por hash acotado a una banda (eje Y) garantiza que el scatter
 * use todo el plano sin importar cuántos proyectos activos haya.
 */
export function obtenerRendimientoProyectosMock(
  proyectos: Proyecto[],
): BurbujaRendimiento[] {
  const activos = proyectos.filter((p) => p.estado === "activo");
  const n = activos.length;

  return activos.map((p, i) => {
    const h = hashId(p.id);
    const percentilX = n > 1 ? i / (n - 1) : 0.5;
    const percentilY = 0.12 + ((h >>> 6) % 76) / 100;

    return {
      proyectoId: p.id,
      nombre: p.nombre,
      alcance: Math.round(30_000_000 + percentilY * 320_000_000),
      engagement: Math.round(6_000 + percentilX * 68_000),
      menciones: 80 + ((h >>> 8) % 900) + p.analisis * 25,
    };
  });
}

// ─── Imágenes y videos con más interacciones ────────────────────────────────

export type MediaInteraccion = {
  id: string;
  imagenUrl: string;
  fuente: string;
  referencia: string;
  url: string;
  interacciones?: number | null;
};

/** IDs reales de Unsplash (mismo dominio ya whitelisteado en next.config.ts
 * para el avatar del topbar). Fotos genéricas de paisaje — suficiente para
 * un mock visual, sin pretender ser contenido real. */
const FOTOS_MEDIA = [
  "1470071459604-3b5ec3a7fe05",
  "1506744038136-46273834b3fb",
  "1441974231531-c6227db76b6e",
  "1472214103451-9374bd1c798e",
  "1519681393784-d120267933ba",
  "1501594907352-04cda38ebc29",
  "1465146344425-f00d5f5c8f07",
  "1476514525535-07fb3b4ae5f1",
  "1490750967868-88aa4486c946",
] as const;

const FUENTES_MEDIA = [
  { fuente: "X", dominio: "x.com" },
  { fuente: "Facebook", dominio: "facebook.com" },
  { fuente: "Instagram", dominio: "instagram.com" },
  { fuente: "Noticias: en línea", dominio: "noticias-ejemplo.com" },
  { fuente: "YouTube", dominio: "youtube.com" },
  { fuente: "Blogs", dominio: "blog-ejemplo.com" },
] as const;

const REFERENCIAS_MEDIA = [
  "Cobertura de la conferencia de prensa",
  "Imagen viral sobre el anuncio reciente",
  "Fragmento de video con alta interacción",
  "Publicación destacada por volumen de comentarios",
  "Captura de pantalla ampliamente compartida",
  "Miniatura de video con tendencia al alza",
] as const;

export function obtenerImagenesVideosMock(cantidad = 18): MediaInteraccion[] {
  return Array.from({ length: cantidad }, (_, i) => {
    const foto = FOTOS_MEDIA[i % FOTOS_MEDIA.length];
    const { fuente, dominio } = FUENTES_MEDIA[i % FUENTES_MEDIA.length];
    const referencia = REFERENCIAS_MEDIA[i % REFERENCIAS_MEDIA.length];
    return {
      id: `media-${i}`,
      imagenUrl: `https://images.unsplash.com/photo-${foto}?w=300&h=300&fit=crop`,
      fuente,
      referencia,
      url: `https://${dominio}/status/${1000 + i}`,
    };
  });
}

// ─── Palabras clave agregadas (todos los proyectos activos) ─────────────────

export type SentimientoPalabra = "Positivo" | "Neutro" | "Negativo";

export type PalabraClaveGeneral = {
  palabra: string;
  efectividad: SentimientoPalabra;
};

const SENTIMIENTOS_PALABRA: SentimientoPalabra[] = [
  "Positivo",
  "Neutro",
  "Negativo",
];

export function obtenerPalabrasClaveGeneralMock(
  proyectos: Proyecto[],
): PalabraClaveGeneral[] {
  const vistos = new Set<string>();
  const palabras: PalabraClaveGeneral[] = [];

  for (const proyecto of proyectos.filter((p) => p.estado === "activo")) {
    for (const palabra of proyecto.palabrasClave) {
      const clave = palabra.toLowerCase();
      if (vistos.has(clave)) continue;
      vistos.add(clave);
      const h = hashId(clave);
      palabras.push({ palabra, efectividad: SENTIMIENTOS_PALABRA[h % 3] });
    }
  }

  return palabras;
}
