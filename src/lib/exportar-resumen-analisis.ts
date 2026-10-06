// Exportación real del análisis de IA por proyecto (resumen ejecutivo,
// narrativas, recomendaciones tal cual las escribió gpt-4o — ver
// analyses.response_json). Mismo diseño (portada, tarjetas KPI, gráficas)
// que el resto de reportes descargables, sin referencia de Bruno para este
// caso porque este análisis por proyecto no existe en su mock.
import { jsPDF } from "jspdf";
import PptxGenJS from "pptxgenjs";
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
import { generarBarraSentimiento } from "@/lib/reportes/graficas-pdf";
import { cargarLogoPng } from "@/lib/reportes/logo";
import { COLOR_NEGATIVO_RGB, COLOR_POSITIVO_RGB } from "@/lib/reportes/paleta";
import { repartirPorcentajesEnteros } from "@/lib/porcentajes";
import type { AnálisisReal } from "@/types";

function fechaArchivo(): string {
  return new Date().toISOString().slice(0, 10);
}

// PDF/PPTX son texto plano (sin renderer de markdown) — el **negrita** que
// ahora trae resumenEjecutivo/resumen_titular (ver resumen-ia-real.tsx) se
// vería como asteriscos literales ahí. El export a Markdown SÍ lo conserva
// (real markdown, se renderiza bien).
function sinNegritas(texto: string): string {
  return texto.replace(/\*\*/g, "");
}

function nombreBase(análisis: AnálisisReal): string {
  const slug =
    análisis.tema
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 42) || "proyecto";
  return `resumen-ia-${slug}-${fechaArchivo()}`;
}

/** Distribución real de narrativas por tonalidad (no de menciones — `narrativa.menciones` es texto libre de la IA, no un número parseable de forma confiable). */
export function tonalidadNarrativas(análisis: AnálisisReal) {
  const contar = (clave: string) =>
    análisis.narrativas.filter((n) => n.sentimiento.toLowerCase() === clave).length;
  const positivoConteo = contar("positivo");
  const negativoConteo = contar("negativo");
  const neutroConteo = análisis.narrativas.length - positivoConteo - negativoConteo;
  const [positivo, negativo, neutro] = repartirPorcentajesEnteros(
    [positivoConteo, negativoConteo, neutroConteo],
    análisis.narrativas.length,
  );
  return { positivo, negativo, neutro };
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

function construirMarkdown(análisis: AnálisisReal): string {
  const líneas = [
    `# Resumen de IA — ${análisis.tema}`,
    "",
    `**Generado:** ${new Date(análisis.creadoEn).toLocaleString("es-MX")}`,
    `**Nivel de riesgo:** ${análisis.nivelRiesgo}`,
    "",
    "## Resumen ejecutivo",
    "",
    análisis.resumenEjecutivo || "Sin resumen ejecutivo en este análisis.",
    "",
  ];

  if (análisis.narrativas.length > 0) {
    líneas.push("## Narrativas detectadas", "");
    for (const n of análisis.narrativas) {
      líneas.push(
        `### ${n.nombre}`,
        "",
        `- Sentimiento: ${n.sentimiento} · Riesgo: ${n.riesgo} · Tendencia: ${n.tendencia}`,
        `- Menciones: ${n.menciones}`,
        "",
      );
    }
  }

  if (análisis.recomendaciones.length > 0) {
    líneas.push("## Recomendaciones de la IA", "", ...análisis.recomendaciones.map((r) => `- ${r}`), "");
  }

  if (análisis.hashtags.length > 0) {
    líneas.push("## Hashtags", "", análisis.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" "), "");
  }

  return líneas.join("\n");
}

export function descargarResumenAnalisisMarkdown(análisis: AnálisisReal) {
  dispararTexto(construirMarkdown(análisis), `${nombreBase(análisis)}.md`, "text/markdown");
}

