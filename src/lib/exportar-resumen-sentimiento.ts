import { jsPDF } from "jspdf";
import PptxGenJS from "pptxgenjs";
// Mock: `panoramaSentimientoIa`/`construirTextoResumenIaSentimiento`/
// `narrativaDestacadaSentimiento` simulan la lectura de IA del MVP a partir de
// `RespuestaSentimiento`. Al conectar backend, ese tipo (desglose/tonalidadPorFuente/series) ya
// es el contrato — solo cambia de dónde viene el objeto `datos`, esta función no cambia.
import {
  construirTextoResumenIaSentimiento,
  narrativaDestacadaSentimiento,
  panoramaSentimientoIa,
} from "@/lib/mock/resumen-ia-sentimiento";
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
import {
  generarBarraApiladaCategorias,
  generarBarraSentimiento,
} from "@/lib/reportes/graficas-pdf";
import { cargarLogoPng } from "@/lib/reportes/logo";
import {
  COLOR_NEGATIVO,
  COLOR_NEGATIVO_RGB,
  COLOR_NEUTRO,
  COLOR_POSITIVO,
  COLOR_POSITIVO_RGB,
} from "@/lib/reportes/paleta";
import type { RespuestaSentimiento } from "@/types";

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

function formatearPorcentaje(valor: number): string {
  return `${valor.toLocaleString("es-MX", {
    maximumFractionDigits: valor < 1 ? 2 : 1,
  })}%`;
}

function formatearEntero(valor: number): string {
  return valor.toLocaleString("es-MX");
}

/**
 * Texto legible del desglose de una fuente — con etiqueta explícita en cada valor para que se
 * entienda sin depender del color o del signo (+/-/~ solos no dicen a qué tonalidad corresponden).
 */
function desgloseTextoFuente(
  fuente: RespuestaSentimiento["tonalidadPorFuente"][number],
): string {
  const total =
    fuente.positivo + fuente.negativo + fuente.neutro + fuente.sinCalificar ||
    1;
  return `Positivo ${formatearPorcentaje((fuente.positivo / total) * 100)} · Negativo ${formatearPorcentaje((fuente.negativo / total) * 100)} · Neutro ${formatearPorcentaje((fuente.neutro / total) * 100)}`;
}

/** Desglose porcentual positivo/negativo/neutro por fuente, para la gráfica apilada. */
function porcentajesPorFuente(datos: RespuestaSentimiento) {
  const fuentes = datos.tonalidadPorFuente.map((f) => f.fuente);
  const calcular = (clave: "positivo" | "negativo" | "neutro") =>
    datos.tonalidadPorFuente.map((f) => {
      const total = f.positivo + f.negativo + f.neutro + f.sinCalificar || 1;
      return Math.round((f[clave] / total) * 100);
    });
  return {
    fuentes,
    positivo: calcular("positivo"),
    negativo: calcular("negativo"),
    neutro: calcular("neutro"),
  };
}

function construirMarkdown(
  datos: RespuestaSentimiento,
  nombreProyecto: string | null,
): string {
  const intro = construirTextoResumenIaSentimiento(datos, nombreProyecto);
  const panorama = panoramaSentimientoIa(datos);
  const destacados = narrativaDestacadaSentimiento(datos);
  const alcance = nombreProyecto ?? "Todos los proyectos";

  const lineas: string[] = [
    "# Resumen IA de sentimiento",
    "",
    `Generado: ${new Date().toLocaleString("es-MX")}`,
    `Alcance: ${alcance}`,
    `Período: ${datos.período.inicio} – ${datos.período.fin}`,
    "",
    "## Panorama",
    "",
    intro,
    "",
    `| Tonalidad | Menciones | Participación |`,
    `| --- | --- | --- |`,
    `| Positivo | ${formatearEntero(panorama.mencionesPositivas)} | ${formatearPorcentaje(panorama.positivo)} |`,
    `| Negativo | ${formatearEntero(panorama.mencionesNegativas)} | ${formatearPorcentaje(panorama.negativo)} |`,
    `| Neutral | ${formatearEntero(panorama.mencionesNeutras)} | ${formatearPorcentaje(panorama.neutro)} |`,
    `| Sin calificar | — | ${formatearPorcentaje(panorama.sinCalificar)} |`,
    "",
    "## Lectura de tono",
    "",
    ...destacados.map((punto) => `- ${punto}`),
    "",
    "## Tonalidad por fuente",
    "",
  ];

  for (const fuente of datos.tonalidadPorFuente) {
    const total =
      fuente.positivo + fuente.negativo + fuente.neutro + fuente.sinCalificar ||
      1;
    lineas.push(
      `### ${fuente.fuente}`,
      "",
      `- **Positivo:** ${formatearPorcentaje((fuente.positivo / total) * 100)} (${formatearEntero(fuente.positivo)})`,
      `- **Negativo:** ${formatearPorcentaje((fuente.negativo / total) * 100)} (${formatearEntero(fuente.negativo)})`,
      `- **Neutral:** ${formatearPorcentaje((fuente.neutro / total) * 100)} (${formatearEntero(fuente.neutro)})`,
      "",
    );
  }

  lineas.push("## Menciones positivas destacadas", "");
  for (const mención of datos.mencionesPositivas.slice(0, 4)) {
    lineas.push(
      `- **${mención.fuente}** (${mención.autor}): ${mención.extracto}`,
    );
  }
  lineas.push("", "## Menciones negativas destacadas", "");
  for (const mención of datos.mencionesNegativas.slice(0, 4)) {
    lineas.push(
      `- **${mención.fuente}** (${mención.autor}): ${mención.extracto}`,
    );
  }
  lineas.push("");

  return lineas.join("\n");
}

