import { PALETA_ACTIVA } from "@/lib/paletas-graficas";
import type {
  FuenteMenciones,
  MenciónEditorial,
  Proyecto,
  RespuestaMenciones,
} from "@/types";

const COLOR_FUENTE = PALETA_ACTIVA.categorica.map((tono) => tono.plano);

const FUENTES_BASE: FuenteMenciones[] = [
  {
    id: "x",
    nombre: "X",
    total: 350_000,
    cambio: 12.4,
    cambioAbsoluto: 38_600,
    porcentaje: 46.1,
    color: COLOR_FUENTE[0],
  },
  {
    id: "facebook",
    nombre: "Facebook",
    total: 175_000,
    cambio: 8.3,
    cambioAbsoluto: 13_400,
    porcentaje: 23.1,
    color: COLOR_FUENTE[1],
  },
  {
    id: "noticias",
    nombre: "Noticias en línea",
    total: 92_000,
    cambio: -1.8,
    cambioAbsoluto: -1_700,
    porcentaje: 12.1,
    color: COLOR_FUENTE[2],
  },
  {
    id: "instagram",
    nombre: "Instagram",
    total: 72_000,
    cambio: 4.8,
    cambioAbsoluto: 3_300,
    porcentaje: 9.5,
    color: COLOR_FUENTE[3],
  },
  {
    id: "youtube",
    nombre: "YouTube",
    total: 45_000,
    cambio: 16.3,
    cambioAbsoluto: 6_300,
    porcentaje: 5.9,
    color: COLOR_FUENTE[4],
  },
  {
    id: "blogs",
    nombre: "Blogs",
    total: 25_000,
    cambio: 7.8,
    cambioAbsoluto: 1_800,
    porcentaje: 3.3,
    color: COLOR_FUENTE[5],
  },
];

const MENCIONES_BASE: MenciónEditorial[] = [
  {
    id: "m-1",
    proyectoId: "claudia-sheinbaum",
    título: "El nuevo plan nacional concentra la conversación digital",
    extracto:
      "La presentación generó respuestas sobre inversión pública, seguridad y prioridades regionales.",
    fuente: "El Universal",
    autor: "Ana Torres",
    url: "https://example.com/menciones/1",
    publicadaEn: "2026-08-06T08:40:00-06:00",
    sentimiento: "positivo",
    tipoFuente: "noticias",
    alcance: 186_400,
    compartidos: 4_280,
  },
  {
    id: "m-2",
    proyectoId: "adrian-rubalcava",
    título: "La movilidad vuelve al centro de la agenda capitalina",
    extracto:
      "Usuarios comparan propuestas y señalan los corredores con mayor presión durante las horas pico.",
    fuente: "Milenio",
    autor: "Carlos Vega",
    url: "https://example.com/menciones/2",
    publicadaEn: "2026-08-06T07:15:00-06:00",
    sentimiento: "neutral",
    tipoFuente: "noticias",
    alcance: 142_700,
    compartidos: 3_110,
  },
  {
    id: "m-3",
    proyectoId: "maru-campos",
    título: "Crece el debate por la estrategia de seguridad estatal",
    extracto:
      "La conversación mezcla reportes ciudadanos, datos oficiales y cuestionamientos a la implementación.",
    fuente: "Radio Fórmula",
    autor: "Darío Norento",
    url: "https://example.com/menciones/3",
    publicadaEn: "2026-08-05T22:05:00-06:00",
    sentimiento: "negativo",
    tipoFuente: "noticias",
    alcance: 128_900,
    compartidos: 5_640,
  },
  {
    id: "m-4",
    proyectoId: "alejandro-armenta",
    título: "Infraestructura regional registra un repunte de menciones",
    extracto:
      "Medios locales destacan avances mientras comunidades solicitan fechas y alcances más precisos.",
    fuente: "El Sol de Puebla",
    autor: "Lucía Méndez",
    url: "https://example.com/menciones/4",
    publicadaEn: "2026-08-05T18:20:00-06:00",
    sentimiento: "positivo",
    tipoFuente: "noticias",
    alcance: 94_300,
    compartidos: 1_980,
  },
  {
    id: "m-5",
    proyectoId: "campana-morena-q3",
    título: "La campaña activa nuevas narrativas en redes sociales",
    extracto:
      "Los mensajes de territorio obtienen mayor interacción que las publicaciones centradas en vocerías.",
    fuente: "Animal Político",
    autor: "Mónica Ruiz",
    url: "https://example.com/menciones/5",
    publicadaEn: "2026-08-05T16:42:00-06:00",
    sentimiento: "neutral",
    tipoFuente: "noticias",
    alcance: 211_800,
    compartidos: 7_320,
  },
  {
    id: "m-6",
    proyectoId: "claudia-sheinbaum",
    título: "Analistas revisan el desempeño de los programas sociales",
    extracto:
      "El balance editorial reconoce continuidad, aunque pide indicadores más claros para medir resultados.",
    fuente: "Expansión Política",
    autor: "Roberto Salas",
    url: "https://example.com/menciones/6",
    publicadaEn: "2026-08-05T13:10:00-06:00",
    sentimiento: "neutral",
    tipoFuente: "noticias",
    alcance: 165_200,
    compartidos: 2_740,
  },
  {
    id: "m-7",
    proyectoId: "maru-campos",
    título: "Usuarios cuestionan la respuesta ante reportes recientes",
    extracto:
      "Las menciones negativas se concentran en tiempos de respuesta y comunicación institucional.",
    fuente: "Proceso",
    autor: "Iván Ríos",
    url: "https://example.com/menciones/7",
    publicadaEn: "2026-08-04T20:25:00-06:00",
    sentimiento: "negativo",
    tipoFuente: "noticias",
    alcance: 109_600,
    compartidos: 4_940,
  },
  {
    id: "m-8",
    proyectoId: "adrian-rubalcava",
    título: "La conversación vecinal destaca acciones de proximidad",
    extracto:
      "Publicaciones comunitarias muestran una percepción favorable sobre actividades en territorio.",
    fuente: "Publimetro",
    autor: "Fernanda Gil",
    url: "https://example.com/menciones/8",
    publicadaEn: "2026-08-04T17:30:00-06:00",
    sentimiento: "positivo",
    tipoFuente: "noticias",
    alcance: 88_400,
    compartidos: 1_760,
  },
];

