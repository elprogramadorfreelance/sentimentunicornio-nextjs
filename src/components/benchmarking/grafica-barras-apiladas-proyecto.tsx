"use client";

import type { BarCustomLayerProps, BarDatum, BarTooltipProps } from "@nivo/bar";
import { ResponsiveBar } from "@nivo/bar";
import { useTooltip } from "@nivo/tooltip";
import { useLocale } from "next-intl";
import { localeBcp47 } from "@/i18n/config";
import { cn } from "@/lib/utils";

type ClaveBarra = {
  clave: string;
  etiqueta: string;
  color: string;
};

type FilaProyecto = {
  proyecto: string;
  valores: Record<string, number>;
};

type DatoBarra = BarDatum & Record<string, string | number>;

type GraficaBarrasApiladasProyectoProps = {
  filas: FilaProyecto[];
  claves: ClaveBarra[];
  ariaLabel: string;
  className?: string;
};

export function GraficaBarrasApiladasProyecto({
  filas,
  claves,
  ariaLabel,
  className,
}: GraficaBarrasApiladasProyectoProps) {
  const locale = useLocale();
  const bcp47 = localeBcp47(locale);
  const etiquetaPorClave = Object.fromEntries(claves.map((c) => [c.clave, c.etiqueta]));
  const valorClave = (clave: string) => `${clave}Valor`;

  if (filas.length === 0) return null;

  const data: DatoBarra[] = filas.map((fila) => {
    const total = claves.reduce((suma, c) => suma + (fila.valores[c.clave] ?? 0), 0) || 1;
    const fuera: Record<string, string | number> = { proyecto: fila.proyecto };
    for (const c of claves) {
      const real = fila.valores[c.clave] ?? 0;
      fuera[c.clave] = (real / total) * 100;
      fuera[valorClave(c.clave)] = real;
    }
    return fuera as DatoBarra;
  });

  function TooltipBarra({ id, data: fila }: BarTooltipProps<DatoBarra>) {
    const clave = String(id);
    const porcentaje = fila[clave] as number;
    const valorReal = fila[valorClave(clave)] as number;

    return (
      <div className="rounded-md border border-border-default bg-bg-base px-2.5 py-1.5 text-xs shadow-md">
        <p className="font-semibold text-text-primary">{fila.proyecto}</p>
        <p className="mt-0.5 text-text-secondary">
          {etiquetaPorClave[clave]}:{" "}
          <span className="font-medium text-text-primary">
            {valorReal.toLocaleString(bcp47, { notation: "compact" })}
          </span>{" "}
          ({porcentaje.toFixed(1)}%)
        </p>
      </div>
    );
  }

  // Reemplaza la interactividad nativa de Nivo (isInteractive) por un control
  // real de dónde aparece el tooltip. Seguir el mouse no basta: en modo
  // apilado el primer segmento (neutral) arranca justo pegado a la columna
  // de nombres del eje, y si es angosto, un tooltip "a la derecha del
  // cursor" cae casi encima del nombre. Se ancla en el centro real de cada
  // segmento, eligiendo el lado (derecha o izquierda) según en qué mitad del
  // ancho total cae ese centro — así nunca se acerca ni a la columna de
  // nombres (izquierda) ni se sale de la tarjeta (derecha), sin importar qué
  // tan angosto sea el segmento.
  function CapaInteraccion({ bars, width }: BarCustomLayerProps<DatoBarra>) {
    const { showTooltipAt, hideTooltip } = useTooltip();
    return (
      <g>
        {bars.map((bar) => {
          const contenido = (
            <TooltipBarra {...bar.data} value={bar.data.value ?? 0} color={bar.color} label={bar.label} />
          );
          const centroX = bar.x + bar.width / 2;
          const posición: [number, number] = [centroX, bar.y + bar.height / 2];
          const anchor = centroX < width / 2 ? "right" : "left";
          return (
            <rect
              key={bar.key}
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              fill="transparent"
              onMouseEnter={() => showTooltipAt(contenido, posición, anchor)}
              onMouseMove={() => showTooltipAt(contenido, posición, anchor)}
              onMouseLeave={hideTooltip}
            />
          );
        })}
      </g>
    );
  }

  return (
    <div className={cn("chart-frame flex h-full min-h-0 w-full flex-col", className)} role="img" aria-label={ariaLabel}>
      {/* Sin overflow-hidden: Nivo no usa un portal para el tooltip, lo dibuja
          como hijo normal — recortar aquí cortaba el tooltip de las filas de
          arriba cuando necesitan salirse hacia arriba del contenedor. */}
      <div className="min-h-0 min-w-0 flex-1">
        <ResponsiveBar
          data={data}
          keys={claves.map((c) => c.clave)}
          indexBy="proyecto"
          layout="horizontal"
          groupMode="stacked"
          margin={{ top: 4, right: 8, bottom: 20, left: 84 }}
          padding={0.35}
          colors={claves.map((c) => c.color)}
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
            truncateTickAt: 14,
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
          tooltip={TooltipBarra}
          layers={["grid", "axes", "bars", "markers", "legends", "annotations", CapaInteraccion]}
          animate={false}
        />
      </div>
      <ul className="mt-1.5 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-text-muted">
        {claves.map((c) => (
          <li key={c.clave} className="flex items-center gap-1">
            <span className="size-1.5 rounded-full" style={{ background: c.color }} aria-hidden />
            {c.etiqueta}
          </li>
        ))}
      </ul>
    </div>
  );
}
