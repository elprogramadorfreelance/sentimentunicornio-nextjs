import {
  type FuentePotencial,
  formatearAlcanceCompacto,
  type MediaInteraccion,
  obtenerAlcancePorFuenteMock,
  obtenerImagenesVideosMock,
  obtenerRegionesPresenciaMock,
  obtenerTendenciaAlcanceMock,
  obtenerTendenciaMencionesAlcanceMock,
  obtenerTonalidadPorFuenteMock,
  type PuntoTendenciaAlcance,
  type PuntoTendenciaMencionesAlcance,
  type RegionPresencia,
  type TonalidadFuente,
} from "@/lib/mock/dashboard-general";
import type { MenciónEditorial, Proyecto } from "@/types";

export { formatearAlcanceCompacto };

type MetricasDetalleProyectoMock = {
  positivo: number;
  negativo: number;
  neutro: number;
  mencionesSemana: readonly [number, number, number, number, number, number, number];
  alcance: number;
  alertas: number;
};

function hashIdProyecto(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

/**
 * Mock estable por proyecto — sin llamadas reales desde el 2026-08-19
 * (/proyectos/[id] ahora redirige a /dashboard?proyecto=, que usa datos
 * reales). Se deja el tipo/archivo porque otros widgets todavía importan
 * tipos de este mismo archivo (AlertaPanel, TendenciaPanel, etc.).
 */
function metricasDetalleProyecto(proyecto: Proyecto): MetricasDetalleProyectoMock {
  const h = hashIdProyecto(proyecto.id);
  let positivo = 30 + (h % 45);
  let negativo = 8 + ((h >> 3) % 28);
  let neutro = 100 - positivo - negativo;
  if (neutro < 5) {
    neutro = 5;
    const exceso = positivo + negativo + neutro - 100;
    positivo = Math.max(10, positivo - Math.ceil(exceso / 2));
    negativo = Math.max(5, 100 - positivo - neutro);
  }

  const base = 40 + (h % 120);
  const mencionesSemana = [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const v = Math.round(base * (0.55 + ((h >> (i + 2)) % 50) / 100));
    return Math.max(8, v + proyecto.analisis * 3);
  }) as unknown as MetricasDetalleProyectoMock["mencionesSemana"];

  return {
    positivo,
    negativo,
    neutro,
    mencionesSemana,
    alcance: 2_400 + (h % 48_000) + proyecto.analisis * 850,
    alertas: (h % 5) + (proyecto.estado === "activo" ? 1 : 0),
  };
}

export type NivelAlertaPanel = "critica" | "advertencia" | "info";

export type AlertaPanel = {
  id: string;
  nivel: NivelAlertaPanel;
  mensaje: string;
  // Real, no inventado. Mock/plantillas de abajo lo dejan en null — no aplica
  // a datos ficticios. "narrativas" abre el modal de evidencia por narrativa
  // (id = narrative_id, criterio detected_narrative). "evidencia" abre el
  // modal genérico de evidencia por alerta (id = el id de la propia alerta;
  // el backend despacha por tipo real en getAlertEvidence, db.js) — cubre
  // sentiment_drop/negative_spike/critical_keywords/sensitive_source/
  // high_risk_amplifier (2026-10-02, pedido de Darinka: que toda alerta abra
  // un modal con las notas reales involucradas, no solo narrativas/amplificador).
  enlace?: { destino: "narrativas" | "evidencia"; id: string } | null;
};

export type FuenteTraficoPanel = {
  id: string;
  fuente: string;
  menciones: string;
  porcentaje: number;
  color: string;
};

export type TendenciaPanel = {
  posicion: number;
  nombre: string;
  cambio: number;
  url: string | null;
  /** Menciones reales que forman el tema — el clic las muestra tal cual. */
  menciones?: MenciónEditorial[];
};

export type SerieSemanal = {
  total: number;
  cambio: number;
  dias: readonly [number, number, number, number, number, number, number];
};

