import { jsPDF } from "jspdf";
import PptxGenJS from "pptxgenjs";
import { formatearAlcanceCompacto } from "@/lib/mock/dashboard-general";
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
import type { RespuestaBenchmarking } from "@/types";

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

function introBenchmarking(datos: RespuestaBenchmarking): string {
  return (
    `${datos.resumen.liderMenciones} concentra la mayor conversación. ` +
    `${datos.resumen.liderAlcance} lidera el alcance total y ` +
    `${datos.resumen.liderSentimiento} tiene la mejor proporción de sentimiento positivo.`
  );
}

function construirMarkdown(datos: RespuestaBenchmarking): string {
  const intro = introBenchmarking(datos);

  return [
    "# Resumen IA de benchmarking",
    "",
    `Generado: ${new Date().toLocaleString("es-MX")}`,
    `Período: ${datos.período.inicio} – ${datos.período.fin}`,
    "",
    "## Panorama",
    "",
    intro,
    "",
    "## Lectura IA",
    "",
    ...datos.resumen.lectura.map((punto) => `- ${punto}`),
    "",
    "## Vista general por proyecto",
    "",
    `| Proyecto | Menciones | Alcance | Sentimiento positivo |`,
    `| --- | --- | --- | --- |`,
    ...datos.proyectos.map(
      (p) =>
        `| ${p.nombre} | ${p.mencionesTotales.toLocaleString("es-MX")} | ${formatearAlcanceCompacto(p.alcanceRedesSociales + p.alcanceFueraRedes)} | ${p.mencionesPositivasPorcentaje}% |`,
    ),
    "",
  ].join("\n");
}

export function descargarResumenBenchmarkingMarkdown(
  datos: RespuestaBenchmarking,
) {
  dispararTexto(
    construirMarkdown(datos),
    `resumen-ia-benchmarking-${fechaArchivo()}.md`,
    "text/markdown",
  );
}

export async function descargarResumenBenchmarkingPdf(
  datos: RespuestaBenchmarking,
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
    titulo: "Resumen IA de benchmarking",
    subtitulo: `${datos.proyectos.length} proyectos comparados`,
    fecha: `${datos.período.inicio} – ${datos.período.fin}`,
  });
  y += 8;

  escribir("Panorama", 14, "bold");
  y += 4;
  escribir(introBenchmarking(datos), 11);
  y += 8;

  y = dibujarTarjetasKpiPdf(doc, y, [
    { etiqueta: "Líder en menciones", valor: datos.resumen.liderMenciones },
    { etiqueta: "Líder en alcance", valor: datos.resumen.liderAlcance },
    { etiqueta: "Mejor sentimiento", valor: datos.resumen.liderSentimiento },
  ]);

  escribir("Lectura IA", 14, "bold");
  y += 4;
  for (const punto of datos.resumen.lectura) {
    escribir(`• ${punto}`, 10);
  }
  y += 10;

  y = asegurarEspacio(doc, y, ALTO_ENCABEZADO_SECCION + alturaGrafica(doc));
  escribir("Menciones por proyecto", 14, "bold");
  y += 4;
  y = insertarGraficaPdf(
    doc,
    generarBarraComparativa(
      datos.proyectos.map((p) => p.nombre),
      datos.proyectos.map((p) => p.mencionesTotales),
    ),
    y,
  );
  y += 6;

  y = asegurarEspacio(doc, y, ALTO_ENCABEZADO_SECCION + alturaGrafica(doc));
  escribir("Alcance por proyecto", 14, "bold");
  y += 4;
  y = insertarGraficaPdf(
    doc,
    generarBarraComparativa(
      datos.proyectos.map((p) => p.nombre),
      datos.proyectos.map((p) => p.alcanceRedesSociales + p.alcanceFueraRedes),
    ),
    y,
  );
  y += 6;

  y = asegurarEspacio(doc, y, ALTO_ENCABEZADO_SECCION + alturaGrafica(doc));
  escribir("Sentimiento positivo por proyecto", 14, "bold");
  y += 4;
  y = insertarGraficaPdf(
    doc,
    generarBarraComparativa(
      datos.proyectos.map((p) => p.nombre),
      datos.proyectos.map((p) => p.mencionesPositivasPorcentaje),
    ),
    y,
  );
  y += 6;

  escribir("Vista general", 14, "bold");
  y += 4;
  for (const p of datos.proyectos) {
    escribir(
      `${p.nombre}: ${p.mencionesTotales.toLocaleString("es-MX")} menciones · ${formatearAlcanceCompacto(p.alcanceRedesSociales + p.alcanceFueraRedes)} alcance · ${p.mencionesPositivasPorcentaje}% positivo`,
      10,
    );
  }

  if (registro.tope != null) dibujarMarcaDeAgua(doc);
  doc.save(`resumen-ia-benchmarking-${fechaArchivo()}.pdf`);
}

