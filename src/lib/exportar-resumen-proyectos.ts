import { jsPDF } from "jspdf";
import PptxGenJS from "pptxgenjs";
import { ETIQUETAS_TIPO_PROYECTO } from "@/lib/mock/proyectos";
import {
  calcularPanoramaProyectos,
  construirTextoResumenIa,
  metricasProyectoVacías,
  narrativaIaProyecto,
} from "@/lib/mock/resumen-ia-proyectos";
import {
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
import {
  generarBarraComparativa,
  generarBarraSentimiento,
} from "@/lib/reportes/graficas-pdf";
import { cargarLogoPng } from "@/lib/reportes/logo";
import { repartirPorcentajesEnteros } from "@/lib/porcentajes";
import type { MetricasProyectoPanel, Proyecto, ResumenProyectos } from "@/types";

function métricasDe(
  metricasPorProyecto: Record<string, MetricasProyectoPanel>,
  proyectoId: string,
): MetricasProyectoPanel {
  return metricasPorProyecto[proyectoId] ?? metricasProyectoVacías();
}

/** Sentimiento promedio agregado entre proyectos, para la tarjeta/gráfica de panorama general. */
function agregadoSentimiento(
  proyectos: Proyecto[],
  metricasPorProyecto: Record<string, MetricasProyectoPanel>,
) {
  const métricas = proyectos.map((p) => métricasDe(metricasPorProyecto, p.id));
  const n = Math.max(métricas.length, 1);
  // Promedio exacto (sin redondear) de cada tonalidad antes de repartir el
  // 100% — si se redondea cada promedio por separado, la suma puede pasarse
  // de 100 y dejar la tercera categoría en negativo (ver menciones-backend.ts).
  const positivoExacto = métricas.reduce((total, actual) => total + actual.positivo, 0) / n;
  const negativoExacto = métricas.reduce((total, actual) => total + actual.negativo, 0) / n;
  const neutroExacto = métricas.reduce((total, actual) => total + actual.neutro, 0) / n;
  const [positivoProm, negativoProm, neutroProm] = repartirPorcentajesEnteros(
    [positivoExacto, negativoExacto, neutroExacto],
    100,
  );
  return { positivoProm, negativoProm, neutroProm };
}

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

function construirMarkdown(
  proyectos: Proyecto[],
  resumen: ResumenProyectos,
  metricasPorProyecto: Record<string, MetricasProyectoPanel>,
): string {
  const intro = construirTextoResumenIa(
    proyectos,
    resumen,
    calcularPanoramaProyectos(proyectos, metricasPorProyecto),
  );
  const lineas: string[] = [
    "# Resumen IA de proyectos",
    "",
    `Generado: ${new Date().toLocaleString("es-MX")}`,
    "",
    "## Panorama",
    "",
    intro,
    "",
    `| Métrica | Valor |`,
    `| --- | --- |`,
    `| Proyectos | ${proyectos.length} |`,
    `| Activos | ${resumen.activos} |`,
    `| Cupo | ${resumen.usados}/${resumen.limite} |`,
    `| Análisis totales | ${proyectos.reduce((a, p) => a + p.analisis, 0)} |`,
    "",
    "## Detalle por proyecto",
    "",
  ];

  for (const p of proyectos) {
    const m = métricasDe(metricasPorProyecto, p.id);
    lineas.push(
      `### ${p.nombre}`,
      "",
      `> ${narrativaIaProyecto(p, m)}`,
      "",
      `- **Estado:** ${p.estado}`,
      `- **Tipo:** ${ETIQUETAS_TIPO_PROYECTO[p.tipo]}`,
      `- **Análisis:** ${p.analisis}`,
      `- **Alcance estimado:** ${m.alcance.toLocaleString("es-MX")}`,
      `- **Alertas:** ${m.alertas}`,
      `- **Sentimiento:** ${m.positivo}% positivo · ${m.negativo}% negativo · ${m.neutro}% neutro`,
      `- **Menciones (7 días):** ${m.mencionesSemana.join(", ")}`,
      `- **Palabras clave:** ${p.palabrasClave.join(", ") || "—"}`,
      `- **Redes:** ${p.redesConectadas.join(", ") || "—"}`,
      `- **Fuentes noticias:** ${p.fuentesNoticias.length}`,
      "",
    );
  }

  return lineas.join("\n");
}

export function descargarResumenMarkdown(
  proyectos: Proyecto[],
  resumen: ResumenProyectos,
  metricasPorProyecto: Record<string, MetricasProyectoPanel>,
) {
  const md = construirMarkdown(proyectos, resumen, metricasPorProyecto);
  dispararTexto(
    md,
    `resumen-ia-proyectos-${fechaArchivo()}.md`,
    "text/markdown",
  );
}

export async function descargarResumenPdf(
  proyectos: Proyecto[],
  resumen: ResumenProyectos,
  metricasPorProyecto: Record<string, MetricasProyectoPanel>,
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
    titulo: "Resumen IA de proyectos",
    subtitulo: `${proyectos.length} proyecto${proyectos.length === 1 ? "" : "s"} monitoreados`,
    fecha: new Date().toLocaleString("es-MX"),
  });
  y += 8;

  escribir("Panorama", 14, "bold");
  y += 4;
  escribir(
    construirTextoResumenIa(
      proyectos,
      resumen,
      calcularPanoramaProyectos(proyectos, metricasPorProyecto),
    ),
    11,
  );
  y += 8;

  const analisisTotales = proyectos.reduce((a, p) => a + p.analisis, 0);
  y = dibujarTarjetasKpiPdf(doc, y, [
    { etiqueta: "Activos", valor: String(resumen.activos) },
    { etiqueta: "Cupo usado", valor: `${resumen.usados}/${resumen.limite}` },
    { etiqueta: "Análisis totales", valor: String(analisisTotales) },
  ]);

  const agregado = agregadoSentimiento(proyectos, metricasPorProyecto);
  y = insertarGraficaPdf(
    doc,
    generarBarraSentimiento({
      positivo: agregado.positivoProm,
      neutro: agregado.neutroProm,
      negativo: agregado.negativoProm,
    }),
    y,
  );
  y = insertarGraficaPdf(
    doc,
    generarBarraComparativa(
      proyectos.map((p) => p.nombre),
      proyectos.map((p) => p.analisis),
    ),
    y,
  );

  for (const p of proyectos) {
    const m = métricasDe(metricasPorProyecto, p.id);
    escribir(p.nombre, 13, "bold");
    escribir(
      `${p.estado} · ${ETIQUETAS_TIPO_PROYECTO[p.tipo]} · ${p.analisis} análisis`,
      10,
    );
    escribir(narrativaIaProyecto(p, m), 10);
    escribir(
      `Sentimiento: ${m.positivo}% positivo · ${m.negativo}% negativo · ${m.neutro}% neutro · Alcance ${m.alcance.toLocaleString("es-MX")} · Alertas ${m.alertas}`,
      10,
    );
    escribir(
      `Keywords: ${p.palabrasClave.join(", ") || "—"} · Redes: ${p.redesConectadas.join(", ") || "—"}`,
      10,
    );
    y += 6;
    y = insertarGraficaPdf(
      doc,
      generarBarraSentimiento({
        positivo: m.positivo,
        neutro: m.neutro,
        negativo: m.negativo,
      }),
      y,
      220,
    );
  }

  if (registro.tope != null) dibujarMarcaDeAgua(doc);
  doc.save(`resumen-ia-proyectos-${fechaArchivo()}.pdf`);
}

