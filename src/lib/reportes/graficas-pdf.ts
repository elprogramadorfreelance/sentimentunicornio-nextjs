import {
  Chart,
  type ChartConfiguration,
  registerables,
  type ScriptableContext,
} from "chart.js";
import type {
  ClaveTonalidad,
  Degradado,
  PaletaGraficas,
} from "@/lib/paletas-graficas";
import {
  COLOR_NEGATIVO,
  COLOR_NEUTRO,
  COLOR_POSITIVO,
  COLOR_TEXTO_CUERPO_RGB,
  SERIE_CATEGORICA,
} from "./paleta";

Chart.register(...registerables);

const ANCHO_CANVAS = 640;
const ALTO_CANVAS = 340;
const FUENTE = "Helvetica, Arial, sans-serif";
const [R, G, B] = COLOR_TEXTO_CUERPO_RGB;
const COLOR_TEXTO_GRAFICA = `rgb(${R}, ${G}, ${B})`;

/**
 * Renderiza un `Chart.js` fuera del DOM (canvas nunca se monta) con animación desactivada para
 * que el dibujo sea síncrono, y devuelve un data URL PNG listo para `doc.addImage(...)` en
 * jsPDF. El chart se destruye antes de retornar para no dejar listeners/timers vivos.
 */
function renderizarComoImagenPng(config: ChartConfiguration): string {
  const canvas = document.createElement("canvas");
  canvas.width = ANCHO_CANVAS;
  canvas.height = ALTO_CANVAS;

  const chart = new Chart(canvas, {
    ...config,
    options: {
      ...config.options,
      responsive: false,
      animation: false,
      devicePixelRatio: 2,
      plugins: {
        ...config.options?.plugins,
        legend: {
          labels: { color: COLOR_TEXTO_GRAFICA, font: { family: FUENTE } },
          ...config.options?.plugins?.legend,
        },
      },
    },
  });

  const dataUrl = canvas.toDataURL("image/png");
  chart.destroy();
  return dataUrl;
}

/** Proporción de tamaño de imagen (ancho/alto) que corresponde a `renderizarComoImagenPng`. */
export const RELACION_ASPECTO_GRAFICA = ANCHO_CANVAS / ALTO_CANVAS;

export type DesgloseSentimiento = {
  positivo: number;
  neutro: number;
  negativo: number;
};

/**
 * Barra horizontal apilada de sentimiento. Consume el mismo desglose {positivo, neutro,
 * negativo} que ya calculan los builders mock de cada módulo — al conectar backend basta con
 * mapear la respuesta real a esta forma, sin tocar esta función.
 */
export function generarBarraSentimiento(desglose: DesgloseSentimiento): string {
  // Nunca debe llegar un valor negativo aquí (los tres deberían sumar 100),
  // pero se recorta a 0 como último resguardo: un valor negativo hace que
  // Chart.js extienda el eje X hacia la izquierda y se vea roto.
  const positivo = Math.max(0, desglose.positivo);
  const neutro = Math.max(0, desglose.neutro);
  const negativo = Math.max(0, desglose.negativo);
  return renderizarComoImagenPng({
    type: "bar",
    data: {
      labels: ["Sentimiento"],
      datasets: [
        {
          label: "Positivo",
          data: [positivo],
          backgroundColor: `#${COLOR_POSITIVO}`,
        },
        {
          label: "Neutro",
          data: [neutro],
          backgroundColor: `#${COLOR_NEUTRO}`,
        },
        {
          label: "Negativo",
          data: [negativo],
          backgroundColor: `#${COLOR_NEGATIVO}`,
        },
      ],
    },
    options: {
      indexAxis: "y",
      scales: {
        x: {
          stacked: true,
          min: 0,
          max: 100,
          ticks: { color: COLOR_TEXTO_GRAFICA, font: { family: FUENTE } },
        },
        y: {
          stacked: true,
          ticks: { display: false },
          grid: { display: false },
        },
      },
      plugins: { legend: { position: "bottom" } },
    },
  });
}

/**
 * Chart.js no tiene degradados por barra: se calcula en píxeles el tramo que
 * ocupa cada segmento apilado (suma de los datasets anteriores → suma + valor)
 * y se crea el gradiente sobre ese tramo, claro en la base y saturado al final.
 */
