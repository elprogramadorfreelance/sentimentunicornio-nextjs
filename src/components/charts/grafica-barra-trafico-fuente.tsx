"use client";

import type { BarDatum } from "@nivo/bar";
import { ResponsiveBar } from "@nivo/bar";
import { cn } from "@/lib/utils";

type DatoBarraTrafico = BarDatum & {
  fuente: string;
  porcentaje: number;
};

type GraficaBarraTraficoFuenteProps = {
  fuente: string;
  porcentaje: number;
  color: string;
  className?: string;
};

/** Radio del remate: coincide con --radius-sm (4px), el mismo usado por el
 * track (rounded-sm). A diferencia del pill de "Alcance por fuente", este
 * track no es completamente redondeado, así que el radio no depende de la
 * altura de la barra — un valor fijo y modesto (4px) queda sin recortar en
 * cualquier ancho/alto razonable, evitando el bug de rx≠ry ya visto. */
const RADIO_REMATE = 4;

/**
 * Una barra Nivo de una sola categoría por fila, escalada de 0 a 100:
 * reemplaza el <Progress> de Radix por una gráfica Nivo real, manteniendo
 * el mismo track y color por fuente.
 */
export function GraficaBarraTraficoFuente({
  fuente,
  porcentaje,
  color,
  className,
}: GraficaBarraTraficoFuenteProps) {
  const data: DatoBarraTrafico[] = [{ fuente, porcentaje }];

  return (
    <div className={cn("h-full w-full", className)} role="presentation">
      <ResponsiveBar
        data={data}
        keys={["porcentaje"]}
        indexBy="fuente"
        layout="horizontal"
        valueScale={{ type: "linear", min: 0, max: 100 }}
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        padding={0}
        colors={[color]}
        borderRadius={RADIO_REMATE}
        enableLabel={false}
        enableGridX={false}
        enableGridY={false}
        axisTop={null}
        axisRight={null}
        axisBottom={null}
        axisLeft={null}
        isInteractive={false}
        animate={false}
      />
    </div>
  );
}
