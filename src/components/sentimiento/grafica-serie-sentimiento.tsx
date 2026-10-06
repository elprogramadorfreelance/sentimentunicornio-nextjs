"use client";

import type { LineCustomSvgLayerProps, SliceTooltipProps } from "@nivo/line";
import { ResponsiveLine } from "@nivo/line";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { PuntoSerieSentimiento } from "@/types";
import {
  formatearMenciones,
  formatearPorcentaje,
} from "./constantes-tonalidad";

export type ModoSerieSentimiento = "menciones" | "porcentaje";

type SerieSentimiento = {
  id: string;
  data: { x: string; y: number }[];
};

type GraficaSerieSentimientoProps = {
  puntos: PuntoSerieSentimiento[];
  modo: ModoSerieSentimiento;
  color: string;
  className?: string;
};

export function GraficaSerieSentimiento({
  puntos,
  modo,
  color,
  className,
}: GraficaSerieSentimientoProps) {
  const t = useTranslations("sentimentPage");
  const tCharts = useTranslations("charts");
  const idActual = tCharts("currentPeriod");
  const idAnterior = tCharts("previousPeriod");

  function SliceTooltipSerie({ slice }: SliceTooltipProps<SerieSentimiento>) {
    const fecha = String(slice.points[0]?.data.x ?? "");

    return (
      <div className="rounded-md border border-border-default bg-bg-base px-2.5 py-1.5 text-xs shadow-md">
        <p className="mb-1 font-semibold text-text-primary">
          {fecha.replace("-", "/")}
        </p>
        {slice.points.map((point) => (
          <p
            key={point.seriesId}
            className="flex items-center gap-1.5 text-text-secondary"
          >
            <span
              className="size-1.5 shrink-0 rounded-full"
              style={{ background: point.seriesColor }}
              aria-hidden
            />
            {point.seriesId}:{" "}
            <span className="font-semibold text-text-primary">
              {modo === "porcentaje"
                ? formatearPorcentaje(Number(point.data.y))
                : formatearMenciones(Number(point.data.y))}
            </span>
          </p>
        ))}
      </div>
    );
  }

  function LineasConGuion({
    series,
    lineGenerator,
  }: LineCustomSvgLayerProps<SerieSentimiento>) {
    return (
      <g>
        {series.map((serie) => {
          const puntosSerie = serie.data
            .filter((d) => d.position.x !== null && d.position.y !== null)
            .map((d) => ({ x: d.position.x, y: d.position.y }));
          const path = lineGenerator(puntosSerie);
          if (!path) return null;

          const esAnterior = serie.id === idAnterior;
          return (
            <path
              key={String(serie.id)}
              d={path}
              fill="none"
              stroke={serie.color}
              strokeWidth={esAnterior ? 1.75 : 2}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={esAnterior ? "5 4" : undefined}
              opacity={esAnterior ? 0.85 : 1}
            />
          );
        })}
      </g>
    );
  }

  if (puntos.length === 0) return null;

  const data: SerieSentimiento[] = [
    {
      id: idActual,
      data: puntos.map((p) => ({
        x: p.fecha.slice(5),
        y: modo === "porcentaje" ? p.actualPorcentaje : p.actualMenciones,
      })),
    },
    {
      id: idAnterior,
      data: puntos.map((p) => ({
        x: p.fecha.slice(5),
        y: modo === "porcentaje" ? p.anteriorPorcentaje : p.anteriorMenciones,
      })),
    },
  ];

  const etiquetasX = new Set(
    puntos
      .filter((punto, i) => {
        const día = Number(punto.fecha.slice(8, 10));
        return día === 1 || día === 15 || i === 0 || i === puntos.length - 1;
      })
      .map((p) => p.fecha.slice(5)),
  );

  return (
    <div
      className={cn("h-full min-h-0 w-full", className)}
      role="img"
      aria-label={
        modo === "porcentaje" ? t("seriesPercentAria") : t("seriesCountAria")
      }
    >
      <ResponsiveLine<SerieSentimiento>
        data={data}
        margin={{ top: 12, right: 14, bottom: 34, left: 46 }}
        xScale={{ type: "point" }}
        yScale={{ type: "linear", min: 0, max: "auto", stacked: false }}
        curve="monotoneX"
        colors={[color, color]}
        enablePoints={false}
        enableArea={false}
        enableGridX={false}
        gridYValues={5}
        axisBottom={{
          tickSize: 0,
          tickPadding: 10,
          tickRotation: -35,
          tickValues: [...etiquetasX],
          format: (valor) => String(valor).replace("-", "/"),
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 8,
          tickValues: 5,
          format: (valor) =>
            modo === "porcentaje"
              ? `${Number(valor).toFixed(0)}%`
              : Intl.NumberFormat("es-MX", { notation: "compact" }).format(
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
            line: { stroke: color, strokeOpacity: 0.35 },
          },
        }}
        enableSlices="x"
        sliceTooltip={SliceTooltipSerie}
        layers={[
          "grid",
          "markers",
          "axes",
          "areas",
          "crosshair",
          LineasConGuion,
          "slices",
          "points",
          "mesh",
          "legends",
        ]}
        animate={false}
      />
    </div>
  );
}
