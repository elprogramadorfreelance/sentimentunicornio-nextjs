"use client";

import type { SliceTooltipProps } from "@nivo/line";
import { ResponsiveLine } from "@nivo/line";
import { useLocale } from "next-intl";
import { localeBcp47 } from "@/i18n/config";
import { cn } from "@/lib/utils";
import type { PuntoTendenciaBenchmarking } from "@/types";

type ProyectoSerie = {
  id: string;
  nombre: string;
  color: string;
};

type FormatoValor = "compacto" | "porcentaje";

type GraficaLineaComparativaProps = {
  puntos: PuntoTendenciaBenchmarking[];
  proyectos: ProyectoSerie[];
  formato?: FormatoValor;
  ariaLabel: string;
  className?: string;
};

type SerieNivo = {
  id: string;
  data: { x: string; y: number }[];
};

function formatearValor(valor: number, locale: string, formato: FormatoValor) {
  const bcp47 = localeBcp47(locale);
  if (formato === "porcentaje") return `${valor.toLocaleString(bcp47)}%`;
  return valor.toLocaleString(bcp47, { notation: "compact" });
}

export function GraficaLineaComparativa({
  puntos,
  proyectos,
  formato = "compacto",
  ariaLabel,
  className,
}: GraficaLineaComparativaProps) {
  const locale = useLocale();

  if (puntos.length === 0 || proyectos.length === 0) return null;

  const data: SerieNivo[] = proyectos.map((proyecto) => ({
    id: proyecto.nombre,
    data: puntos.map((punto) => ({
      x: punto.fecha.slice(5),
      y: punto.valoresPorProyecto[proyecto.id] ?? 0,
    })),
  }));

  function SliceTooltipComparativa({ slice }: SliceTooltipProps<SerieNivo>) {
    return (
      <div className="rounded-md border border-border-default bg-bg-base px-2.5 py-1.5 text-xs shadow-md">
        {slice.points.map((point) => (
          <p key={point.seriesId} className="flex items-center gap-1.5 text-text-secondary">
            <span
              className="size-1.5 shrink-0 rounded-full"
              style={{ background: point.seriesColor }}
              aria-hidden
            />
            {point.seriesId}:{" "}
            <span className="font-semibold text-text-primary">
              {formatearValor(Number(point.data.y), locale, formato)}
            </span>
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("chart-frame flex h-full min-h-0 w-full flex-col", className)} role="img" aria-label={ariaLabel}>
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <ResponsiveLine
          data={data}
          margin={{ top: 8, right: 8, bottom: 28, left: 44 }}
          xScale={{ type: "point" }}
          yScale={{ type: "linear", min: 0, max: "auto" }}
          curve="monotoneX"
          colors={proyectos.map((proyecto) => proyecto.color)}
          lineWidth={2}
          pointSize={0}
          enableArea={false}
          enableGridX={false}
          enableGridY={true}
          gridYValues={4}
          axisBottom={{
            tickSize: 0,
            tickPadding: 8,
            tickRotation: -35,
            format: (valor) => String(valor).replace("-", "/"),
          }}
          axisLeft={{
            tickSize: 0,
            tickPadding: 6,
            tickValues: 4,
            format: (v) => formatearValor(Number(v), locale, formato),
          }}
          theme={{
            text: { fill: "var(--color-text-muted)", fontSize: 10 },
            grid: {
              line: {
                stroke: "var(--color-border-default)",
                strokeOpacity: 0.5,
              },
            },
          }}
          enableSlices="x"
          sliceTooltip={SliceTooltipComparativa}
          animate={false}
        />
      </div>

      <ul className="mt-1.5 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-text-muted">
        {proyectos.map((proyecto) => (
          <li key={proyecto.id} className="flex items-center gap-1">
            <span className="size-1.5 rounded-full" style={{ background: proyecto.color }} aria-hidden />
            {proyecto.nombre}
          </li>
        ))}
      </ul>
    </div>
  );
}