export type DatosPanelMetricas = {
  menciones: SerieSemanal;
  alcance: SerieSemanal;
  desinformacion: {
    porcentaje: number;
    notasNoVerificadas: number;
    actualizacion: string;
  };
  alertas: AlertaPanel[];
  trafico: FuenteTraficoPanel[];
  tendencias: TendenciaPanel[];
  alcancePorFuente: FuentePotencial[];
  tonalidad: TonalidadFuente[];
  tendenciaMencionesAlcance: PuntoTendenciaMencionesAlcance[];
  tendenciaAlcance: PuntoTendenciaAlcance[];
  regiones: RegionPresencia[];
  media: MediaInteraccion[];
  totalMedia: number;
  sentimiento: { positivo: number; negativo: number; neutro: number };
};

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

function factorProyecto(proyectoId: string): number {
  return 0.45 + (hashId(proyectoId) % 55) / 100;
}

function escalarSerie(
  base: SerieSemanal,
  factor: number,
  seed: number,
): SerieSemanal {
  const dias = base.dias.map((v, i) =>
    Math.max(
      1,
      Math.round(v * factor * (0.85 + ((seed >> (i + 1)) % 30) / 100)),
    ),
  ) as unknown as SerieSemanal["dias"];
  return {
    total: dias.reduce((a, b) => a + b, 0),
    cambio: Number((((seed % 40) - 12) / 10).toFixed(1)),
    dias,
  };
}

function escalarNumero(valor: number, factor: number, minimo = 1): number {
  return Math.max(minimo, Math.round(valor * factor));
}

const MENCIONES_AGREGADO: SerieSemanal = {
  total: 12_456,
  cambio: 12.4,
  dias: [1_420, 1_680, 1_510, 1_180, 1_750, 2_050, 2_866],
};

const ALCANCE_AGREGADO: SerieSemanal = {
  total: 13_700_000,
  cambio: 3.13,
  dias: [
    8_200_000, 9_100_000, 8_700_000, 10_400_000, 12_100_000, 11_600_000,
    13_700_000,
  ],
};

const ALERTAS_AGREGADO: AlertaPanel[] = [
  {
    id: "a1",
    nivel: "critica",
    mensaje: "Se han presentado 3 comentarios negativos",
  },
  {
    id: "a2",
    nivel: "advertencia",
    mensaje: "Se debe verificar la fuente de esta noticia",
  },
  {
    id: "a3",
    nivel: "info",
    mensaje: "El volumen de menciones superó el umbral diario",
  },
];

const TRAFICO_AGREGADO: FuenteTraficoPanel[] = [
  {
    id: "x",
    fuente: "X (Twitter)",
    menciones: "2.4K",
    porcentaje: 55,
    color: "var(--color-sky)",
  },
  {
    id: "facebook",
    fuente: "Facebook",
    menciones: "3.5K",
    porcentaje: 80,
    color: "var(--color-navy)",
  },
  {
    id: "blogs",
    fuente: "Blogs",
    menciones: "1.8K",
    porcentaje: 35,
    color: "var(--color-blue)",
  },
];

const TENDENCIAS_AGREGADO: TendenciaPanel[] = [
  { posicion: 1, nombre: "Mundial 2026", cambio: 1, url: null },
  { posicion: 2, nombre: "#FelizDía", cambio: 0, url: null },
  { posicion: 3, nombre: "Gobierno de México", cambio: 4, url: null },
  { posicion: 4, nombre: "La Casa de los Famosos", cambio: 0, url: null },
  { posicion: 5, nombre: "Pedrito Sola", cambio: 0, url: null },
  { posicion: 6, nombre: "Plan DN3", cambio: 0, url: null },
  { posicion: 7, nombre: "ONU", cambio: -3, url: null },
  { posicion: 8, nombre: "Trump", cambio: 0, url: null },
  { posicion: 9, nombre: "Claudia Sheinbaum", cambio: -1, url: null },
  { posicion: 10, nombre: "CDMX", cambio: 0, url: null },
];

function formatearMencionesCortas(valor: number): string {
  if (valor >= 1_000) return `${(valor / 1_000).toFixed(1)}K`;
  return String(valor);
}