function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function factorProyecto(id: string): number {
  return 0.14 + (hashId(id) % 17) / 100;
}

function obtenerTendencia(factor: number) {
  return Array.from({ length: 30 }, (_, indice) => {
    const fecha = new Date(2026, 6, 8 + indice);
    const pulso =
      Math.sin(indice / 2.1) * 5_500 + Math.cos(indice / 4.8) * 3_800;
    const pico = [4, 11, 18, 25].includes(indice) ? 13_000 : 0;
    const actual = Math.max(
      4_000,
      Math.round((20_000 + pulso + pico) * factor),
    );
    const anterior = Math.max(
      4_000,
      Math.round((17_500 + Math.sin((indice + 2) / 2.7) * 4_800) * factor),
    );
    return {
      fecha: fecha.toISOString().slice(0, 10),
      actual,
      anterior,
      estimadasActual: 0,
    };
  });
}

export function obtenerMencionesMock(
  proyectos: Proyecto[],
  proyectoId?: string | null,
): RespuestaMenciones {
  const proyecto = proyectoId
    ? proyectos.find((item) => item.id === proyectoId)
    : null;
  const factor = proyecto ? factorProyecto(proyecto.id) : 1;
  const total = Math.round(759_000 * factor);
  const fuentes = FUENTES_BASE.map((fuente, indice) => ({
    ...fuente,
    total: Math.round(fuente.total * factor),
    cambio: proyecto
      ? Number(
          (
            (fuente.cambio ?? 0) *
            (0.7 + ((hashId(proyecto.id) >> indice) % 40) / 100)
          ).toFixed(1),
        )
      : fuente.cambio,
  }));
  const mencionesFiltradas = proyecto
    ? MENCIONES_BASE.filter((mención) => mención.proyectoId === proyecto.id)
    : MENCIONES_BASE;

  return {
    proyectoId: proyecto?.id ?? null,
    período: { inicio: "2026-07-08", fin: "2026-08-06" },
    resumen: {
      total,
      cambioTotal: proyecto ? 8.6 + (hashId(proyecto.id) % 60) / 10 : 12.4,
      cambioTotalAbsoluto: proyecto ? 40 : 120,
      positivas: Math.round(total * (proyecto ? 0.42 : 0.47)),
      cambioPositivas: proyecto ? 15.2 : 38,
      cambioPositivasAbsoluto: proyecto ? 12 : 30,
      negativas: Math.round(total * (proyecto ? 0.12 : 0.09)),
      cambioNegativas: proyecto ? 2.8 : 0,
      cambioNegativasAbsoluto: proyecto ? 1 : 0,
      redesSociales: Math.round(total * 0.78),
      cambioRedesSociales: proyecto ? 9.4 : 17,
      cambioRedesSocialesAbsoluto: proyecto ? 25 : 60,
      editoriales: Math.round(total * 0.22),
      cambioEditoriales: proyecto ? 11.6 : 22,
      cambioEditorialesAbsoluto: proyecto ? 8 : 18,
    },
    fuentes,
    tendencia: obtenerTendencia(factor),
    menciones: mencionesFiltradas.map((mención) => ({ ...mención })),
  };
}
