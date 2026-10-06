"use client";

import type { ScatterPlotLayerProps, ScatterPlotTooltipProps } from "@nivo/scatterplot";
import { ResponsiveScatterPlot } from "@nivo/scatterplot";
import { useTooltip } from "@nivo/tooltip";
import { cn } from "@/lib/utils";
import { PALETA_ACTIVA } from "@/lib/paletas-graficas";

export type PuntoBurbuja = {
  id: string;
  etiqueta: string;
  x: number;
  y: number;
  tamano: number;
};

type NodoBurbuja = {
  x: number;
  y: number;
  tamano: number;
  etiqueta: string;
};

type GraficaBurbujasProps = {
  puntos: PuntoBurbuja[];
  etiquetaX?: string;
  etiquetaY?: string;
  className?: string;
};

const formatoCompacto = (v: number | string | Date) =>
  Intl.NumberFormat("es-MX", { notation: "compact" }).format(Number(v));

function TooltipBurbuja({
  node,
  etiquetaX,
  etiquetaY,
}: ScatterPlotTooltipProps<NodoBurbuja> & { etiquetaX: string; etiquetaY: string }) {
  return (
    <div className="rounded-md border border-border-default bg-bg-base px-2.5 py-1.5 text-xs shadow-md">
      <p className="font-semibold text-text-primary">{node.data.etiqueta}</p>
      <p className="mt-0.5 text-text-secondary">
        {etiquetaY}:{" "}
        <span className="font-medium text-text-primary">
          {node.data.y.toLocaleString("es-MX")}
        </span>
      </p>
      <p className="text-text-secondary">
        {etiquetaX}:{" "}
        <span className="font-medium text-text-primary">
          {node.data.x.toLocaleString("es-MX")}
        </span>
      </p>
      <p className="text-text-secondary">
        Tamaño (% negativo):{" "}
        <span className="font-medium text-text-primary">
          {node.data.tamano.toLocaleString("es-MX")}%
        </span>
      </p>
    </div>
  );
}

/** Scatter/bubble con @nivo/scatterplot: tamaño de nodo dinámico por menciones. */
export function GraficaBurbujas({
  puntos,
  etiquetaX = "Engagement",
  etiquetaY = "Alcance",
  className,
}: GraficaBurbujasProps) {
  if (puntos.length === 0) {
    return <p className="text-xs text-text-muted">Sin datos para graficar.</p>;
  }

  const data = [
    {
      id: "proyectos",
      data: puntos.map((p) => ({
        x: p.x,
        y: p.y,
        tamano: p.tamano,
        etiqueta: p.etiqueta,
      })),
    },
  ];

  const tamanos = puntos.map((p) => p.tamano);
  const minTamano = Math.min(...tamanos);
  const maxTamano = Math.max(...tamanos);

  // Reemplaza el mesh nativo de Nivo (siempre centra el tooltip arriba del
  // cursor, anchor "top") por un control real de posición — anchor "right"
  // nace junto al cursor sin necesitar espacio arriba, evitando que se
  // recorte contra el título de la tarjeta cuando la burbuja está cerca del
  // borde superior. Radio mínimo de 10px para que las burbujas chicas sigan
  // siendo fáciles de "pescar" con el mouse, igual que ya hacía el mesh.
  function CapaInteraccion({ nodes }: ScatterPlotLayerProps<NodoBurbuja>) {
    const { showTooltipFromEvent, hideTooltip } = useTooltip();
    return (
      <g>
        {nodes.map((node) => (
          <circle
            key={node.id}
            cx={node.x}
            cy={node.y}
            r={Math.max(node.size / 2, 10)}
            fill="transparent"
            onMouseEnter={(e) =>
              showTooltipFromEvent(
                <TooltipBurbuja node={node} etiquetaX={etiquetaX} etiquetaY={etiquetaY} />,
                e,
                "right",
              )
            }
            onMouseMove={(e) =>
              showTooltipFromEvent(
                <TooltipBurbuja node={node} etiquetaX={etiquetaX} etiquetaY={etiquetaY} />,
                e,
                "right",
              )
            }
            onMouseLeave={hideTooltip}
          />
        ))}
      </g>
    );
  }

  return (
    <div
      className={cn("chart-frame flex h-full min-h-0 w-full flex-col", className)}
      role="img"
      aria-label={`Rendimiento por proyecto: ${etiquetaX} vs ${etiquetaY}`}
    >
      {/* Sin overflow-hidden: el tooltip de Nivo no usa portal, se recortaba
          contra el título de la tarjeta cuando la burbuja está cerca del
          borde superior. */}
      <div className="min-h-0 min-w-0 flex-1">
        <ResponsiveScatterPlot
          data={data}
          margin={{ top: 8, right: 8, bottom: 44, left: 60 }}
          xScale={{ type: "linear", min: 0, max: "auto" }}
          yScale={{ type: "linear", min: 0, max: "auto" }}
          colors={[PALETA_ACTIVA.categorica[0].plano]}
          nodeSize={
            minTamano === maxTamano
              ? 18
              : {
                  key: "data.tamano",
                  values: [minTamano, maxTamano],
                  sizes: [10, 34],
                }
          }
          enableGridX={false}
          gridYValues={4}
          axisBottom={{
            tickSize: 0,
            tickPadding: 6,
            tickValues: 4,
            legend: etiquetaX,
            legendPosition: "middle",
            legendOffset: 36,
            format: formatoCompacto,
          }}
          axisLeft={{
            tickSize: 0,
            tickPadding: 6,
            tickValues: 4,
            legend: etiquetaY,
            legendPosition: "middle",
            legendOffset: -48,
            format: formatoCompacto,
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
            <TooltipBurbuja {...props} etiquetaX={etiquetaX} etiquetaY={etiquetaY} />
          )}
          layers={["grid", "axes", "nodes", "markers", "legends", "annotations", CapaInteraccion]}
          animate={false}
        />
      </div>
    </div>
  );
}