function alertasParaProyecto(proyecto: Proyecto, seed: number): AlertaPanel[] {
  const detalle = metricasDetalleProyecto(proyecto);
  const plantillas: AlertaPanel[] = [
    {
      id: `${proyecto.id}-critica`,
      nivel: "critica",
      mensaje: `${detalle.negativo}% de menciones negativas en la ventana reciente`,
    },
    {
      id: `${proyecto.id}-adv`,
      nivel: "advertencia",
      mensaje: `Posible pico de desinformación ligado a «${proyecto.palabraClave}»`,
    },
    {
      id: `${proyecto.id}-info`,
      nivel: "info",
      mensaje: `Volumen semanal: ${detalle.mencionesSemana.reduce((a, b) => a + b, 0).toLocaleString("es-MX")} menciones`,
    },
  ];
  const cantidad = Math.min(3, 1 + (seed % 3));
  return plantillas.slice(0, cantidad);
}

function traficoParaProyecto(
  factor: number,
  seed: number,
): FuenteTraficoPanel[] {
  return TRAFICO_AGREGADO.map((f, i) => {
    const mencionesNum = Math.round(
      (800 + ((seed >> (i + 2)) % 2_400)) * factor,
    );
    return {
      ...f,
      menciones: formatearMencionesCortas(mencionesNum),
      porcentaje: Math.min(95, Math.round(f.porcentaje * factor + (seed % 15))),
    };
  });
}

function tendenciasParaProyecto(
  proyecto: Proyecto,
  seed: number,
): TendenciaPanel[] {
  const keyword = proyecto.palabrasClave[0] ?? proyecto.nombre;
  const base = TENDENCIAS_AGREGADO.map((t, i) => ({
    ...t,
    cambio: ((seed >> i) % 7) - 3,
  }));
  base[0] = { posicion: 1, nombre: keyword, cambio: 2 + (seed % 3), url: null };
  base[2] = {
    posicion: 3,
    nombre: proyecto.nombre.split(" ").slice(0, 2).join(" "),
    cambio: (seed % 5) - 1,
    url: null,
  };
  return base;
}

function alcancePorFuenteParaProyecto(
  factor: number,
  seed: number,
): FuentePotencial[] {
  return obtenerAlcancePorFuenteMock().map((f, i) => ({
    ...f,
    alcance: escalarNumero(
      f.alcance,
      factor * (0.9 + ((seed >> i) % 20) / 100),
    ),
    cambioPorcentaje: Number(
      ((f.cambioPorcentaje ?? 0) * (0.6 + (seed % 50) / 100)).toFixed(2),
    ),
    porcentajeTotal: Math.max(
      1,
      Math.round(f.porcentajeTotal * (0.7 + ((seed >> (i + 3)) % 40) / 100)),
    ),
  }));
}

function tonalidadParaProyecto(
  factor: number,
  seed: number,
): TonalidadFuente[] {
  return obtenerTonalidadPorFuenteMock().map((f, i) => ({
    fuente: f.fuente,
    positivo: escalarNumero(
      f.positivo,
      factor * (0.8 + ((seed >> i) % 25) / 100),
    ),
    negativo: escalarNumero(
      f.negativo,
      factor * (0.7 + ((seed >> (i + 2)) % 30) / 100),
    ),
    neutro: escalarNumero(f.neutro, factor),
    sinCalificar: escalarNumero(f.sinCalificar, factor * 0.9),
  }));
}

function tendenciaComboParaProyecto(
  factor: number,
  seed: number,
): PuntoTendenciaMencionesAlcance[] {
  return obtenerTendenciaMencionesAlcanceMock().map((p, i) => ({
    menciones: escalarNumero(
      p.menciones,
      factor * (0.8 + ((seed >> (i % 8)) % 25) / 100),
    ),
    alcance: escalarNumero(
      p.alcance,
      factor * (0.75 + ((seed >> ((i + 3) % 8)) % 30) / 100),
      5_000,
    ),
  }));
}