function degradadoSegmento(degradado: Degradado, eje: "x" | "y") {
  return (contexto: ScriptableContext<"bar">) => {
    const { chart, datasetIndex, dataIndex } = contexto;
    const escala = chart.scales[eje];
    if (!chart.chartArea || !escala) return degradado.plano;

    const valorDe = (indice: number) =>
      Number(chart.data.datasets[indice]?.data[dataIndex] ?? 0);
    let inicio = 0;
    for (let i = 0; i < datasetIndex; i++) inicio += valorDe(i);
    const fin = inicio + valorDe(datasetIndex);

    const desde = escala.getPixelForValue(inicio);
    const hasta = escala.getPixelForValue(fin);
    if (!Number.isFinite(desde) || !Number.isFinite(hasta) || desde === hasta) {
      return degradado.plano;
    }
    const gradiente =
      eje === "x"
        ? chart.ctx.createLinearGradient(desde, 0, hasta, 0)
        : chart.ctx.createLinearGradient(0, desde, 0, hasta);
    gradiente.addColorStop(0, degradado.desde);
    gradiente.addColorStop(1, degradado.hasta);
    return gradiente;
  };
}

const ORDEN_TONALIDAD_PDF: { clave: ClaveTonalidad; etiqueta: string }[] = [
  { clave: "positivo", etiqueta: "Positivo" },
  { clave: "neutro", etiqueta: "Neutro" },
  { clave: "negativo", etiqueta: "Negativo" },
];

/** El swatch de la leyenda no admite el gradiente scriptable: usa el tono plano. */
function leyendaTonalidad(paleta: PaletaGraficas) {
  return {
    position: "bottom" as const,
    labels: {
      color: COLOR_TEXTO_GRAFICA,
      font: { family: FUENTE },
      generateLabels: (chart: Chart) =>
        ORDEN_TONALIDAD_PDF.map(({ clave, etiqueta }, i) => ({
          text: etiqueta,
          fillStyle: paleta[clave].plano,
          strokeStyle: paleta[clave].plano,
          fontColor: COLOR_TEXTO_GRAFICA,
          hidden: !chart.isDatasetVisible(i),
          datasetIndex: i,
        })),
    },
  };
}

/** Igual que `generarBarraSentimiento`, con los degradados de una paleta. */
export function generarBarraSentimientoConPaleta(
  desglose: DesgloseSentimiento,
  paleta: PaletaGraficas,
): string {
  return renderizarComoImagenPng({
    type: "bar",
    data: {
      labels: ["Sentimiento"],
      datasets: ORDEN_TONALIDAD_PDF.map(({ clave, etiqueta }) => ({
        label: etiqueta,
        data: [desglose[clave]],
        backgroundColor: degradadoSegmento(paleta[clave], "x"),
        borderRadius: 4,
        borderSkipped: false,
      })),
    },
    options: {
      indexAxis: "y",
      scales: {
        x: {
          stacked: true,
          max: 100,
          ticks: { color: COLOR_TEXTO_GRAFICA, font: { family: FUENTE } },
        },
        y: {
          stacked: true,
          ticks: { display: false },
          grid: { display: false },
        },
      },
      plugins: { legend: leyendaTonalidad(paleta) },
    },
  });
}

/** Tonalidad apilada por fuente (vertical), con los degradados de una paleta. */
export function generarTonalidadPorFuenteConPaleta(
  categorias: string[],
  valores: DesgloseSentimiento[],
  paleta: PaletaGraficas,
): string {
  const limite = 8;
  return renderizarComoImagenPng({
    type: "bar",
    data: {
      labels: categorias.slice(0, limite),
      datasets: ORDEN_TONALIDAD_PDF.map(({ clave, etiqueta }) => ({
        label: etiqueta,
        data: valores.slice(0, limite).map((fila) => fila[clave]),
        backgroundColor: degradadoSegmento(paleta[clave], "y"),
      })),
    },
    options: {
      scales: {
        x: {
          stacked: true,
          ticks: { color: COLOR_TEXTO_GRAFICA, font: { family: FUENTE } },
          grid: { display: false },
        },
        y: {
          stacked: true,
          max: 100,
          ticks: { color: COLOR_TEXTO_GRAFICA, font: { family: FUENTE } },
        },
      },
      plugins: { legend: leyendaTonalidad(paleta) },
    },
  });
}

