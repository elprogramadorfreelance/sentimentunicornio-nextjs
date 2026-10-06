export type Degradado = {
  desde: string;
  hasta: string;
  plano: string;
};

export type IdPaletaGraficas = "azul" | "semantica";

export type PaletaGraficas = {
  id: IdPaletaGraficas;
  nombre: string;
  descripcion: string;
  positivo: Degradado;
  neutro: Degradado;
  negativo: Degradado;
  /** Muy negativo → muy positivo, para la escala de caras. */
  escala: readonly [Degradado, Degradado, Degradado, Degradado, Degradado];
  categorica: readonly Degradado[];
  rampa: RampaMapa;
  /** Fondo de contenedores que antes eran gris (`bg-bg-muted`). */
  claseSuperficie: string;
};

export type RampaMapa = {
  minimo: string;
  maximo: string;
  sinDatos: string;
};

export const PALETA_AZUL: PaletaGraficas = {
  id: "azul",
  nombre: "Propuesta A: degradado azul",
  descripcion:
    "Toma el degradado de marca de los títulos de las cards. Los tonos se distinguen por luminosidad: cielo para positivo, lavanda para neutro y violeta profundo para negativo.",
  positivo: { desde: "#38bdf8", hasta: "#0056a4", plano: "#0284c7" },
  neutro: { desde: "#c7d2fe", hasta: "#818cf8", plano: "#a5b4fc" },
  negativo: { desde: "#7c3aed", hasta: "#2c0d5a", plano: "#5b21b6" },
  escala: [
    { desde: "#6d28d9", hasta: "#2c0d5a", plano: "#4c1d95" },
    { desde: "#a78bfa", hasta: "#6d28d9", plano: "#8b5cf6" },
    { desde: "#c7d2fe", hasta: "#818cf8", plano: "#a5b4fc" },
    { desde: "#7dd3fc", hasta: "#0ea5e9", plano: "#38bdf8" },
    { desde: "#1bb8e1", hasta: "#0056a4", plano: "#0369a1" },
  ],
  categorica: [
    { desde: "#1bb8e1", hasta: "#0056a4", plano: "#0284c7" },
    { desde: "#7dd3fc", hasta: "#0ea5e9", plano: "#38bdf8" },
    { desde: "#818cf8", hasta: "#4338ca", plano: "#6366f1" },
    { desde: "#c7d2fe", hasta: "#818cf8", plano: "#a5b4fc" },
    { desde: "#a78bfa", hasta: "#6d28d9", plano: "#8b5cf6" },
    { desde: "#7c3aed", hasta: "#2c0d5a", plano: "#5b21b6" },
  ],
  rampa: {
    minimo: "#c7d2fe",
    maximo: "#0056a4",
    sinDatos: "color-mix(in oklab, #a5b4fc 22%, var(--color-bg-base))",
  },
  claseSuperficie: "bg-indigo-50 dark:bg-indigo-950/60",
};

export const PALETA_SEMANTICA: PaletaGraficas = {
  id: "semantica",
  nombre: "Propuesta B: degradado semántico",
  descripcion:
    "Conserva el significado de cada tono con colores de Tailwind más suaves: esmeralda para positivo, rosa para negativo y ámbar para neutro, en lugar del gris.",
  positivo: { desde: "#6ee7b7", hasta: "#10b981", plano: "#34d399" },
  neutro: { desde: "#fde68a", hasta: "#f59e0b", plano: "#fbbf24" },
  negativo: { desde: "#fda4af", hasta: "#f43f5e", plano: "#fb7185" },
  escala: [
    { desde: "#fb7185", hasta: "#e11d48", plano: "#f43f5e" },
    { desde: "#fdba74", hasta: "#f97316", plano: "#fb923c" },
    { desde: "#fde68a", hasta: "#f59e0b", plano: "#fbbf24" },
    { desde: "#a7f3d0", hasta: "#34d399", plano: "#6ee7b7" },
    { desde: "#6ee7b7", hasta: "#059669", plano: "#10b981" },
  ],
  categorica: [
    { desde: "#7dd3fc", hasta: "#0ea5e9", plano: "#38bdf8" },
    { desde: "#a5b4fc", hasta: "#6366f1", plano: "#818cf8" },
    { desde: "#fcd34d", hasta: "#f59e0b", plano: "#fbbf24" },
    { desde: "#6ee7b7", hasta: "#10b981", plano: "#34d399" },
    { desde: "#f9a8d4", hasta: "#ec4899", plano: "#f472b6" },
    { desde: "#c4b5fd", hasta: "#8b5cf6", plano: "#a78bfa" },
  ],
  rampa: {
    minimo: "#a7f3d0",
    maximo: "#059669",
    sinDatos: "color-mix(in oklab, #fcd34d 22%, var(--color-bg-base))",
  },
  claseSuperficie: "bg-amber-50 dark:bg-amber-950/40",
};

