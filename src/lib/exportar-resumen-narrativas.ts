import { jsPDF } from "jspdf";
import PptxGenJS from "pptxgenjs";
import type { HashtagReal } from "@/lib/api";
import type { PaisMapa } from "@/components/charts/grafica-mapa-paises";
import type { PalabraClaveReal } from "@/lib/palabras-clave-cliente";
import {
  ALTO_ENCABEZADO_SECCION,
  alturaGrafica,
  asegurarEspacio,
  dibujarMarcaDeAgua,
  dibujarPortadaPdf,
  dibujarTarjetasKpiPdf,
  insertarGraficaPdf,
  MARGEN_PDF,
} from "@/lib/reportes/estilo-pdf";
import { registrarIntentoDescargaReporte, TopeDescargasError } from "@/lib/exportar-resumen-tope";
import {
  agregarGraficaNativaPptx,
  agregarPortadaPptx,
  agregarTarjetasKpiPptx,
} from "@/lib/reportes/estilo-pptx";
import { generarBarraComparativa } from "@/lib/reportes/graficas-pdf";
import { cargarLogoPng } from "@/lib/reportes/logo";
import type { ResumenNarrativasReal } from "@/lib/resumen-narrativas-cliente";
import type { FuenteMenciones } from "@/types";

function fechaArchivo(): string {
  return new Date().toISOString().slice(0, 10);
}

