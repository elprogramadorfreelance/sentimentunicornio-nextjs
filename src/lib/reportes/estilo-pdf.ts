import type { jsPDF } from "jspdf";
import { RELACION_ASPECTO_GRAFICA } from "./graficas-pdf";
import { RELACION_ASPECTO_LOGO } from "./logo";
import {
  COLOR_MARCA_NAVY_RGB,
  COLOR_TEXTO_CUERPO_RGB,
  COLOR_TEXTO_SECUNDARIO_RGB,
} from "./paleta";

export const MARGEN_PDF = 48;

const ALTO_PORTADA = 116;
const ALTO_LOGO_PORTADA = 40;
const ALTO_TARJETA_KPI = 64;
const ESPACIO_TARJETA_KPI = 12;
const TARJETAS_KPI_POR_FILA = 4;
const ANCHO_MAX_GRAFICA = 320;

/** Alto (pt) reservado para un encabezado de sección de 14pt bold (ver patrón `escribir`). */
export const ALTO_ENCABEZADO_SECCION = 24;

export type TarjetaKpi = {
  etiqueta: string;
  valor: string;
  /** Color del valor grande; por defecto usa el navy de marca. */
  colorRgb?: [number, number, number];
};

/**
 * Masthead/portada del reporte — se dibuja solo en la página 1 (decisión de producto: el resto
 * de páginas usa encabezados de texto simple para no repetir el logo en cada hoja). El logo va
 * a la izquierda como titular, con título/subtítulo alineados a su derecha.
 */
export function dibujarPortadaPdf(
  doc: jsPDF,
  opts: { logoPng: string; titulo: string; subtitulo: string; fecha: string },
): number {
  const anchoPagina = doc.internal.pageSize.getWidth();
  doc.setFillColor(...COLOR_MARCA_NAVY_RGB);
  doc.rect(0, 0, anchoPagina, ALTO_PORTADA, "F");

  const anchoLogo = ALTO_LOGO_PORTADA * RELACION_ASPECTO_LOGO;
  const yLogo = (ALTO_PORTADA - ALTO_LOGO_PORTADA) / 2;
  doc.addImage(
    opts.logoPng,
    "PNG",
    MARGEN_PDF,
    yLogo,
    anchoLogo,
    ALTO_LOGO_PORTADA,
  );

  const xTexto = MARGEN_PDF + anchoLogo + 24;
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text(opts.titulo, xTexto, ALTO_PORTADA / 2 - 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(opts.subtitulo, xTexto, ALTO_PORTADA / 2 + 9);
  doc.setFontSize(9);
  doc.text(opts.fecha, xTexto, ALTO_PORTADA / 2 + 26);

  doc.setTextColor(...COLOR_TEXTO_CUERPO_RGB);
  return ALTO_PORTADA + 32;
}

/**
 * Fila(s) de tarjetas KPI visuales (hasta 4 por fila) para reemplazar los renglones de texto
 * plano "Positivo X% · Alcance Y" que tenía el diseño anterior. Devuelve el nuevo cursor `y`.
 */
export function dibujarTarjetasKpiPdf(
  doc: jsPDF,
  y: number,
  tarjetas: TarjetaKpi[],
): number {
  const anchoPagina = doc.internal.pageSize.getWidth();
  const anchoDisponible = anchoPagina - MARGEN_PDF * 2;
  let yActual = y;

  for (
    let inicio = 0;
    inicio < tarjetas.length;
    inicio += TARJETAS_KPI_POR_FILA
  ) {
    const fila = tarjetas.slice(inicio, inicio + TARJETAS_KPI_POR_FILA);
    const anchoTarjeta =
      (anchoDisponible - ESPACIO_TARJETA_KPI * (fila.length - 1)) / fila.length;

    fila.forEach((tarjeta, i) => {
      const x = MARGEN_PDF + i * (anchoTarjeta + ESPACIO_TARJETA_KPI);
      doc.setFillColor(244, 246, 251);
      doc.roundedRect(x, yActual, anchoTarjeta, ALTO_TARJETA_KPI, 6, 6, "F");

      doc.setTextColor(...(tarjeta.colorRgb ?? COLOR_MARCA_NAVY_RGB));
      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);
      doc.text(tarjeta.valor, x + 12, yActual + 30);

      doc.setTextColor(...COLOR_TEXTO_SECUNDARIO_RGB);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(tarjeta.etiqueta, x + 12, yActual + 48, {
        maxWidth: anchoTarjeta - 20,
      });
    });

    yActual += ALTO_TARJETA_KPI + ESPACIO_TARJETA_KPI;
  }

  doc.setTextColor(...COLOR_TEXTO_CUERPO_RGB);
  return yActual + 12;
}

