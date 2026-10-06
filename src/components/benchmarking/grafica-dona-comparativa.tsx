"use client";

import type { PieCustomLayerProps, PieTooltipProps } from "@nivo/pie";
import { ResponsivePie } from "@nivo/pie";
import { useTooltip } from "@nivo/tooltip";
import { useLocale } from "next-intl";
import { localeBcp47 } from "@/i18n/config";
import { cn } from "@/lib/utils";

type SegmentoComparativo = {
  id: string;
  nombre: string;
  valor: number;
  color: string;
};

type DatoDona = {
  id: string;
  label: string;
  value: number;
  porcentaje: number;
  color: string;
};

type GraficaDonaComparativaProps = {
  segmentos: SegmentoComparativo[];
  etiquetaCentro: string;
  ariaLabel: string;
  className?: string;
};

export function GraficaDonaComparativa({
  segmentos,
  etiquetaCentro,
  ariaLabel,
  className,
}: GraficaDonaComparativaProps) {
  const locale = useLocale();
  const bcp47 = localeBcp47(locale);
  const total = segmentos.reduce((suma, item) => suma + item.valor, 0);

  const data: DatoDona[] = segmentos.map((segmento) => ({
    id: segmento.id,
    label: segmento.nombre,
    value: segmento.valor,
    porcentaje: total ? (segmento.valor / total) * 100 : 0,
    color: segmento.color,
  }));

  function TooltipDona({ datum }: PieTooltipProps<DatoDona>) {
    return (
      <div className="rounded-md border border-border-default bg-bg-base px-2.5 py-1.5 text-xs shadow-md">
        <p className="font-semibold text-text-primary">{datum.label}</p>
        <p className="mt-0.5 text-text-secondary">
          <span className="font-medium text-text-primary">
            {datum.value.toLocaleString(bcp47, { notation: "compact" })}
          </span>{" "}
          ({datum.data.porcentaje.toLocaleString(bcp47, { maximumFractionDigits: 1 })}%)
        </p>
      </div>
    );
  }

  function CapaCentro({ centerX, centerY }: PieCustomLayerProps<DatoDona>) {
    return (
      <g transform={`translate(${centerX},${centerY})`}>
        <text textAnchor="middle" y={-6} fill="var(--color-text-muted)" style={{ fontSize: 11 }}>
          {etiquetaCentro}
        </text>
        <text textAnchor="middle" y={14} fill="var(--color-text-primary)" style={{ fontSize: 18, fontWeight: 700 }}>
          {total.toLocaleString(bcp47, { notation: "compact", maximumFractionDigits: 1 })}
        </text>
      </g>
    );
  }

  // Mismo control real de posición que ya se aplicó en las gráficas de barras:
  // Nivo por defecto centra el tooltip arriba del cursor (anchor "top"), lo
  // que lo hace invadir hacia arriba y chocar con el título de la tarjeta
  // cuando la dona está cerca del borde superior. Con anchor "right" nace
  // junto al cursor sin necesitar espacio arriba.
  function CapaInteraccion({ dataWithArc, arcGenerator }: PieCustomLayerProps<DatoDona>) {
    const { showTooltipFromEvent, hideTooltip } = useTooltip();
    return (
      <g>
        {dataWithArc.map((datum) => (
          <path
            key={datum.id}
            d={arcGenerator(datum.arc) ?? undefined}
            fill="transparent"
            onMouseEnter={(e) => showTooltipFromEvent(<TooltipDona datum={datum} />, e, "right")}
            onMouseMove={(e) => showTooltipFromEvent(<TooltipDona datum={datum} />, e, "right")}
            onMouseLeave={hideTooltip}
          />
        ))}
      </g>
    );
  }

  if (data.length === 0) return null;

  return (
    <div className={cn("chart-frame flex h-full min-h-0 w-full min-w-0 flex-col", className)} role="img" aria-label={ariaLabel}>
      {/* Sin overflow-hidden: el tooltip de Nivo no usa portal, se recortaba
          contra el título de la tarjeta cuando la dona está cerca del borde
          superior. */}
      <div className="min-h-0 min-w-0 flex-1">
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
          layers={["arcs", CapaCentro, CapaInteraccion]}
          animate={false}
        />
      </div>
      <ul className="mt-1 flex shrink-0 flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] text-text-muted">
        {data.map((segmento) => (
          <li key={segmento.id} className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full" style={{ background: segmento.color }} aria-hidden />
            <span>{segmento.label}</span>
            <span className="font-medium tabular-nums text-text-primary">
              {segmento.porcentaje.toLocaleString(bcp47, { maximumFractionDigits: 1 })}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
