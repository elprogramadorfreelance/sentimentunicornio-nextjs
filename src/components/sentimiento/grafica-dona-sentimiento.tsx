"use client";

import type { PieCustomLayerProps, PieTooltipProps } from "@nivo/pie";
import { ResponsivePie } from "@nivo/pie";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { SegmentoTonalidad } from "@/types";
import {
  CLAVE_ETIQUETA_TONALIDAD,
  formatearMenciones,
  formatearPorcentaje,
  SEGMENTOS_TONALIDAD,
} from "./constantes-tonalidad";

type DatoDona = {
  id: string;
  label: string;
  value: number;
  porcentaje: number;
  color: string;
};

type GraficaDonaSentimientoProps = {
  segmentos: SegmentoTonalidad[];
  className?: string;
};

const COLOR_POR_CATEGORÍA = Object.fromEntries(
  SEGMENTOS_TONALIDAD.map((s) => [s.categoría, s.color]),
) as Record<SegmentoTonalidad["categoría"], string>;

export function GraficaDonaSentimiento({
  segmentos,
  className,
}: GraficaDonaSentimientoProps) {
  const t = useTranslations("sentimentPage");
  const tCommon = useTranslations("common");

  const data: DatoDona[] = segmentos.map((segmento) => ({
    id: segmento.categoría,
    label: tCommon(CLAVE_ETIQUETA_TONALIDAD[segmento.categoría]),
    value: segmento.valor,
    porcentaje: segmento.porcentaje,
    color: COLOR_POR_CATEGORÍA[segmento.categoría],
  }));

  function TooltipDona({ datum }: PieTooltipProps<DatoDona>) {
    return (
      <div className="rounded-md border border-border-default bg-bg-base px-2.5 py-1.5 text-xs shadow-md">
        <p className="font-semibold text-text-primary">{datum.label}</p>
        <p className="mt-0.5 text-text-secondary">
          <span className="font-medium text-text-primary">
            {formatearMenciones(datum.value)}
          </span>{" "}
          ({formatearPorcentaje(datum.data.porcentaje)})
        </p>
      </div>
    );
  }

  function CapaCentro({
    centerX,
    centerY,
    dataWithArc,
  }: PieCustomLayerProps<DatoDona>) {
    const total = dataWithArc.reduce((acc, d) => acc + d.value, 0);

    return (
      <g transform={`translate(${centerX},${centerY})`}>
        <text
          textAnchor="middle"
          y={-6}
          fill="var(--color-text-muted)"
          style={{ fontSize: 11 }}
        >
          {tCommon("mentions")}
        </text>
        <text
          textAnchor="middle"
          y={14}
          fill="var(--color-text-primary)"
          style={{ fontSize: 18, fontWeight: 700 }}
        >
          {formatearMenciones(total)}
        </text>
      </g>
    );
  }

  return (
    <div
      className={cn("h-full min-h-0 w-full", className)}
      role="img"
      aria-label={t("donutAria")}
    >
      <ResponsivePie<DatoDona>
        data={data}
        margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
        innerRadius={0.68}
        padAngle={1.6}
        cornerRadius={3}
        activeOuterRadiusOffset={4}
        colors={(d) => d.data.color}
        enableArcLabels={false}
        enableArcLinkLabels={false}
        borderWidth={0}
        tooltip={TooltipDona}
        layers={["arcs", CapaCentro]}
        animate={false}
      />
    </div>
  );
}
