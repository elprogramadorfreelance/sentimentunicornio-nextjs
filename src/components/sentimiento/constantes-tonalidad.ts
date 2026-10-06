import type { CategoríaTonalidad } from "@/types";
import { PALETA_ACTIVA } from "@/lib/paletas-graficas";

export const SEGMENTOS_TONALIDAD: {
  categoría: CategoríaTonalidad;
  color: string;
  clase: string;
}[] = [
  {
    categoría: "neutral",
    color: PALETA_ACTIVA.neutro.plano,
    clase: "bg-[#fbbf24]",
  },
  {
    categoría: "positivo",
    color: PALETA_ACTIVA.positivo.plano,
    clase: "bg-[#34d399]",
  },
  {
    categoría: "negativo",
    color: PALETA_ACTIVA.negativo.plano,
    clase: "bg-[#fb7185]",
  },
];

// Claves de traducción (namespace "common") para cada categoría — los
// componentes llaman tCommon(CLAVE_ETIQUETA_TONALIDAD[categoría]) al
// renderizar, ya que este archivo no es un componente y no puede usar
// useTranslations directamente.
export const CLAVE_ETIQUETA_TONALIDAD: Record<
  CategoríaTonalidad,
  "positive" | "negative" | "neutral" | "unrated"
> = {
  positivo: "positive",
  negativo: "negative",
  neutral: "neutral",
  sin_calificar: "unrated",
};

export function formatearMenciones(valor: number): string {
  return Intl.NumberFormat("es-MX", {
    notation: "compact",
    maximumFractionDigits: valor >= 10_000 ? 1 : 2,
  }).format(valor);
}

export function formatearPorcentaje(valor: number): string {
  return `${valor.toLocaleString("es-MX", {
    maximumFractionDigits: valor < 1 ? 2 : 1,
  })}%`;
}