function tendenciaAlcanceParaProyecto(
  factor: number,
  seed: number,
): PuntoTendenciaAlcance[] {
  return obtenerTendenciaAlcanceMock().map((p, i) => ({
    fecha: p.fecha,
    actual: escalarNumero(
      p.actual,
      factor * (0.8 + ((seed >> (i % 8)) % 25) / 100),
      5_000,
    ),
    anterior: escalarNumero(
      p.anterior,
      factor * (0.7 + ((seed >> ((i + 2) % 8)) % 30) / 100),
      5_000,
    ),
  }));
}

function regionesParaProyecto(factor: number, seed: number): RegionPresencia[] {
  return obtenerRegionesPresenciaMock().map((region, i) => ({
    ...region,
    menciones: escalarNumero(
      region.menciones,
      factor * (0.5 + ((seed >> (i % 10)) % 50) / 100),
    ),
  }));
}

/**
 * Datos del panel general. Sin `proyecto` → agregado de todos;
 * con proyecto → serie única escalada/derivada del id (estable entre renders).
 */
export function obtenerDatosPanelMock(
  proyecto?: Proyecto | null,
): DatosPanelMetricas {
  if (!proyecto) {
    return {
      menciones: MENCIONES_AGREGADO,
      alcance: ALCANCE_AGREGADO,
      desinformacion: {
        porcentaje: 18,
        notasNoVerificadas: 32,
        actualizacion: "Última actualización hace 5 minutos",
      },
      alertas: ALERTAS_AGREGADO,
      trafico: TRAFICO_AGREGADO,
      tendencias: TENDENCIAS_AGREGADO,
      alcancePorFuente: obtenerAlcancePorFuenteMock(),
      tonalidad: obtenerTonalidadPorFuenteMock(),
      tendenciaMencionesAlcance: obtenerTendenciaMencionesAlcanceMock(),
      tendenciaAlcance: obtenerTendenciaAlcanceMock(),
      regiones: obtenerRegionesPresenciaMock(),
      media: obtenerImagenesVideosMock(18),
      totalMedia: 100,
      sentimiento: { positivo: 58, negativo: 30, neutro: 12 },
    };
  }

  const seed = hashId(proyecto.id);
  const factor = factorProyecto(proyecto.id);
  const detalle = metricasDetalleProyecto(proyecto);
  const menciones = escalarSerie(MENCIONES_AGREGADO, factor, seed);
  const alcance = escalarSerie(ALCANCE_AGREGADO, factor * 0.9, seed + 11);

  return {
    menciones: {
      ...menciones,
      dias: detalle.mencionesSemana,
      total: detalle.mencionesSemana.reduce((a, b) => a + b, 0),
    },
    alcance: {
      ...alcance,
      total: detalle.alcance * 120,
    },
    desinformacion: {
      porcentaje: 8 + (seed % 28),
      notasNoVerificadas: 4 + (seed % 40) + proyecto.analisis,
      actualizacion: "Última actualización hace 5 minutos",
    },
    alertas: alertasParaProyecto(proyecto, seed),
    trafico: traficoParaProyecto(factor, seed),
    tendencias: tendenciasParaProyecto(proyecto, seed),
    alcancePorFuente: alcancePorFuenteParaProyecto(factor, seed),
    tonalidad: tonalidadParaProyecto(factor, seed),
    tendenciaMencionesAlcance: tendenciaComboParaProyecto(factor, seed),
    tendenciaAlcance: tendenciaAlcanceParaProyecto(factor, seed),
    regiones: regionesParaProyecto(factor, seed),
    media: obtenerImagenesVideosMock(12).map((m, i) => ({
      ...m,
      id: `${proyecto.id}-media-${i}`,
      referencia: `${m.referencia} · ${proyecto.nombre}`,
    })),
    totalMedia: 20 + (seed % 40) + proyecto.analisis * 2,
    sentimiento: {
      positivo: detalle.positivo,
      negativo: detalle.negativo,
      neutro: detalle.neutro,
    },
  };
}
