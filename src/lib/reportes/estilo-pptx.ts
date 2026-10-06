import type PptxGenJS from "pptxgenjs";
import { RELACION_ASPECTO_LOGO } from "./logo";
import { COLOR_ACENTO_CELESTE, COLOR_MARCA_NAVY } from "./paleta";

/** Tamaño por defecto de PptxGenJS (LAYOUT_16x9, en pulgadas) — ya usado por el cover actual. */
const ANCHO_DIAPOSITIVA = 10;
const ALTO_DIAPOSITIVA = 5.63;

export type TarjetaKpi = {
  etiqueta: string;
  valor: string;
  /** Color hex (sin '#') del valor grande; por defecto usa el navy de marca. */
  color?: string;
};

export type SerieGraficaPptx = {
  nombre: string;
  valores: number[];
};

/**
 * Primera diapositiva de los 5 reportes IA: logo centrado + "Resumen IA" (pedido explícito de
 * producto — el título específico de cada reporte va como subtítulo debajo, no reemplaza este
 * texto fijo).
 */
export function agregarPortadaPptx(
  pptx: PptxGenJS,
  opts: { logoPng: string; subtitulo: string; fecha: string },
): PptxGenJS.Slide {
  const slide = pptx.addSlide();
  slide.background = { color: COLOR_MARCA_NAVY };

  const anchoLogo = 2.6;
  const altoLogo = anchoLogo / RELACION_ASPECTO_LOGO;
  const yLogo = 1.3;
  slide.addImage({
    data: opts.logoPng,
    x: (ANCHO_DIAPOSITIVA - anchoLogo) / 2,
    y: yLogo,
    w: anchoLogo,
    h: altoLogo,
  });

  slide.addText("Resumen IA", {
    x: 0,
    y: yLogo + altoLogo + 0.3,
    w: ANCHO_DIAPOSITIVA,
    h: 0.6,
    align: "center",
    fontSize: 26,
    bold: true,
    color: "FFFFFF",
  });
  slide.addText(opts.subtitulo, {
    x: 0.8,
    y: yLogo + altoLogo + 0.95,
    w: ANCHO_DIAPOSITIVA - 1.6,
    h: 0.5,
    align: "center",
    fontSize: 14,
    color: COLOR_ACENTO_CELESTE,
  });
  slide.addText(opts.fecha, {
    x: 0,
    y: ALTO_DIAPOSITIVA - 0.55,
    w: ANCHO_DIAPOSITIVA,
    h: 0.3,
    align: "center",
    fontSize: 10,
    color: "CBD5E1",
  });

  return slide;
}

/**
 * Fila de tarjetas KPI visuales (rects redondeados + valor grande) para reemplazar los bloques
 * de texto plano "Positivo X% | Negativo Y%" del diseño anterior. Devuelve el nuevo cursor `y`.
 */
export function agregarTarjetasKpiPptx(
  slide: PptxGenJS.Slide,
  y: number,
  tarjetas: TarjetaKpi[],
): number {
  const margen = 0.5;
  const espacio = 0.15;
  const anchoDisponible = ANCHO_DIAPOSITIVA - margen * 2;
  const anchoTarjeta =
    (anchoDisponible - espacio * (tarjetas.length - 1)) / tarjetas.length;
  const alto = 1;

  tarjetas.forEach((tarjeta, i) => {
    const x = margen + i * (anchoTarjeta + espacio);
    slide.addShape("roundRect", {
      x,
      y,
      w: anchoTarjeta,
      h: alto,
      rectRadius: 0.08,
      fill: { color: "F4F6FB" },
      line: { color: "F4F6FB" },
    });
    slide.addText(tarjeta.valor, {
      x,
      y: y + 0.12,
      w: anchoTarjeta,
      h: 0.5,
      align: "center",
      fontSize: 20,
      bold: true,
      color: tarjeta.color ?? COLOR_MARCA_NAVY,
    });
    slide.addText(tarjeta.etiqueta, {
      x,
      y: y + 0.62,
      w: anchoTarjeta,
      h: 0.3,
      align: "center",
      fontSize: 10,
      color: "64748B",
    });
  });

  return y + alto + 0.3;
}

/**
 * Gráfica nativa de PowerPoint (editable dentro del archivo, sin insertar una imagen) — usa
 * `slide.addChart`. `categorias`/cada `serie.valores` deben venir en el mismo orden; al conectar
 * backend, mapear desde la respuesta real hacia esta forma antes de llamar esta función.
 */
export function agregarGraficaNativaPptx(
  slide: PptxGenJS.Slide,
  tipo: "bar" | "pie" | "line" | "doughnut",
  categorias: string[],
  series: SerieGraficaPptx[],
  opts: {
    x: number;
    y: number;
    w: number;
    h: number;
    colores?: string[];
    /** Series apiladas en vez de agrupadas — ej. positivo/negativo/neutro por fuente. */
    apilado?: boolean;
  },
) {
  slide.addChart(
    tipo,
    series.map((serie) => ({
      name: serie.nombre,
      labels: categorias,
      values: serie.valores,
    })),
    {
      x: opts.x,
      y: opts.y,
      w: opts.w,
      h: opts.h,
      chartColors: opts.colores,
      showLegend: series.length > 1,
      legendPos: "b",
      showTitle: false,
      dataLabelColor: "334155",
      barGrouping: opts.apilado ? "stacked" : undefined,
    },
  );
}