export async function descargarResumenPptx(
  proyectos: Proyecto[],
  resumen: ResumenProyectos,
  metricasPorProyecto: Record<string, MetricasProyectoPanel>,
) {
  const pptx = new PptxGenJS();
  pptx.author = "Sentiment Unicornio";
  pptx.title = "Resumen IA de proyectos";

  const logoPng = await cargarLogoPng();
  agregarPortadaPptx(pptx, {
    logoPng,
    subtitulo: `Resumen IA de proyectos · ${proyectos.length} monitoreados`,
    fecha: new Date().toLocaleString("es-MX"),
  });

  const intro = pptx.addSlide();
  intro.addText("Resumen IA de proyectos", {
    x: 0.5,
    y: 0.4,
    w: 9,
    h: 0.5,
    fontSize: 24,
    bold: true,
    color: "0056A4",
  });
  intro.addText(
    construirTextoResumenIa(
      proyectos,
      resumen,
      calcularPanoramaProyectos(proyectos, metricasPorProyecto),
    ),
    {
      x: 0.5,
      y: 1.05,
      w: 9,
      h: 1.4,
      fontSize: 14,
      color: "333333",
    },
  );

  const analisisTotales = proyectos.reduce((a, p) => a + p.analisis, 0);
  agregarTarjetasKpiPptx(intro, 2.5, [
    { etiqueta: "Activos", valor: String(resumen.activos) },
    { etiqueta: "Cupo usado", valor: `${resumen.usados}/${resumen.limite}` },
    { etiqueta: "Análisis totales", valor: String(analisisTotales) },
  ]);
  agregarGraficaNativaPptx(
    intro,
    "bar",
    proyectos.slice(0, 6).map((p) => p.nombre),
    [
      {
        nombre: "Análisis",
        valores: proyectos.slice(0, 6).map((p) => p.analisis),
      },
    ],
    { x: 0.5, y: 3.85, w: 9, h: 1.55 },
  );

  for (const p of proyectos) {
    const m = métricasDe(metricasPorProyecto, p.id);
    const slide = pptx.addSlide();
    slide.addText(p.nombre, {
      x: 0.5,
      y: 0.35,
      w: 9,
      h: 0.45,
      fontSize: 20,
      bold: true,
      color: "1F3C7A",
    });
    slide.addText(
      `${p.estado.toUpperCase()} · ${ETIQUETAS_TIPO_PROYECTO[p.tipo]} · ${p.ubicacion}`,
      {
        x: 0.5,
        y: 0.85,
        w: 9,
        h: 0.3,
        fontSize: 12,
        color: "666666",
      },
    );
    slide.addText(narrativaIaProyecto(p, m), {
      x: 0.5,
      y: 1.25,
      w: 9,
      h: 1.2,
      fontSize: 13,
      color: "333333",
    });
    slide.addText(
      `Keywords: ${p.palabrasClave.join(", ") || "—"} · Redes: ${p.redesConectadas.join(", ") || "—"}`,
      {
        x: 0.5,
        y: 2.45,
        w: 9,
        h: 0.3,
        fontSize: 11,
        color: "64748B",
      },
    );

    agregarTarjetasKpiPptx(slide, 2.85, [
      { etiqueta: "Análisis", valor: String(p.analisis) },
      { etiqueta: "Alcance", valor: m.alcance.toLocaleString("es-MX") },
      { etiqueta: "Alertas", valor: String(m.alertas) },
    ]);
    agregarGraficaNativaPptx(
      slide,
      "bar",
      ["Positivo", "Neutro", "Negativo"],
      [
        {
          nombre: "Sentimiento",
          valores: [m.positivo, m.neutro, m.negativo],
        },
      ],
      {
        x: 0.5,
        y: 4.15,
        w: 9,
        h: 1.3,
        colores: ["16A34A", "94A3B8", "DC2626"],
      },
    );
  }

  await pptx.writeFile({
    fileName: `resumen-ia-proyectos-${fechaArchivo()}.pptx`,
  });
}
