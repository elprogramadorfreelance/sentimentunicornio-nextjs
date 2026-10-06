/**
 * Paleta compartida por los 5 reportes descargables (PDF y PPTX). Se mantiene separada del
 * design system de Tailwind de la app porque jsPDF/PptxGenJS/Chart.js necesitan valores RGB o
 * hex explícitos, no clases utilitarias.
 */
export const COLOR_MARCA_NAVY = "1D4ED8";
export const COLOR_MARCA_NAVY_RGB: [number, number, number] = [29, 78, 216];
export const COLOR_ACENTO_CELESTE = "7DD3FC";
export const COLOR_TEXTO_CUERPO_RGB: [number, number, number] = [38, 51, 77];
export const COLOR_TEXTO_SECUNDARIO_RGB: [number, number, number] = [
  100, 116, 139,
];

export const COLOR_POSITIVO = "16A34A";
export const COLOR_NEGATIVO = "DC2626";
export const COLOR_NEUTRO = "94A3B8";

export const COLOR_POSITIVO_RGB: [number, number, number] = [22, 163, 74];
export const COLOR_NEGATIVO_RGB: [number, number, number] = [220, 38, 38];
export const COLOR_NEUTRO_RGB: [number, number, number] = [148, 163, 184];

/** Serie categórica para gráficas comparativas (fuentes, proyectos, hashtags, etc.). */
export const SERIE_CATEGORICA = [
  "0EA5E9",
  "6366F1",
  "F59E0B",
  "16A34A",
  "EC4899",
  "94A3B8",
];