function dispararDescarga(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

function dispararTexto(contenido: string, nombre: string, mime: string) {
  dispararDescarga(
    new Blob([contenido], { type: `${mime};charset=utf-8` }),
    nombre,
  );
}

function topPaíses(países: PaisMapa[]) {
  return [...países].sort((a, b) => b.menciones - a.menciones).slice(0, 8);
}

function construirMarkdown(
  resumen: ResumenNarrativasReal,
  hashtags: HashtagReal[],
  palabrasClave: PalabraClaveReal[],
  países: PaisMapa[],
  fuentes: FuenteMenciones[],
  alcanceEtiqueta: string,
): string {
  const regionesTop = topPaíses(países);

  return [
    "# Resumen IA de narrativas",
    "",
    `Generado: ${new Date().toLocaleString("es-MX")}`,
    `Alcance: ${alcanceEtiqueta}`,
    "",
    "## Panorama",
    "",
    resumen.texto,
    "",
    `| Métrica | Valor |`,
    `| --- | --- |`,
    ...resumen.chips.map((chip) => `| ${chip.etiqueta} | ${chip.valor} |`),
    "",
    "## Lectura IA",
    "",
    ...resumen.lectura.map((punto) => `- ${punto}`),
    "",
    "## Hashtags más frecuentes",
    "",
    ...hashtags
      .slice(0, 10)
      .map((h) => `- ${h.hashtag}: ${h.total.toLocaleString("es-MX")} menciones`),
    "",
    "## Palabras clave más frecuentes",
    "",
    ...palabrasClave
      .slice(0, 10)
      .map((p) => `- ${p.palabra}: ${p.total.toLocaleString("es-MX")} menciones`),
    "",
    "## Fuentes con mayor actividad",
    "",
    ...fuentes.map(
      (f) => `- ${f.nombre}: ${f.total.toLocaleString("es-MX")} (${f.porcentaje}%)`,
    ),
    "",
    "## Países con mayor cobertura",
    "",
    ...regionesTop.map(
      (país) => `- ${país.pais}: ${país.menciones.toLocaleString("es-MX")} menciones`,
    ),
    "",
  ].join("\n");
}

export function descargarResumenNarrativasMarkdown(
  resumen: ResumenNarrativasReal,
  hashtags: HashtagReal[],
  palabrasClave: PalabraClaveReal[],
  países: PaisMapa[],
  fuentes: FuenteMenciones[],
  alcanceEtiqueta: string,
) {
  dispararTexto(
    construirMarkdown(resumen, hashtags, palabrasClave, países, fuentes, alcanceEtiqueta),
    `resumen-ia-narrativas-${fechaArchivo()}.md`,
    "text/markdown",
  );
}

export async function descargarResumenNarrativasPdf(
  resumen: ResumenNarrativasReal,
  hashtags: HashtagReal[],
  palabrasClave: PalabraClaveReal[],
  países: PaisMapa[],
  fuentes: FuenteMenciones[],
  alcanceEtiqueta: string,
) {
  const registro = await registrarIntentoDescargaReporte();
  if (!registro.permitido) throw new TopeDescargasError(registro.tope ?? 3);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margen = MARGEN_PDF;
  const ancho = doc.internal.pageSize.getWidth() - margen * 2;
  let y = margen;

  const escribir = (
    texto: string,
    size = 11,
    estilo: "normal" | "bold" = "normal",
  ) => {
    doc.setFont("helvetica", estilo);
    doc.setFontSize(size);
    const lineas = doc.splitTextToSize(texto, ancho) as string[];
    for (const linea of lineas) {
      if (y > doc.internal.pageSize.getHeight() - margen) {
        doc.addPage();
        y = margen;
      }
      doc.text(linea, margen, y);
      y += size + 4;
    }
  };

  const logoPng = await cargarLogoPng();
  y = dibujarPortadaPdf(doc, {
    logoPng,
    titulo: "Resumen IA de narrativas",
    subtitulo: alcanceEtiqueta,
    fecha: new Date().toLocaleString("es-MX"),
  });
  y += 8;

  escribir("Panorama", 14, "bold");
  y += 4;
  escribir(resumen.texto, 11);
  y += 8;

  y = dibujarTarjetasKpiPdf(
    doc,
    y,
    resumen.chips.map((chip) => ({ etiqueta: chip.etiqueta, valor: chip.valor })),
  );

  escribir("Lectura IA", 14, "bold");
  y += 4;
  for (const punto of resumen.lectura) {
    escribir(`• ${punto}`, 10);
  }
  y += 10;

  if (hashtags.length > 0) {
    y = asegurarEspacio(doc, y, ALTO_ENCABEZADO_SECCION + alturaGrafica(doc));
  }
  escribir("Hashtags", 14, "bold");
  y += 4;
  if (hashtags.length > 0) {
    y = insertarGraficaPdf(
      doc,
      generarBarraComparativa(
        hashtags.map((h) => h.hashtag),
        hashtags.map((h) => h.total),
      ),
      y,
    );
  }
  for (const item of hashtags.slice(0, 8)) {
    escribir(`${item.hashtag}: ${item.total.toLocaleString("es-MX")}`, 10);
  }
  y += 8;

  if (palabrasClave.length > 0) {
    y = asegurarEspacio(doc, y, ALTO_ENCABEZADO_SECCION + alturaGrafica(doc));
  }
  escribir("Palabras clave", 14, "bold");
  y += 4;
  if (palabrasClave.length > 0) {
    y = insertarGraficaPdf(
      doc,
      generarBarraComparativa(
        palabrasClave.map((p) => p.palabra),
        palabrasClave.map((p) => p.total),
      ),
      y,
    );
  }
  for (const item of palabrasClave.slice(0, 8)) {
    escribir(`${item.palabra}: ${item.total.toLocaleString("es-MX")}`, 10);
  }
  y += 8;

  if (fuentes.length > 0) {
    y = asegurarEspacio(doc, y, ALTO_ENCABEZADO_SECCION + alturaGrafica(doc));
  }
  escribir("Fuentes", 14, "bold");
  y += 4;
  if (fuentes.length > 0) {
    y = insertarGraficaPdf(
      doc,
      generarBarraComparativa(
        fuentes.map((f) => f.nombre),
        fuentes.map((f) => f.porcentaje),
      ),
      y,
    );
  }
  for (const fuente of fuentes) {
    escribir(`${fuente.nombre}: ${fuente.total.toLocaleString("es-MX")} (${fuente.porcentaje}%)`, 10);
  }
  y += 8;

  const regionesTop = topPaíses(países);
  if (regionesTop.length > 0) {
    y = asegurarEspacio(doc, y, ALTO_ENCABEZADO_SECCION + alturaGrafica(doc));
  }
  escribir("Países con mayor cobertura", 14, "bold");
  y += 4;
  if (regionesTop.length > 0) {
    y = insertarGraficaPdf(
      doc,
      generarBarraComparativa(
        regionesTop.map((p) => p.pais),
        regionesTop.map((p) => p.menciones),
      ),
      y,
    );
  }
  for (const país of regionesTop) {
    escribir(`${país.pais}: ${país.menciones.toLocaleString("es-MX")} menciones`, 10);
  }

  if (registro.tope != null) dibujarMarcaDeAgua(doc);
  doc.save(`resumen-ia-narrativas-${fechaArchivo()}.pdf`);
}

export async function descargarResumenNarrativasPptx(
  resumen: ResumenNarrativasReal,
  hashtags: HashtagReal[],
  palabrasClave: PalabraClaveReal[],
  países: PaisMapa[],
  fuentes: FuenteMenciones[],
  alcanceEtiqueta: string,
) {
  const pptx = new PptxGenJS();
  pptx.author = "Sentiment Unicornio";
  pptx.title = "Resumen IA de narrativas";

  const logoPng = await cargarLogoPng();
  agregarPortadaPptx(pptx, {
    logoPng,
    subtitulo: `Resumen IA de narrativas · ${alcanceEtiqueta}`,
    fecha: new Date().toLocaleString("es-MX"),
  });

  const intro = pptx.addSlide();
  intro.addText("Resumen IA de narrativas", {
    x: 0.5,
    y: 0.4,
    w: 9,
    h: 0.5,
    fontSize: 24,
    bold: true,
    color: "0056A4",
  });
  intro.addText(resumen.texto, {
    x: 0.5,
    y: 1.05,
    w: 9,
    h: 1.3,
    fontSize: 14,
    color: "333333",
  });

  agregarTarjetasKpiPptx(
    intro,
    2.45,
    resumen.chips.map((chip) => ({ etiqueta: chip.etiqueta, valor: chip.valor })),
  );

  const lectura = pptx.addSlide();
  lectura.addText("Lectura IA", {
    x: 0.5,
    y: 0.4,
    w: 9,
    h: 0.45,
    fontSize: 20,
    bold: true,
    color: "1F3C7A",
  });
  lectura.addText(resumen.lectura.map((punto) => `• ${punto}`).join("\n\n"), {
    x: 0.5,
    y: 1.05,
    w: 9,
    h: 4,
    fontSize: 14,
    color: "333333",
  });

  if (hashtags.length > 0) {
    const hashtagsSlide = pptx.addSlide();
    hashtagsSlide.addText("Hashtags más frecuentes", {
      x: 0.5,
      y: 0.35,
      w: 9,
      h: 0.4,
      fontSize: 20,
      bold: true,
      color: "1F3C7A",
    });
    agregarGraficaNativaPptx(
      hashtagsSlide,
      "bar",
      hashtags.slice(0, 6).map((h) => h.hashtag),
      [{ nombre: "Menciones", valores: hashtags.slice(0, 6).map((h) => h.total) }],
      { x: 0.5, y: 0.9, w: 9, h: 3.9 },
    );
  }

  if (palabrasClave.length > 0) {
    const frasesSlide = pptx.addSlide();
    frasesSlide.addText("Palabras clave más frecuentes", {
      x: 0.5,
      y: 0.35,
      w: 9,
      h: 0.4,
      fontSize: 20,
      bold: true,
      color: "1F3C7A",
    });
    agregarGraficaNativaPptx(
      frasesSlide,
      "bar",
      palabrasClave.slice(0, 6).map((p) => p.palabra),
      [{ nombre: "Menciones", valores: palabrasClave.slice(0, 6).map((p) => p.total) }],
      { x: 0.5, y: 0.9, w: 9, h: 3.9 },
    );
  }

  if (fuentes.length > 0) {
    const fuentesSlide = pptx.addSlide();
    fuentesSlide.addText("Fuentes con mayor actividad", {
      x: 0.5,
      y: 0.35,
      w: 9,
      h: 0.4,
      fontSize: 20,
      bold: true,
      color: "1F3C7A",
    });
    agregarGraficaNativaPptx(
      fuentesSlide,
      "bar",
      fuentes.map((f) => f.nombre),
      [{ nombre: "Alcance %", valores: fuentes.map((f) => f.porcentaje) }],
      { x: 0.5, y: 0.9, w: 9, h: 3.9 },
    );
  }

  const regionesTopPptx = topPaíses(países);
  if (regionesTopPptx.length > 0) {
    const regionesSlide = pptx.addSlide();
    regionesSlide.addText("Países con mayor cobertura", {
      x: 0.5,
      y: 0.35,
      w: 9,
      h: 0.4,
      fontSize: 20,
      bold: true,
      color: "1F3C7A",
    });
    agregarGraficaNativaPptx(
      regionesSlide,
      "bar",
      regionesTopPptx.map((p) => p.pais),
      [{ nombre: "Menciones", valores: regionesTopPptx.map((p) => p.menciones) }],
      { x: 0.5, y: 0.9, w: 9, h: 3.9 },
    );
  }

  await pptx.writeFile({
    fileName: `resumen-ia-narrativas-${fechaArchivo()}.pptx`,
  });
}
