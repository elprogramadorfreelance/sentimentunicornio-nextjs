"use client";

import type { BarDatum, BarTooltipProps } from "@nivo/bar";
import { ResponsiveBar } from "@nivo/bar";
import { useTranslations } from "next-intl";
import type { TonalidadFuente } from "@/lib/mock/dashboard-general";
import { cn } from "@/lib/utils";
import { PALETA_ACTIVA } from "@/lib/paletas-graficas";

type ClaveSegmento = "positivo" | "neutro" | "negativo";

type DatoTonalidad = BarDatum & {
  fuente: string;
  positivo: number;
  neutro: number;
  negativo: number;
  positivoValor: number;
  neutroValor: number;
  negativoValor: number;
};

const CLAVE_VALOR: Record<ClaveSegmento, keyof DatoTonalidad> = {
  positivo: "positivoValor",
  neutro: "neutroValor",
  negativo: "negativoValor",
};

const SEGMENTOS: {
  clave: ClaveSegmento;
  color: string;
}[] = [
  { clave: "neutro", color: PALETA_ACTIVA.neutro.plano },
  { clave: "positivo", color: PALETA_ACTIVA.positivo.plano },
  { clave: "negativo", color: PALETA_ACTIVA.negativo.plano },
];

type GraficaTonalidadFuenteProps = {
  fuentes: TonalidadFuente[];
  className?: string;
};

/**
 * Barras apiladas normalizadas a 100%: Nivo no trae un modo "percentage
 * stacked" de fábrica, así que se convierte cada valor a porcentaje del
 * total de su fuente antes de graficar, conservando el valor real aparte
 * para mostrarlo en el tooltip.
 */
function TooltipTonalidad({
  id,
  data,
  etiquetasPorClave,
}: BarTooltipProps<DatoTonalidad> & { etiquetasPorClave: Record<ClaveSegmento, string> }) {
  const clave = id as ClaveSegmento;
  const porcentaje = data[clave] as number;
  const valorReal = data[CLAVE_VALOR[clave]] as number;

  return (
    <div className="rounded-md border border-border-default bg-bg-base px-2.5 py-1.5 text-xs shadow-md">
      <p className="font-semibold text-text-primary">{data.fuente}</p>
      <p className="mt-0.5 text-text-secondary">
        {etiquetasPorClave[clave]}:{" "}
        <span className="font-medium text-text-primary">
          {valorReal.toLocaleString("es-MX")}
        </span>{" "}
        ({porcentaje.toFixed(1)}%)
      </p>
    </div>
  );
}

export function GraficaTonalidadFuente({
  fuentes,
  className,
}: GraficaTonalidadFuenteProps) {
  const t = useTranslations("charts");
  const tCommon = useTranslations("common");
  const etiquetasPorClave: Record<ClaveSegmento, string> = {
    neutro: tCommon("neutral"),
    positivo: tCommon("positive"),
    negativo: tCommon("negative"),
  };

  if (fuentes.length === 0) return null;

  const data: DatoTonalidad[] = fuentes.map((f) => {
    const total = f.positivo + f.neutro + f.negativo || 1;
    return {
      fuente: f.fuente,
      positivo: (f.positivo / total) * 100,
      neutro: (f.neutro / total) * 100,
      negativo: (f.negativo / total) * 100,
      positivoValor: f.positivo,
      neutroValor: f.neutro,
      negativoValor: f.negativo,
    };
  });

  return (
    <div
      className={cn("flex h-full min-h-0 w-full flex-col", className)}
      role="img"
      aria-label={t("toneBySourceAria")}
    >
      <div className="min-h-0 flex-1">
        <ResponsiveBar
          data={data}
          keys={SEGMENTOS.map((s) => s.clave)}
          indexBy="fuente"
          layout="horizontal"
          groupMode="stacked"
          margin={{ top: 4, right: 12, bottom: 20, left: 90 }}
          padding={0.35}
          colors={SEGMENTOS.map((s) => s.color)}
          borderRadius={2}
          enableLabel={false}
          enableGridX={true}
          enableGridY={false}
          gridXValues={[0, 25, 50, 75, 100]}
          axisTop={null}
          axisRight={null}
          axisLeft={{
            tickSize: 0,
            tickPadding: 8,
            truncateTickAt: 15,
          }}
          axisBottom={{
            tickSize: 0,
            tickPadding: 6,
            tickValues: [0, 25, 50, 75, 100],
            format: (v) => `${v}%`,
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
          tooltip={(props) => (
            <TooltipTonalidad {...props} etiquetasPorClave={etiquetasPorClave} />
          )}
          animate={false}
        />
      </div>
    </div>
  );
}
