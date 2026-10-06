// Exportación real del análisis de Búsqueda — el resumen ejecutivo, narrativas
// y recomendaciones vienen tal cual las escribió gpt-4o (mismo motor que ya
// usa el análisis de proyectos), no texto armado con plantillas sobre
// números promediados. Los "resultados destacados" son menciones reales
// encontradas por la búsqueda en vivo, con su link real.
import { jsPDF } from "jspdf";
import PptxGenJS from "pptxgenjs";
import {
  ALTO_ENCABEZADO_SECCION,
  alturaGrafica,
  asegurarEspacio,
  dibujarPortadaPdf,
  dibujarTarjetasKpiPdf,
  insertarGraficaPdf,
  MARGEN_PDF,
} from "@/lib/reportes/estilo-pdf";
import {
  agregarGraficaNativaPptx,
  agregarPortadaPptx,
  agregarTarjetasKpiPptx,
} from "@/lib/reportes/estilo-pptx";
import {
  generarBarraComparativa,
  generarBarraSentimiento,
} from "@/lib/reportes/graficas-pdf";
import { cargarLogoPng } from "@/lib/reportes/logo";
import { COLOR_NEGATIVO_RGB, COLOR_POSITIVO_RGB } from "@/lib/reportes/paleta";
import type { MenciónEditorial } from "@/types";

export type NarrativaReporteBusqueda = {
  nombre: string;
  menciones: string;
  sentimiento: string;
  riesgo: string;
  tendencia: string;
};

export type ReporteBusquedaReal = {
  consulta: string;
  generadoEn: string;
  totalResultados: number;
  totalFuentes: number;
  nivelRiesgo: string;
  sentimiento: { positivo: number; negativo: number; neutral: number };
  resumenEjecutivo: string;
  narrativas: NarrativaReporteBusqueda[];
  recomendaciones: string[];
  hashtags: string[];
  resultados: MenciónEditorial[];
};

function nombreBase(reporte: ReporteBusquedaReal): string {
  const sinAcentos = reporte.consulta
    .toLowerCase()
    .replace(/[áàäâ]/g, "a")
    .replace(/[éèëê]/g, "e")
    .replace(/[íìïî]/g, "i")
    .replace(/[óòöô]/g, "o")
    .replace(/[úùüû]/g, "u")
    .replace(/ñ/g, "n");
  const slug = sinAcentos.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 42) || "conversacion";
  return `reporte-ia-${slug}-${reporte.generadoEn.slice(0, 10)}`;
}

function construirMarkdown(reporte: ReporteBusquedaReal): string {
  const líneas = [
    "# Reporte de conversación — IA",
    "",
    `**Consulta:** ${reporte.consulta}`,
    `**Generado:** ${new Date(reporte.generadoEn).toLocaleString("es-MX")}`,
    `**Resultados reales analizados:** ${reporte.totalResultados} · **Fuentes:** ${reporte.totalFuentes}`,
    `**Nivel de riesgo:** ${reporte.nivelRiesgo}`,
    "",
    "## Resumen ejecutivo",
    "",
    reporte.resumenEjecutivo || "Sin resumen ejecutivo en este análisis.",
    "",
    `Sentimiento: ${reporte.sentimiento.positivo}% positivo · ${reporte.sentimiento.neutral}% neutro · ${reporte.sentimiento.negativo}% negativo`,
    "",
  ];

  if (reporte.narrativas.length > 0) {
    líneas.push("## Narrativas detectadas", "");
    for (const n of reporte.narrativas) {
      líneas.push(
        `### ${n.nombre}`,
        "",
        `- Sentimiento: ${n.sentimiento} · Riesgo: ${n.riesgo} · Tendencia: ${n.tendencia}`,
        `- Menciones: ${n.menciones}`,
        "",
      );
    }
  }

  if (reporte.resultados.length > 0) {
    líneas.push(
      "## Resultados destacados",
      "",
      ...reporte.resultados
        .slice(0, 12)
        .flatMap((r) => [`### ${r.título}`, "", `- Fuente: ${r.fuente}`, `- Enlace: ${r.url}`, "", r.extracto, ""]),
    );
  }

  if (reporte.recomendaciones.length > 0) {
    líneas.push("## Recomendaciones de la IA", "", ...reporte.recomendaciones.map((r) => `- ${r}`), "");
  }

  return líneas.join("\n");
}

function descargarBlob(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}

export function descargarReporteBusquedaMarkdown(reporte: ReporteBusquedaReal) {
  descargarBlob(new Blob([construirMarkdown(reporte)], { type: "text/markdown;charset=utf-8" }), `${nombreBase(reporte)}.md`);
}