/** Alto (pt) que ocupará una gráfica insertada con `insertarGraficaPdf` al ancho dado. */
export function alturaGrafica(
  doc: jsPDF,
  anchoMax = ANCHO_MAX_GRAFICA,
): number {
  const anchoPagina = doc.internal.pageSize.getWidth();
  const ancho = Math.min(anchoMax, anchoPagina - MARGEN_PDF * 2);
  return ancho / RELACION_ASPECTO_GRAFICA;
}

/**
 * Fuerza un salto de página si `alturaNecesaria` no cabe en el espacio restante de la página
 * actual. Úsalo antes de escribir un encabezado de sección que va seguido de una gráfica, para
 * que ambos queden juntos en la misma página — sin esto, el encabezado puede quedar "huérfano"
 * al final de una hoja mientras la gráfica que le pertenece arranca en la siguiente.
 */
export function asegurarEspacio(
  doc: jsPDF,
  y: number,
  alturaNecesaria: number,
): number {
  const altoPagina = doc.internal.pageSize.getHeight();
  if (y + alturaNecesaria > altoPagina - MARGEN_PDF) {
    doc.addPage();
    return MARGEN_PDF;
  }
  return y;
}

/**
 * Inserta una gráfica (PNG generado por `graficas-pdf.ts`) centrada, saltando de página si no
 * cabe en el espacio restante. Devuelve el nuevo cursor `y`.
 */
export function insertarGraficaPdf(
  doc: jsPDF,
  dataUrlPng: string,
  y: number,
  anchoMax = ANCHO_MAX_GRAFICA,
): number {
  const anchoPagina = doc.internal.pageSize.getWidth();
  const altoPagina = doc.internal.pageSize.getHeight();
  const ancho = Math.min(anchoMax, anchoPagina - MARGEN_PDF * 2);
  const alto = ancho / RELACION_ASPECTO_GRAFICA;

  let yFinal = y;
  if (yFinal + alto > altoPagina - MARGEN_PDF) {
    doc.addPage();
    yFinal = MARGEN_PDF;
  }

  const x = (anchoPagina - ancho) / 2;
  doc.addImage(dataUrlPng, "PNG", x, yFinal, ancho, alto);
  return yFinal + alto + 20;
}

/**
 * Marca de agua diagonal "DEMO" sobre TODAS las páginas ya generadas —
 * llamar al final, justo antes de `doc.save(...)`, para que cubra también
 * las páginas que se fueron agregando con `addPage()` durante el reporte.
 * Solo para cuentas plan "basic" (pedido del cliente, correcciones-1-octubre
 * punto E19): el PDF de Infografía no debe poder pasar por un reporte
 * "oficial" sin dejar claro que sale de una cuenta Demo.
 */
export function dibujarMarcaDeAgua(doc: jsPDF, texto = "DEMO"): void {
  const anchoPagina = doc.internal.pageSize.getWidth();
  const altoPagina = doc.internal.pageSize.getHeight();
  const totalPáginas = doc.getNumberOfPages();

  for (let página = 1; página <= totalPáginas; página++) {
    doc.setPage(página);
    doc.saveGraphicsState();
    doc.setGState(doc.GState({ opacity: 0.08 }));
    doc.setTextColor(...COLOR_MARCA_NAVY_RGB);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(92);
    doc.text(texto, anchoPagina / 2, altoPagina / 2, {
      align: "center",
      angle: 35,
    });
    doc.restoreGraphicsState();
  }
}