export async function descargarResumenBenchmarkingPptx(
  datos: RespuestaBenchmarking,
) {
  const pptx = new PptxGenJS();
  pptx.author = "Sentiment Unicornio";
  pptx.title = "Resumen IA de benchmarking";

  const logoPng = await cargarLogoPng();
  agregarPortadaPptx(pptx, {
    logoPng,
    subtitulo: `Resumen IA de benchmarking · ${datos.proyectos.length} proyectos comparados`,
    fecha: `${datos.período.inicio} – ${datos.período.fin}`,
  });

  const intro = pptx.addSlide();
  intro.addText("Resumen IA de benchmarking", {
    x: 0.5,
    y: 0.4,
    w: 9,
    h: 0.5,
    fontSize: 24,
    bold: true,
    color: "0056A4",
  });
  intro.addText(introBenchmarking(datos), {
    x: 0.5,
    y: 1.05,
    w: 9,
    h: 1.3,
    fontSize: 14,
    color: "333333",
  });

  agregarTarjetasKpiPptx(intro, 2.45, [
    { etiqueta: "Líder en menciones", valor: datos.resumen.liderMenciones },
    { etiqueta: "Líder en alcance", valor: datos.resumen.liderAlcance },
    { etiqueta: "Mejor sentimiento", valor: datos.resumen.liderSentimiento },
  ]);

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
  lectura.addText(
    datos.resumen.lectura.map((punto) => `• ${punto}`).join("\n\n"),
    {
      x: 0.5,
      y: 1.05,
      w: 9,
      h: 4,
      fontSize: 14,
      color: "333333",
    },
  );

  const menciones = pptx.addSlide();
  menciones.addText("Menciones por proyecto", {
    x: 0.5,
    y: 0.35,
    w: 9,
    h: 0.4,
    fontSize: 20,
    bold: true,
    color: "1F3C7A",
  });
  agregarGraficaNativaPptx(
    menciones,
    "bar",
    datos.proyectos.map((p) => p.nombre),
    [
      {
        nombre: "Menciones totales",
        valores: datos.proyectos.map((p) => p.mencionesTotales),
      },
    ],
    { x: 0.5, y: 0.9, w: 9, h: 3.9 },
  );

  const alcance = pptx.addSlide();
  alcance.addText("Alcance por proyecto", {
    x: 0.5,
    y: 0.35,
    w: 9,
    h: 0.4,
    fontSize: 20,
    bold: true,
    color: "1F3C7A",
  });
  agregarGraficaNativaPptx(
    alcance,
    "bar",
    datos.proyectos.map((p) => p.nombre),
    [
      {
        nombre: "Alcance",
        valores: datos.proyectos.map(
          (p) => p.alcanceRedesSociales + p.alcanceFueraRedes,
        ),
      },
    ],
    { x: 0.5, y: 0.9, w: 9, h: 3.9 },
  );

  const sentimiento = pptx.addSlide();
  sentimiento.addText("Sentimiento positivo por proyecto", {
    x: 0.5,
    y: 0.35,
    w: 9,
    h: 0.4,
    fontSize: 20,
    bold: true,
    color: "1F3C7A",
  });
  agregarGraficaNativaPptx(
    sentimiento,
    "bar",
    datos.proyectos.map((p) => p.nombre),
    [
      {
        nombre: "Sentimiento positivo %",
        valores: datos.proyectos.map((p) => p.mencionesPositivasPorcentaje),
      },
    ],
    { x: 0.5, y: 0.9, w: 9, h: 3.9, colores: ["16A34A"] },
  );

  const detalle = pptx.addSlide();
  detalle.addText("Vista general por proyecto", {
    x: 0.5,
    y: 0.35,
    w: 9,
    h: 0.4,
    fontSize: 20,
    bold: true,
    color: "1F3C7A",
  });
  detalle.addText(
    datos.proyectos
      .map(
        (p) =>
          `${p.nombre}: ${p.mencionesTotales.toLocaleString("es-MX")} menciones · ${formatearAlcanceCompacto(p.alcanceRedesSociales + p.alcanceFueraRedes)} alcance · ${p.mencionesPositivasPorcentaje}% positivo`,
      )
      .join("\n"),
    {
      x: 0.5,
      y: 0.95,
      w: 9,
      h: 4.3,
      fontSize: 14,
      color: "222222",
    },
  );

  await pptx.writeFile({
    fileName: `resumen-ia-benchmarking-${fechaArchivo()}.pptx`,
  });
}
