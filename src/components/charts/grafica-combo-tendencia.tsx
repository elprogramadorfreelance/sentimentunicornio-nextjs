"use client";

import type { BarCustomLayerProps, BarDatum, BarTooltipProps } from "@nivo/bar";
import { ResponsiveBar } from "@nivo/bar";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { PALETA_ACTIVA } from "@/lib/paletas-graficas";

export type PuntoComboTendencia = {
  menciones: number;
  alcance: number;
};

type DatoCombo = BarDatum & {
  indice: string;
  menciones: number;
  alcance: number;
};

type GraficaComboTendenciaProps = {
  puntos: PuntoComboTendencia[];
  className?: string;
};

/**
 * Nivo no trae un combo bar+línea de fábrica: se dibuja la línea de
 * "alcance" como layer custom sobre @nivo/bar, reutilizando las
 * coordenadas ya calculadas de cada barra (mismo eje X, sin depender
 * de @nivo/line ni de escalas propias).
 */
function crearCapaAlcance(maxAlcance: number) {
  function CapaAlcance({ bars, innerHeight }: BarCustomLayerProps<DatoCombo>) {
    if (bars.length === 0) return null;

    const puntos = bars
      .map((bar) => {
        const alcance = bar.data.data.alcance;
        return {
          indice: bar.data.data.indice,
          cx: bar.x + bar.width / 2,
          cy: innerHeight - (alcance / maxAlcance) * innerHeight,
          alcance,
        };
      })
      // Con muy pocos puntos reales, nivo puede devolver bar.x/width NaN
      // para algunas barras — se filtran para no romper el SVG.
      .filter((p) => Number.isFinite(p.cx) && Number.isFinite(p.cy));

    if (puntos.length === 0) return null;

    return (
      <g>
        <polyline
          points={puntos.map((p) => `${p.cx},${p.cy}`).join(" ")}
          fill="none"
          stroke={PALETA_ACTIVA.categorica[0].plano}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {puntos.map((p) => (
          <circle
            key={p.indice}
            cx={p.cx}
            cy={p.cy}
            r={2.5}
            fill={PALETA_ACTIVA.categorica[0].plano}
          />
        ))}
      </g>
    );
  }
  return CapaAlcance;
}

function TooltipCombo({ value, data }: BarTooltipProps<DatoCombo>) {
  return (
    <div className="rounded-md border border-border-default bg-bg-base px-2.5 py-1.5 text-xs shadow-md">
      <p className="flex items-center gap-1.5 text-text-secondary">
        <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: PALETA_ACTIVA.categorica[1].plano }} aria-hidden />
        Menciones:{" "}
        <span className="font-semibold text-text-primary">
          {value.toLocaleString("es-MX")}
        </span>
      </p>
      <p className="mt-0.5 flex items-center gap-1.5 text-text-secondary">
        <span
          className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: PALETA_ACTIVA.categorica[0].plano }}
          aria-hidden
        />
        Alcance:{" "}
        <span className="font-semibold text-text-primary">
          {data.alcance.toLocaleString("es-MX")}
        </span>
      </p>
    </div>
  );
}

export function GraficaComboTendencia({
  puntos,
  className,
}: GraficaComboTendenciaProps) {
  const t = useTranslations("charts");
  if (puntos.length === 0) return null;

  const data: DatoCombo[] = puntos.map((p, i) => ({
    indice: String(i + 1),
    menciones: p.menciones,
    alcance: p.alcance,
  }));
  const maxAlcance = Math.max(...puntos.map((p) => p.alcance), 1);
  const CapaAlcance = crearCapaAlcance(maxAlcance);

  return (
    <div
      className={cn("flex h-full min-h-0 w-full flex-col", className)}
      role="img"
      aria-label={t("comboTrendAria")}
    >
      <div className="min-h-0 flex-1">
        <ResponsiveBar
          data={data}
          keys={["menciones"]}
          indexBy="indice"
          margin={{ top: 8, right: 8, bottom: 20, left: 40 }}
          padding={0.4}
          colors={[PALETA_ACTIVA.categorica[1].plano]}
          borderRadius={2}
          enableLabel={false}
          enableGridX={false}
          enableGridY={true}
          gridYValues={4}
          axisBottom={null}
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
          tooltip={TooltipCombo}
          layers={["grid", "axes", "bars", CapaAlcance]}
          animate={false}
        />
      </div>

      <ul className="mt-1.5 flex shrink-0 items-center gap-3 text-[10px] text-text-muted">
        <li className="flex items-center gap-1">
          <span className="size-1.5 rounded-full" style={{ backgroundColor: PALETA_ACTIVA.categorica[1].plano }} aria-hidden />
          Menciones
        </li>
        <li className="flex items-center gap-1">
          <span
            className="size-1.5 rounded-full"
            style={{ backgroundColor: PALETA_ACTIVA.categorica[0].plano }}
            aria-hidden
          />
          Alcance
        </li>
      </ul>
    </div>
  );
}
