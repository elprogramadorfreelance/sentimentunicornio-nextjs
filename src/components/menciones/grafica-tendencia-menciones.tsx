"use client";

import { ResponsiveLine } from "@nivo/line";
import type { SliceTooltipProps } from "@nivo/line";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { PuntoTendenciaMenciones } from "@/types";
import { PALETA_ACTIVA } from "@/lib/paletas-graficas";

type SerieTendencia = { id: string; data: { x: string; y: number }[] };

type GraficaTendenciaMencionesProps = {
  puntos: PuntoTendenciaMenciones[];
  comparar?: boolean;
  className?: string;
};

export function GraficaTendenciaMenciones({
  puntos,
  comparar = false,
  className,
}: GraficaTendenciaMencionesProps) {
  const t = useTranslations("mentions");
  const tCharts = useTranslations("charts");
  const data = [
    {
      id: tCharts("currentPeriod"),
      data: puntos.map((punto) => ({
        x: punto.fecha.slice(5),
        y: punto.actual,
      })),
    },
    ...(comparar
      ? [
          {
            id: tCharts("previousPeriod"),
            data: puntos.map((punto) => ({
              x: punto.fecha.slice(5),
              y: punto.anterior,
            })),
          },
        ]
      : []),
  ];

  function TooltipRebanada({ slice }: SliceTooltipProps<SerieTendencia>) {
    const fecha = String(slice.points[0]?.data.x ?? "");
    return (
      <div className="rounded-md border border-border-default bg-bg-base px-2.5 py-1.5 text-xs shadow-md">
        <p className="font-semibold text-text-primary">{fecha.replace("-", "/")}</p>
        {slice.points.map((punto) => (
          <p key={punto.seriesId} className="mt-0.5 flex items-center gap-1.5 text-text-secondary">
            <span
              className="size-1.5 shrink-0 rounded-full"
              style={{ background: punto.seriesColor }}
              aria-hidden
            />
            {punto.seriesId}:{" "}
            <span className="font-medium text-text-primary">{punto.data.y}</span>
          </p>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn("h-full min-h-0 w-full", className)}
      role="img"
      aria-label={comparar ? t("trendCompareAria") : t("trendAria")}
    >
      <ResponsiveLine
        data={data}
        margin={{ top: 12, right: 14, bottom: 34, left: 50 }}
        xScale={{ type: "point" }}
        yScale={{ type: "linear", min: 0, max: "auto", stacked: false }}
        curve="monotoneX"
        colors={[PALETA_ACTIVA.categorica[0].plano, PALETA_ACTIVA.categorica[3].plano]}
        lineWidth={2}
        pointSize={0}
        enableArea={!comparar}
        areaOpacity={0.07}
        enableGridX={false}
        gridYValues={5}
        axisBottom={{
          tickSize: 0,
          tickPadding: 10,
          tickRotation: -35,
          format: (valor) => String(valor).replace("-", "/"),
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 8,
          tickValues: 5,
          format: (valor) =>
            Intl.NumberFormat("es-MX", { notation: "compact" }).format(
              Number(valor),
            ),
        }}
        theme={{
          text: { fill: "var(--color-text-muted)", fontSize: 9 },
          grid: {
            line: {
              stroke: "var(--color-border-default)",
              strokeOpacity: 0.55,
            },
          },
          crosshair: {
            line: { stroke: PALETA_ACTIVA.categorica[0].plano, strokeOpacity: 0.35 },
          },
          tooltip: {
            container: {
              background: "var(--color-bg-base)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border-default)",
              borderRadius: "8px",
              fontSize: "11px",
            },
          },
        }}
        enableSlices="x"
        sliceTooltip={TooltipRebanada}
        useMesh
        animate={false}
      />
    </div>
  );
}