export function descargarResumenSentimientoMarkdown(
  datos: RespuestaSentimiento,
  nombreProyecto: string | null,
) {
  dispararTexto(
    construirMarkdown(datos, nombreProyecto),
    `resumen-ia-sentimiento-${fechaArchivo()}.md`,
    "text/markdown",
  );
}

export async function descargarResumenSentimientoPdf(
  datos: RespuestaSentimiento,
  nombreProyecto: string | null,
) {
  const registro = await registrarIntentoDescargaReporte();
  if (!registro.permitido) throw new TopeDescargasError(registro.tope ?? 3);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margen = MARGEN_PDF;
  const ancho = doc.internal.pageSize.getWidth() - margen * 2;
  let y = margen;
  const panorama = panoramaSentimientoIa(datos);

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
    titulo: "Resumen IA de sentimiento",
    subtitulo: nombreProyecto ?? "Todos los proyectos",
    fecha: `${datos.período.inicio} – ${datos.período.fin}`,
  });
  y += 8;

  escribir("Panorama", 14, "bold");
  y += 4;
  escribir(construirTextoResumenIaSentimiento(datos, nombreProyecto), 11);
  y += 8;

  y = dibujarTarjetasKpiPdf(doc, y, [
    {
      etiqueta: "Positivo",
      valor: formatearPorcentaje(panorama.positivo),
      colorRgb: COLOR_POSITIVO_RGB,
    },
    {
      etiqueta: "Negativo",
      valor: formatearPorcentaje(panorama.negativo),
      colorRgb: COLOR_NEGATIVO_RGB,
    },
    { etiqueta: "Neutral", valor: formatearPorcentaje(panorama.neutro) },
    {
      etiqueta: "Menciones positivas",
      valor: formatearEntero(panorama.mencionesPositivas),
    },
  ]);

  y = insertarGraficaPdf(
    doc,
    generarBarraSentimiento({
      positivo: panorama.positivo,
      neutro: panorama.neutro,
      negativo: panorama.negativo,
    }),
    y,
  );

  escribir("Lectura de tono", 14, "bold");
  y += 4;
  for (const punto of narrativaDestacadaSentimiento(datos)) {
    escribir(`• ${punto}`, 10);
  }
  y += 10;
  if (datos.tonalidadPorFuente.length > 0) {
    y = asegurarEspacio(doc, y, ALTO_ENCABEZADO_SECCION + alturaGrafica(doc));
  }
  escribir("Tonalidad por fuente", 14, "bold");
  y += 4;
  if (datos.tonalidadPorFuente.length > 0) {
    const porFuente = porcentajesPorFuente(datos);
    y = insertarGraficaPdf(
      doc,
      generarBarraApiladaCategorias(porFuente.fuentes, [
        {
          nombre: "Positivo",
          valores: porFuente.positivo,
          color: COLOR_POSITIVO,
        },
        {
          nombre: "Negativo",
          valores: porFuente.negativo,
          color: COLOR_NEGATIVO,
        },
        { nombre: "Neutro", valores: porFuente.neutro, color: COLOR_NEUTRO },
      ]),
      y,
    );
  }
  for (const fuente of datos.tonalidadPorFuente) {
    escribir(fuente.fuente, 12, "bold");
    escribir(desgloseTextoFuente(fuente), 10);
  }

  if (registro.tope != null) dibujarMarcaDeAgua(doc);
  doc.save(`resumen-ia-sentimiento-${fechaArchivo()}.pdf`);
}