export const PALETAS_GRAFICAS: readonly PaletaGraficas[] = [
  PALETA_AZUL,
  PALETA_SEMANTICA,
];

/** Paleta que usa toda la app. Para cambiarla basta con apuntar aquí a PALETA_AZUL o PALETA_SEMANTICA. */
export const PALETA_ACTIVA: PaletaGraficas = PALETA_SEMANTICA;

export type ClaveTonalidad = "positivo" | "neutro" | "negativo";

export function degradadoTonalidad(
  paleta: PaletaGraficas,
  clave: ClaveTonalidad,
): Degradado {
  return paleta[clave];
}

export type Orientacion = "vertical" | "horizontal" | "diagonal";

// Nivo pinta `linearGradient` con objectBoundingBox: offset 0 queda arriba
// (vertical) o a la izquierda (horizontal). El tono claro va en la base del
// dato para que el extremo del valor quede más saturado.
const EJES: Record<
  Orientacion,
  { x1: number; y1: number; x2: number; y2: number; claroPrimero: boolean }
> = {
  vertical: { x1: 0, y1: 0, x2: 0, y2: 1, claroPrimero: false },
  horizontal: { x1: 0, y1: 0, x2: 1, y2: 0, claroPrimero: true },
  diagonal: { x1: 0, y1: 0, x2: 1, y2: 1, claroPrimero: true },
};

export type DefGradienteNivo = {
  id: string;
  type: "linearGradient";
  colors: { offset: number; color: string; opacity?: number }[];
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type ReglaFillNivo = {
  id: string;
  match: Record<string, string>;
};

export function defGradienteNivo(
  id: string,
  degradado: Degradado,
  orientacion: Orientacion,
): DefGradienteNivo {
  const { claroPrimero, ...eje } = EJES[orientacion];
  const [inicio, fin] = claroPrimero
    ? [degradado.desde, degradado.hasta]
    : [degradado.hasta, degradado.desde];
  return {
    id,
    type: "linearGradient",
    colors: [
      { offset: 0, color: inicio },
      { offset: 100, color: fin },
    ],
    ...eje,
  };
}

/** Área bajo una línea: color pleno arriba, transparente abajo. */
export function defAreaNivo(
  id: string,
  degradado: Degradado,
): DefGradienteNivo {
  return {
    id,
    type: "linearGradient",
    colors: [
      { offset: 0, color: degradado.hasta, opacity: 0.26 },
      { offset: 100, color: degradado.desde, opacity: 0 },
    ],
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 1,
  };
}

/**
 * `defs` + `fill` de Nivo para pintar cada clave con su degradado. `campo` es
 * la propiedad del datum contra la que se compara: `id` en pie, line y barras
 * apiladas; `indexValue` para colorear barras por categoría.
 */
export function rellenosNivo(
  paleta: PaletaGraficas,
  entradas: readonly { clave: string; degradado: Degradado }[],
  orientacion: Orientacion,
  campo: "id" | "indexValue" = "id",
): { defs: DefGradienteNivo[]; fill: ReglaFillNivo[] } {
  const pares = entradas.map((entrada) => {
    const id = `${paleta.id}-${orientacion}-${campo}-${entrada.clave}`;
    return {
      def: defGradienteNivo(id, entrada.degradado, orientacion),
      regla: { id, match: { [campo]: entrada.clave } },
    };
  });
  return {
    defs: pares.map((par) => par.def),
    fill: pares.map((par) => par.regla),
  };
}

export function cssDegradado(
  degradado: Degradado,
  angulo = "to right",
): string {
  return `linear-gradient(${angulo}, ${degradado.desde}, ${degradado.hasta})`;
}