/**
 * Dona de distribución. `etiquetas`/`valores` deben venir en el mismo orden — al conectar
 * backend, mapear por ejemplo desde `RespuestaSentimiento.tonalidadPorFuente` o
 * `RespuestaBenchmarking.proyectos`.
 */
export function generarDona(etiquetas: string[], valores: number[]): string {
  return renderizarComoImagenPng({
    type: "doughnut",
    data: {
      labels: etiquetas,
      datasets: [
        {
          data: valores,
          backgroundColor: etiquetas.map(
            (_, i) => `#${SERIE_CATEGORICA[i % SERIE_CATEGORICA.length]}`,
          ),
        },
      ],
    },
    options: {
      plugins: { legend: { position: "right" } },
    },
  });
}

/**
 * Barra vertical comparativa (fuentes, hashtags, proyectos). `etiquetas`/`valores` en el mismo
 * orden; se recorta a las primeras 8 categorías para que las etiquetas no se amontonen.
 */
export function generarBarraComparativa(
  etiquetas: string[],
  valores: number[],
  color = `#${SERIE_CATEGORICA[0]}`,
): string {
  const limite = 8;
  return renderizarComoImagenPng({
    type: "bar",
    data: {
      labels: etiquetas.slice(0, limite),
      datasets: [
        {
          data: valores.slice(0, limite),
          backgroundColor: color,
          borderRadius: 4,
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { color: COLOR_TEXTO_GRAFICA, font: { family: FUENTE } },
          grid: { display: false },
        },
        y: {
          ticks: { color: COLOR_TEXTO_GRAFICA, font: { family: FUENTE } },
        },
      },
    },
  });
}

export type SerieBarraApilada = {
  nombre: string;
  valores: number[];
  color: string;
};

/**
 * Barra vertical apilada multi-serie (ej. positivo/negativo/neutro por fuente). `categorias` y
 * cada `serie.valores` deben venir en el mismo orden y largo — al conectar backend, mapear por
 * ejemplo desde `RespuestaSentimiento.tonalidadPorFuente` (una serie por tonalidad, categorías
 * = fuentes).
 */
export function generarBarraApiladaCategorias(
  categorias: string[],
  series: SerieBarraApilada[],
): string {
  const limite = 8;
  return renderizarComoImagenPng({
    type: "bar",
    data: {
      labels: categorias.slice(0, limite),
      datasets: series.map((serie) => ({
        label: serie.nombre,
        data: serie.valores.slice(0, limite),
        backgroundColor: `#${serie.color}`,
      })),
    },
    options: {
      scales: {
        x: {
          stacked: true,
          ticks: { color: COLOR_TEXTO_GRAFICA, font: { family: FUENTE } },
          grid: { display: false },
        },
        y: {
          stacked: true,
          ticks: { color: COLOR_TEXTO_GRAFICA, font: { family: FUENTE } },
        },
      },
      plugins: { legend: { position: "bottom" } },
    },
  });
}

/**
 * Línea de tendencia (ej. menciones de los últimos 7 días vía `mencionesSemana`). `etiquetas`
 * es opcional; si se omite se numeran los puntos.
 */
export function generarLineaTendencia(
  valores: number[],
  etiquetas?: string[],
): string {
  return renderizarComoImagenPng({
    type: "line",
    data: {
      labels: etiquetas ?? valores.map((_, i) => `Día ${i + 1}`),
      datasets: [
        {
          data: valores,
          borderColor: `#${SERIE_CATEGORICA[0]}`,
          backgroundColor: `#${SERIE_CATEGORICA[0]}33`,
          fill: true,
          tension: 0.35,
          pointRadius: 3,
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { color: COLOR_TEXTO_GRAFICA, font: { family: FUENTE } },
          grid: { display: false },
        },
        y: {
          ticks: { color: COLOR_TEXTO_GRAFICA, font: { family: FUENTE } },
          beginAtZero: true,
        },
      },
    },
  });
}