export async function descargarResumenSentimientoPptx(
  datos: RespuestaSentimiento,
  nombreProyecto: string | null,
) {
  const pptx = new PptxGenJS();
  pptx.author = "Sentiment Unicornio";
  pptx.title = "Resumen IA de sentimiento";
  const panorama = panoramaSentimientoIa(datos);

  const logoPng = await cargarLogoPng();
  agregarPortadaPptx(pptx, {
    logoPng,
    subtitulo: `Resumen IA de sentimiento · ${nombreProyecto ?? "Todos los proyectos"}`,
    fecha: `${datos.período.inicio} – ${datos.período.fin}`,
  });

  const intro = pptx.addSlide();
  intro.addText("Resumen IA de sentimiento", {
    x: 0.5,
    y: 0.4,
    w: 9,
    h: 0.5,
    fontSize: 24,
    bold: true,
    color: "0056A4",
  });
  intro.addText(construirTextoResumenIaSentimiento(datos, nombreProyecto), {
    x: 0.5,
    y: 1.05,
    w: 9,
    h: 1.3,
    fontSize: 14,
    color: "333333",
  });

  agregarTarjetasKpiPptx(intro, 2.45, [
    {
      etiqueta: "Positivo",
      valor: formatearPorcentaje(panorama.positivo),
      color: "16A34A",
    },
    {
      etiqueta: "Negativo",
      valor: formatearPorcentaje(panorama.negativo),
      color: "DC2626",
    },
    { etiqueta: "Neutral", valor: formatearPorcentaje(panorama.neutro) },
  ]);
  agregarGraficaNativaPptx(
    intro,
    "bar",
    ["Positivo", "Neutro", "Negativo"],
    [
      {
        nombre: "Sentimiento",
        valores: [panorama.positivo, panorama.neutro, panorama.negativo],
      },
    ],
    { x: 0.5, y: 3.85, w: 9, h: 1.55, colores: ["16A34A", "94A3B8", "DC2626"] },
  );

  const lectura = pptx.addSlide();
  lectura.addText("Lectura de tono", {
    x: 0.5,
    y: 0.4,
    w: 9,
    h: 0.45,
    fontSize: 20,
    bold: true,
    color: "1F3C7A",
  });
  lectura.addText(
    narrativaDestacadaSentimiento(datos)
      .map((punto) => `• ${punto}`)
      .join("\n\n"),
    {
      x: 0.5,
      y: 1.05,
      w: 9,
      h: 4,
      fontSize: 14,
      color: "333333",
    },
  );

  const fuentes = pptx.addSlide();
  fuentes.addText("Tonalidad por fuente", {
    x: 0.5,
    y: 0.35,
    w: 9,
    h: 0.4,
    fontSize: 20,
    bold: true,
    color: "1F3C7A",
  });
  if (datos.tonalidadPorFuente.length > 0) {
    const porFuente = porcentajesPorFuente(datos);
    agregarGraficaNativaPptx(
      fuentes,
      "bar",
      porFuente.fuentes,
      [
        { nombre: "Positivo", valores: porFuente.positivo },
        { nombre: "Negativo", valores: porFuente.negativo },
        { nombre: "Neutro", valores: porFuente.neutro },
      ],
      {
        x: 0.5,
        y: 0.85,
        w: 9,
        h: 2.4,
        colores: ["16A34A", "DC2626", "94A3B8"],
        apilado: true,
      },
    );
  }
  fuentes.addText(
    datos.tonalidadPorFuente
      .map((fuente) => `${fuente.fuente}: ${desgloseTextoFuente(fuente)}`)
      .join("\n"),
    {
      x: 0.5,
      y: 3.4,
      w: 9,
      h: 1.9,
      fontSize: 12,
      color: "222222",
    },
  );

  await pptx.writeFile({
    fileName: `resumen-ia-sentimiento-${fechaArchivo()}.pptx`,
  });
}