export async function descargarReporteBusquedaPdf(reporte: ReporteBusquedaReal) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margen = MARGEN_PDF;
  const ancho = doc.internal.pageSize.getWidth() - margen * 2;
  const alto = doc.internal.pageSize.getHeight();
  let y = margen;

  const escribir = (texto: string, tamaño = 10, estilo: "normal" | "bold" = "normal", separación = 4) => {
    doc.setFont("helvetica", estilo);
    doc.setFontSize(tamaño);
    const líneas = doc.splitTextToSize(texto, ancho) as string[];
    for (const línea of líneas) {
      if (y > alto - margen) {
        doc.addPage();
        y = margen;
      }
      doc.text(línea, margen, y);
      y += tamaño + separación;
    }
  };

  const logoPng = await cargarLogoPng();
  y = dibujarPortadaPdf(doc, {
    logoPng,
    titulo: "Reporte de conversación",
    subtitulo: `Análisis IA · ${reporte.consulta}`,
    fecha: new Date(reporte.generadoEn).toLocaleString("es-MX"),
  });
  y += 8;

  escribir("Resumen ejecutivo", 15, "bold");
  y += 4;
  escribir(reporte.resumenEjecutivo || "Sin resumen ejecutivo en este análisis.", 10);
  y += 14;

  y = dibujarTarjetasKpiPdf(doc, y, [
    { etiqueta: "Positivo", valor: `${reporte.sentimiento.positivo}%`, colorRgb: COLOR_POSITIVO_RGB },
    { etiqueta: "Negativo", valor: `${reporte.sentimiento.negativo}%`, colorRgb: COLOR_NEGATIVO_RGB },
    { etiqueta: "Resultados analizados", valor: String(reporte.totalResultados) },
    { etiqueta: "Fuentes", valor: String(reporte.totalFuentes) },
  ]);

  y = insertarGraficaPdf(
    doc,
    generarBarraSentimiento({
      positivo: reporte.sentimiento.positivo,
      neutro: reporte.sentimiento.neutral,
      negativo: reporte.sentimiento.negativo,
    }),
    y,
  );

  if (reporte.narrativas.length > 0) {
    escribir("Narrativas detectadas", 15, "bold");
    y += 6;
    for (const n of reporte.narrativas) {
      escribir(n.nombre, 12, "bold");
      escribir(`${n.sentimiento} · Riesgo ${n.riesgo} · Tendencia ${n.tendencia} · ${n.menciones}`, 9);
      y += 6;
    }
    y += 8;
  }

  if (reporte.resultados.length > 0) {
    y = asegurarEspacio(doc, y, ALTO_ENCABEZADO_SECCION + alturaGrafica(doc));
    escribir("Resultados destacados", 15, "bold");
    y += 6;
    y = insertarGraficaPdf(
      doc,
      generarBarraComparativa(
        reporte.resultados.slice(0, 8).map((r) => (r.título.length > 28 ? `${r.título.slice(0, 27)}…` : r.título)),
        reporte.resultados.slice(0, 8).map((r) => r.alcance),
      ),
      y,
    );
    for (const r of reporte.resultados.slice(0, 10)) {
      escribir(r.título, 10, "bold");
      escribir(r.fuente, 8);
      escribir(r.extracto, 9);
      y += 7;
    }
  }

  if (reporte.recomendaciones.length > 0) {
    y += 10;
    escribir("Recomendaciones de la IA", 15, "bold");
    y += 5;
    escribir(reporte.recomendaciones.map((r, i) => `${i + 1}. ${r}`).join("\n"), 10);
  }

  doc.save(`${nombreBase(reporte)}.pdf`);
}

export async function descargarReporteBusquedaPptx(reporte: ReporteBusquedaReal) {
  const pptx = new PptxGenJS();
  pptx.author = "Sentiment Unicornio";
  pptx.title = `Reporte IA: ${reporte.consulta}`;
  pptx.subject = "Análisis de conversación";

  const logoPng = await cargarLogoPng();
  agregarPortadaPptx(pptx, {
    logoPng,
    subtitulo: `Reporte de conversación · ${reporte.consulta}`,
    fecha: new Date(reporte.generadoEn).toLocaleString("es-MX"),
  });

  const resumen = pptx.addSlide();
  resumen.addText("Resumen ejecutivo", { x: 0.55, y: 0.4, w: 8.9, h: 0.45, fontSize: 22, bold: true, color: "142348" });
  resumen.addText(reporte.resumenEjecutivo || "Sin resumen ejecutivo en este análisis.", {
    x: 0.55,
    y: 1.05,
    w: 8.9,
    h: 1.5,
    fontSize: 14,
    color: "26334D",
  });

  agregarTarjetasKpiPptx(resumen, 2.65, [
    { etiqueta: "Positivo", valor: `${reporte.sentimiento.positivo}%`, color: "16A34A" },
    { etiqueta: "Negativo", valor: `${reporte.sentimiento.negativo}%`, color: "DC2626" },
    { etiqueta: "Resultados", valor: String(reporte.totalResultados) },
    { etiqueta: "Fuentes", valor: String(reporte.totalFuentes) },
  ]);
  agregarGraficaNativaPptx(
    resumen,
    "bar",
    ["Positivo", "Neutro", "Negativo"],
    [
      {
        nombre: "Sentimiento",
        valores: [reporte.sentimiento.positivo, reporte.sentimiento.neutral, reporte.sentimiento.negativo],
      },
    ],
    { x: 0.55, y: 4.05, w: 8.9, h: 1.35, colores: ["16A34A", "94A3B8", "DC2626"] },
  );

  for (const n of reporte.narrativas) {
    const slide = pptx.addSlide();
    slide.addText(n.nombre, { x: 0.55, y: 0.35, w: 8.9, h: 0.5, fontSize: 20, bold: true, color: "142348" });
    slide.addText(
      [`Sentimiento: ${n.sentimiento}`, `Riesgo: ${n.riesgo}`, `Tendencia: ${n.tendencia}`, `Menciones: ${n.menciones}`].join("\n"),
      { x: 0.55, y: 1.1, w: 8.9, h: 2, fontSize: 14, color: "26334D" },
    );
  }

  if (reporte.recomendaciones.length > 0) {
    const slideRec = pptx.addSlide();
    slideRec.addText("Recomendaciones de la IA", { x: 0.55, y: 0.4, w: 8.9, h: 0.45, fontSize: 22, bold: true, color: "142348" });
    slideRec.addText(reporte.recomendaciones.map((r, i) => `${i + 1}. ${r}`).join("\n"), {
      x: 0.55,
      y: 1.1,
      w: 8.9,
      h: 4,
      fontSize: 14,
      color: "26334D",
    });
  }

  await pptx.writeFile({ fileName: `${nombreBase(reporte)}.pptx` });
}
