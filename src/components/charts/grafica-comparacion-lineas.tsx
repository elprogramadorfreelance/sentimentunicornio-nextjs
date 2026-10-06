"use client";

import type { SliceTooltipProps } from "@nivo/line";
import { ResponsiveLine } from "@nivo/line";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { PALETA_ACTIVA } from "@/lib/paletas-graficas";

export type PuntoComparacionLineas = {
  fecha: number;
  actual: number;
  anterior: number;
};

type SerieAlcance = {
  id: string;
  data: { x: string; y: number }[];
};

type GraficaComparacionLineasProps = {
  puntos: PuntoComparacionLineas[];
  className?: string;
};

const formatoEjeX = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" });
const formatoTooltip = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long" });

function SliceTooltipComparacion({ slice }: SliceTooltipProps<SerieAlcance>) {
  const fechaMs = Number(slice.points[0]?.data.x);
  return (
    <div className="rounded-md border border-border-default bg-bg-base px-2.5 py-1.5 text-xs shadow-md">
      {Number.isFinite(fechaMs) && (
        <p className="mb-1 font-medium text-text-primary">
          {formatoTooltip.format(new Date(fechaMs))}
        </p>
      )}
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
            {point.data.y.toLocaleString("es-MX")}
          </span>
        </p>
      ))}
    </div>
  );
}

/** Dos series con @nivo/line: alcance del período actual vs. el anterior. */
export function GraficaComparacionLineas({
  puntos,
  className,
}: GraficaComparacionLineasProps) {
  const t = useTranslations("charts");
  if (puntos.length === 0) return null;

  const data: SerieAlcance[] = [
    {
      id: t("reach"),
      data: puntos.map((p) => ({ x: String(p.fecha), y: p.actual })),
    },
    {
      id: t("previousPeriod"),
      data: puntos.map((p) => ({ x: String(p.fecha), y: p.anterior })),
    },
  ];

  // Máximo ~5 etiquetas en el eje X aunque haya 12 o 24 puntos — con una por
  // punto se amontonan y quedan ilegibles en un widget tan angosto.
  const pasoTicks = Math.max(1, Math.round(puntos.length / 5));
  const tickValues = puntos
    .filter((_, i) => i % pasoTicks === 0)
    .map((p) => String(p.fecha));

  return (
    <div
      className={cn("flex h-full min-h-0 w-full flex-col", className)}
      role="img"
      aria-label={t("reachTrendAria")}
    >
      <div className="min-h-0 flex-1">
        <ResponsiveLine
          data={data}
          margin={{ top: 8, right: 8, bottom: 24, left: 40 }}
          xScale={{ type: "point" }}
          yScale={{ type: "linear", min: 0, max: "auto" }}
          curve="monotoneX"
          colors={[PALETA_ACTIVA.categorica[0].plano, PALETA_ACTIVA.categorica[3].plano]}
          lineWidth={2}
          enablePoints={false}
          enableArea={false}
          enableGridX={false}
          enableGridY={true}
          gridYValues={4}
          axisBottom={{
            tickSize: 0,
            tickPadding: 6,
            tickValues,
            format: (v) => formatoEjeX.format(new Date(Number(v))),
          }}
          axisLeft={{
            tickSize: 0,
            tickPadding: 6,
            tickValues: 4,
            format: (v) =>
              Intl.NumberFormat("es-MX", { notation: "compact" }).format(
                Number(v),
              ),
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
          sliceTooltip={SliceTooltipComparacion}
          animate={false}
        />
      </div>

      <ul className="mt-1.5 flex shrink-0 items-center gap-3 text-[10px] text-text-muted">
        <li className="flex items-center gap-1">
          <span className="size-1.5 rounded-full" style={{ backgroundColor: PALETA_ACTIVA.categorica[0].plano }} aria-hidden />
          {t("reach")}
        </li>
        <li className="flex items-center gap-1">
          <span
            className="size-1.5 rounded-full" style={{ backgroundColor: PALETA_ACTIVA.categorica[3].plano }}
            aria-hidden
          />
          {t("previousPeriod")}
        </li>
      </ul>
    </div>
  );
}
