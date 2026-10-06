"use client";

import type { BarDatum, BarTooltipProps } from "@nivo/bar";
import { ResponsiveBar } from "@nivo/bar";
import { cn } from "@/lib/utils";
import { PALETA_ACTIVA } from "@/lib/paletas-graficas";

type DatoBarraMencion = BarDatum & {
  indice: string;
  valor: number;
};

type BarraMencionesProps = {
  /** Un valor por día del período mostrado — largo variable (30 días por
   * defecto, o el período exacto elegido en el calendario). */
  valores: readonly number[];
  className?: string;
};

function TooltipMenciones({ value }: BarTooltipProps<DatoBarraMencion>) {
  return (
    <div className="rounded-md border border-border-default bg-bg-base px-2.5 py-1.5 text-xs shadow-md">
      <span className="font-semibold text-text-primary">
        {value.toLocaleString("es-MX")}
      </span>{" "}
      <span className="text-text-secondary">menciones</span>
    </div>
  );
}

/**
 * Mini barras de menciones: una columna por día del período, último día
 * resaltado. Sin ejes ni labels — sparkline del widget.
 */
export function GraficaBarrasMenciones({
  valores,
  className = "",
}: BarraMencionesProps) {
  const data: DatoBarraMencion[] = valores.map((valor, i) => ({
    indice: String(i),
    valor,
  }));
  const ultimoIndice = valores.length - 1;

  return (
    <div
      className={cn("h-full min-h-0 w-full", className)}
      role="img"
      aria-label={`Menciones por día: ${valores.join(", ")}`}
    >
      <ResponsiveBar
        data={data}
        keys={["valor"]}
        indexBy="indice"
        margin={{ top: 4, right: 2, bottom: 0, left: 2 }}
        padding={0.18}
        valueScale={{ type: "linear", min: 0 }}
        colors={(d) =>
          d.index === ultimoIndice
            ? PALETA_ACTIVA.categorica[1].plano
            : PALETA_ACTIVA.categorica[3].plano
        }
        borderRadius={3}
        enableLabel={false}
        enableGridX={false}
        enableGridY={false}
        axisTop={null}
        axisRight={null}
        axisBottom={null}
        axisLeft={null}
        tooltip={TooltipMenciones}
        animate={false}
      />
    </div>
  );
}
