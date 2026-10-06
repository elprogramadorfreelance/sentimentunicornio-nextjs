import type {
  FuenteDatos,
  ResumenDashboard,
  TarjetaMétrica,
  TendenciaSentimiento,
} from "@/types";

export const MÉTRICAS_MOCK: TarjetaMétrica[] = [
  {
    id: "menciones",
    etiqueta: "Menciones totales",
    valor: 14_832,
    cambio: 12.4,
    unidad: "",
  },
  {
    id: "sentimiento",
    etiqueta: "Índice de sentimiento",
    valor: 73,
    cambio: 5.1,
    unidad: "%",
  },
  { id: "alcance", etiqueta: "Alcance estimado", valor: "2.1M", cambio: -3.2 },
  {
    id: "tiempo-respuesta",
    etiqueta: "Tiempo de respuesta",
    valor: 4.2,
    cambio: -18.0,
    unidad: "h",
  },
];

export const FUENTES_MOCK: FuenteDatos[] = [
  {
    id: "tw-1",
    nombre: "Twitter / X Oficial",
    tipo: "twitter",
    estado: "activo",
    últimaSincronización: "2026-07-13T10:30:00Z",
    totalMenciones: 8_200,
  },
  {
    id: "ig-1",
    nombre: "Instagram Brand",
    tipo: "instagram",
    estado: "activo",
    últimaSincronización: "2026-07-13T09:45:00Z",
    totalMenciones: 3_450,
  },
  {
    id: "news-1",
    nombre: "Portales de noticias MX",
    tipo: "noticias",
    estado: "activo",
    últimaSincronización: "2026-07-13T08:00:00Z",
    totalMenciones: 1_982,
  },
  {
    id: "rev-1",
    nombre: "Reseñas Google / Trustpilot",
    tipo: "reseñas",
    estado: "error",
    últimaSincronización: "2026-07-12T22:10:00Z",
    totalMenciones: 1_200,
  },
];

export const TENDENCIAS_MOCK: TendenciaSentimiento[] = [
  {
    período: "2026-07-07",
    positivo: 62,
    negativo: 18,
    neutral: 20,
    total: 1_820,
  },
  {
    período: "2026-07-08",
    positivo: 58,
    negativo: 22,
    neutral: 20,
    total: 2_100,
  },
  {
    período: "2026-07-09",
    positivo: 70,
    negativo: 15,
    neutral: 15,
    total: 1_950,
  },
  {
    período: "2026-07-10",
    positivo: 65,
    negativo: 20,
    neutral: 15,
    total: 2_340,
  },
  {
    período: "2026-07-11",
    positivo: 72,
    negativo: 12,
    neutral: 16,
    total: 2_480,
  },
  {
    período: "2026-07-12",
    positivo: 68,
    negativo: 17,
    neutral: 15,
    total: 2_210,
  },
  {
    período: "2026-07-13",
    positivo: 73,
    negativo: 14,
    neutral: 13,
    total: 1_932,
  },
];

export const RESUMEN_DASHBOARD_MOCK: ResumenDashboard = {
  sentimientoGeneral: {
    categoría: "positivo",
    puntuación: 73,
    confianza: 0.87,
  },
  métricas: MÉTRICAS_MOCK,
  fuentes: FUENTES_MOCK,
  últimaActualización: "2026-07-13T10:30:00Z",
};
