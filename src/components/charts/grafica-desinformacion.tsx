"use client";

import { ResponsivePie } from "@nivo/pie";
import { useTranslations } from "next-intl";
import { PALETA_ACTIVA } from "@/lib/paletas-graficas";
import { cn } from "@/lib/utils";

type GraficaDesinformacionProps = {
  porcentaje: number;
  className?: string;
};

/**
 * Donut Nivo: impacto (warning) vs resto (track muted).
 * El % central va en overlay para tipografía del design system.
 */
export function GraficaDesinformacion({
  porcentaje,
  className,
}: GraficaDesinformacionProps) {
  const t = useTranslations("charts");
  const valor = Math.min(100, Math.max(0, porcentaje));
  const data = [
    {
      id: "impacto",
      label: t("impact"),
      value: valor,
      color: PALETA_ACTIVA.categorica[4].plano,
    },
    {
      id: "resto",
      label: t("noImpact"),
      value: 100 - valor,
      color: "var(--color-border-default)",
    },
  ];

  return (
    <div
      className={cn("relative size-16 shrink-0 sm:size-[4.5rem]", className)}
      role="img"
      aria-label={t("impactAria", { n: valor })}
    >
      <ResponsivePie
        data={data}
        margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
        innerRadius={0.72}
        padAngle={0}
        cornerRadius={0}
        enableArcLabels={false}
        enableArcLinkLabels={false}
        isInteractive={false}
        animate={false}
        colors={{ datum: "data.color" }}
        borderWidth={0}
        legends={[]}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold tabular-nums text-text-primary">
          {valor}%
        </span>
      </div>
    </div>
  );
}