export async function descargarResumenAnalisisPdf(análisis: AnálisisReal) {
  const registro = await registrarIntentoDescargaReporte();
  if (!registro.permitido) throw new TopeDescargasError(registro.tope ?? 3);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margen = MARGEN_PDF;
  const ancho = doc.internal.pageSize.getWidth() - margen * 2;
  let y = margen;

  const escribir = (texto: string, tamaño = 10, estilo: "normal" | "bold" = "normal") => {
    doc.setFont("helvetica", estilo);
    doc.setFontSize(tamaño);
    const líneas = doc.splitTextToSize(texto, ancho) as string[];
    for (const línea of líneas) {
      if (y > doc.internal.pageSize.getHeight() - margen) {
        doc.addPage();
        y = margen;
      }
      doc.text(línea, margen, y);
      y += tamaño + 4;
    }
  };

  const logoPng = await cargarLogoPng();
  y = dibujarPortadaPdf(doc, {
    logoPng,
    titulo: "Resumen de IA",
    subtitulo: análisis.tema,
    fecha: new Date(análisis.creadoEn).toLocaleString("es-MX"),
  });
  y += 8;

  escribir("Resumen ejecutivo", 15, "bold");
  y += 4;
  escribir(sinNegritas(análisis.resumenEjecutivo) || "Sin resumen ejecutivo en este análisis.", 10);
  y += 14;

  y = dibujarTarjetasKpiPdf(doc, y, [
    { etiqueta: "Nivel de riesgo", valor: análisis.nivelRiesgo },
    { etiqueta: "Narrativas detectadas", valor: String(análisis.narrativas.length) },
    { etiqueta: "Recomendaciones", valor: String(análisis.recomendaciones.length) },
    { etiqueta: "Hashtags", valor: String(análisis.hashtags.length) },
  ]);

  if (análisis.narrativas.length > 0) {
    const tono = tonalidadNarrativas(análisis);
    y = insertarGraficaPdf(
      doc,
      generarBarraSentimiento({ positivo: tono.positivo, neutro: tono.neutro, negativo: tono.negativo }),
      y,
    );
  }

  if (análisis.narrativas.length > 0) {
    y = asegurarEspacio(doc, y, ALTO_ENCABEZADO_SECCION);
    escribir("Narrativas detectadas", 15, "bold");
    y += 6;
    for (const n of análisis.narrativas) {
      escribir(n.nombre, 12, "bold");
      escribir(`${n.sentimiento} · Riesgo ${n.riesgo} · Tendencia ${n.tendencia} · ${n.menciones}`, 9);
      y += 6;
    }
    y += 8;
  }

  if (análisis.recomendaciones.length > 0) {
    escribir("Recomendaciones de la IA", 15, "bold");
    y += 5;
    escribir(análisis.recomendaciones.map((r, i) => `${i + 1}. ${r}`).join("\n"), 10);
    y += 10;
  }

  if (análisis.hashtags.length > 0) {
    escribir("Hashtags", 15, "bold");
    y += 4;
    escribir(análisis.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join("  "), 10);
  }

  if (registro.tope != null) dibujarMarcaDeAgua(doc);
  doc.save(`${nombreBase(análisis)}.pdf`);
}

export async function descargarResumenAnalisisPptx(análisis: AnálisisReal) {
  const pptx = new PptxGenJS();
  pptx.author = "Sentiment Unicornio";
  pptx.title = `Resumen IA: ${análisis.tema}`;

  const logoPng = await cargarLogoPng();
  agregarPortadaPptx(pptx, {
    logoPng,
    subtitulo: `Resumen de IA · ${análisis.tema}`,
    fecha: new Date(análisis.creadoEn).toLocaleString("es-MX"),
  });

  const resumen = pptx.addSlide();
  resumen.addText("Resumen ejecutivo", { x: 0.55, y: 0.4, w: 8.9, h: 0.45, fontSize: 22, bold: true, color: "142348" });
  resumen.addText(sinNegritas(análisis.resumenEjecutivo) || "Sin resumen ejecutivo en este análisis.", {
    x: 0.55,
    y: 1.05,
    w: 8.9,
    h: 1.5,
    fontSize: 14,
    color: "26334D",
  });

  agregarTarjetasKpiPptx(resumen, 2.65, [
    { etiqueta: "Nivel de riesgo", valor: análisis.nivelRiesgo },
    { etiqueta: "Narrativas", valor: String(análisis.narrativas.length) },
    { etiqueta: "Recomendaciones", valor: String(análisis.recomendaciones.length) },
    { etiqueta: "Hashtags", valor: String(análisis.hashtags.length) },
  ]);

  if (análisis.narrativas.length > 0) {
    const tono = tonalidadNarrativas(análisis);
    agregarGraficaNativaPptx(
      resumen,
      "bar",
      ["Positivo", "Neutro", "Negativo"],
      [{ nombre: "Narrativas", valores: [tono.positivo, tono.neutro, tono.negativo] }],
      { x: 0.55, y: 4.05, w: 8.9, h: 1.35, colores: ["16A34A", "94A3B8", "DC2626"] },
    );
  }

  if (análisis.narrativas.length > 0) {
    const narrativasSlide = pptx.addSlide();
    narrativasSlide.addText("Narrativas detectadas", {
      x: 0.55,
      y: 0.35,
      w: 8.9,
      h: 0.5,
      fontSize: 20,
      bold: true,
      color: "142348",
    });
    narrativasSlide.addText(
      análisis.narrativas
        .map((n) => `${n.nombre}\nSentimiento: ${n.sentimiento} · Riesgo: ${n.riesgo} · Tendencia: ${n.tendencia} · ${n.menciones}`)
        .join("\n\n"),
      { x: 0.55, y: 1, w: 8.9, h: 4, fontSize: 13, color: "26334D" },
    );
  }

  if (análisis.recomendaciones.length > 0) {
    const slideRec = pptx.addSlide();
    slideRec.addText("Recomendaciones de la IA", { x: 0.55, y: 0.4, w: 8.9, h: 0.45, fontSize: 22, bold: true, color: "142348" });
    slideRec.addText(análisis.recomendaciones.map((r, i) => `${i + 1}. ${r}`).join("\n"), {
      x: 0.55,
      y: 1.1,
      w: 8.9,
      h: 4,
      fontSize: 14,
      color: "26334D",
    });
  }

  await pptx.writeFile({ fileName: `${nombreBase(análisis)}.pptx` });
}
