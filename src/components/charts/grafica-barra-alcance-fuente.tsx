"use client";

import type { BarDatum } from "@nivo/bar";
import { ResponsiveBar } from "@nivo/bar";
import { PALETA_ACTIVA } from "@/lib/paletas-graficas";
import { cn } from "@/lib/utils";

type DatoBarraFuente = BarDatum & {
  fuente: string;
  alcance: number;
};

type GraficaBarraAlcanceFuenteProps = {
  fuente: string;
  alcance: number;
  max: number;
  color?: string;
  className?: string;
};

/** Radio del remate de la barra: debe ser la mitad de su alto real (pista
 * de 6px, ver `h-1.5` en el widget). Nivo aplica `rx`/`ry` con el mismo
 * valor crudo y el navegador los recorta por separado contra la mitad del
 * ancho y la mitad del alto respectivamente — pasar un radio "infinito"
 * (ej. 999) produce rx≠ry en barras angostas, dando un óvalo deforme en
 * vez de un remate circular homogéneo. */
const RADIO_REMATE = 3;

/**
 * Una barra Nivo de una sola categoría por fila, escalada contra el mismo
 * `max` global: reproduce el mismo diseño de lista con rango que ya existía
 * (número, nombre, badge de cambio, valor y barra de proporción), pero la
 * barra ahora es una gráfica Nivo real en vez de un div con width% inline.
 */
export function GraficaBarraAlcanceFuente({
  fuente,
  alcance,
  max,
  color = PALETA_ACTIVA.categorica[0].plano,
  className,
}: GraficaBarraAlcanceFuenteProps) {
  const data: DatoBarraFuente[] = [{ fuente, alcance }];

  return (
    <div className={cn("h-full w-full", className)} role="presentation">
      <ResponsiveBar
        data={data}
        keys={["alcance"]}
        indexBy="fuente"
        layout="horizontal"
        valueScale={{ type: "linear", min: 0, max }}
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
