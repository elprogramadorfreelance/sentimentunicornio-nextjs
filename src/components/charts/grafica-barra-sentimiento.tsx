"use client";

import { useTranslations } from "next-intl";
import { cssDegradado, type Degradado } from "@/lib/paletas-graficas";
import { cn } from "@/lib/utils";

export type SegmentoSentimiento = {
  id: string;
  etiqueta: string;
  porcentaje: number;
  color: string;
};

type BarraSentimientoProps = {
  segmentos: readonly SegmentoSentimiento[];
  /** Muy negativo → muy positivo. Sin esta prop se usan los colores planos. */
  tonos?: readonly Degradado[];
  className?: string;
};

const TRAZO_OSCURO = "#1c1917";
const TRAZO_CLARO = "#ffffff";

function trazoSobre(hex: string) {
  const valor = Number.parseInt(hex.slice(1), 16);
  const r = (valor >> 16) & 255;
  const g = (valor >> 8) & 255;
  const b = valor & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b < 110 ? TRAZO_CLARO : TRAZO_OSCURO;
}

const CARAS = [
  { id: "muy-negativo", color: "#ef4444", boca: "M13 33 Q24 18 35 33" },
  { id: "negativo", color: "#f97316", boca: "M14 32 Q24 23 34 32" },
  { id: "neutro", color: "#facc15", boca: "M15 30 H33" },
  { id: "positivo", color: "#84cc16", boca: "M14 28 Q24 36 34 28" },
  { id: "muy-positivo", color: "#22c55e", boca: "M12 26 Q24 40 36 26" },
] as const;

function porcentajeDe(
  segmentos: readonly SegmentoSentimiento[],
  ids: readonly string[],
) {
  return (
    segmentos.find((segmento) => ids.includes(segmento.id))?.porcentaje ?? 0
  );
}

function nivelActivo(positivo: number, negativo: number) {
  const score = positivo - negativo;
  if (score <= -40) return 0;
  if (score <= -12) return 1;
  if (score < 12) return 2;
  if (score < 40) return 3;
  return 4;
}

/**
 * Escala de cinco caras. El desglose sigue siendo positivo / neutro / negativo;
 * la cara marcada sale de la diferencia, sin inventar un quinto porcentaje.
 */
export function GraficaBarraSentimiento({
  segmentos,
  tonos,
  className,
}: BarraSentimientoProps) {
  const t = useTranslations("charts");
  const resumen = segmentos
    .map((s) => `${s.etiqueta} ${s.porcentaje}%`)
    .join(", ");
  const activo = nivelActivo(
    porcentajeDe(segmentos, ["positivo", "pos"]),
    porcentajeDe(segmentos, ["negativo", "neg"]),
  );

  return (
    <div
      className={cn(
        "flex w-full min-w-0 items-center justify-center gap-1 rounded-full bg-bg-muted px-1.5 py-1.5",
        className,
      )}
      role="img"
      aria-label={t("sentimentDistribution", { summary: resumen })}
    >
      {CARAS.map((cara, indice) => {
        const tono = tonos?.[indice];
        const trazo = tono ? trazoSobre(tono.plano) : TRAZO_OSCURO;
        return (
          <span
            key={cara.id}
            className={cn(
              "relative aspect-square w-full min-w-0 max-w-10 flex-1 overflow-hidden rounded-[30%]",
              indice === activo ? "opacity-100" : "opacity-55",
            )}
            style={
              tono
                ? { backgroundImage: cssDegradado(tono, "to bottom") }
                : { backgroundColor: cara.color }
            }
          >
            <svg viewBox="0 0 48 48" className="size-full" aria-hidden="true">
              <ellipse
                cx="24"
                cy="9"
                rx="16"
                ry="7"
                fill="white"
                opacity="0.28"
              />
              <circle cx="17" cy="20" r="2.2" fill={trazo} />
              <circle cx="31" cy="20" r="2.2" fill={trazo} />
              <path
                d={cara.boca}
                fill="none"
                stroke={trazo}
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
          </span>
        );
      })}
    </div>
  );
}
