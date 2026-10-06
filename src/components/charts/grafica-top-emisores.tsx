"use client";

import type { BarCustomLayerProps, BarDatum, BarTooltipProps } from "@nivo/bar";
import { ResponsiveBar } from "@nivo/bar";
import { useTooltip } from "@nivo/tooltip";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { EmisorVolumen } from "@/types";
import { PALETA_ACTIVA } from "@/lib/paletas-graficas";

type DatoEmisor = BarDatum & {
  emisor: string;
  menciones: number;
};

/** Etiqueta de conteo fuera del extremo de cada barra — mismo patrón de layer
 * custom que GraficaComboTendencia para no depender del recorte de
 * `enableLabel` de Nivo cerca del borde del gráfico. */
function CapaEtiquetas({ bars }: BarCustomLayerProps<DatoEmisor>) {
  return (
    <g>
      {bars.map((bar) => {
        const { menciones } = bar.data.data;
        // Nivo puede pasar una barra en tránsito sin su dato todavía resuelto
        // (ej. justo tras un cambio de rango en el calendario) — se omite esa
        // etiqueta en vez de reventar o inventar un número que no es real.
        if (menciones == null) return null;
        return (
          <text
            key={bar.key}
            x={bar.x + bar.width + 8}
            y={bar.y + bar.height / 2}
            dominantBaseline="middle"
            fontSize={10}
            fill="var(--color-text-secondary)"
          >
            {menciones.toLocaleString("es-MX")}
          </text>
        );
      })}
    </g>
  );
}

function TooltipEmisor({ data: fila }: BarTooltipProps<DatoEmisor>) {
  if (fila.menciones == null) return null;
  return (
    <div className="rounded-md border border-border-default bg-bg-base px-2.5 py-1.5 text-xs shadow-md">
      <p className="font-semibold text-text-primary">{fila.emisor}</p>
      <p className="mt-0.5 text-text-secondary">
        <span className="font-medium text-text-primary">{fila.menciones.toLocaleString("es-MX")}</span>{" "}
        menciones
      </p>
    </div>
  );
}

// Reemplaza la interactividad nativa de Nivo (siempre centra el tooltip
// arriba del cursor) por un control real de posición. Se ancla en el centro
// real de cada barra, eligiendo el lado (derecha o izquierda) según en qué
// mitad del ancho total cae ese centro — las barras cortas (pocas menciones)
// arrancan pegadas a la columna de nombres del eje, así que seguir el mouse
// ahí seguía cayendo casi encima del nombre.
function CapaInteraccion({ bars, width }: BarCustomLayerProps<DatoEmisor>) {
  const { showTooltipAt, hideTooltip } = useTooltip();
  return (
    <g>
      {bars.map((bar) => {
        const contenido = (
          <TooltipEmisor {...bar.data} value={bar.data.value ?? 0} color={bar.color} label={bar.label} />
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

type GraficaTopEmisoresProps = {
  emisores: EmisorVolumen[];
  className?: string;
};

export function GraficaTopEmisores({ emisores, className }: GraficaTopEmisoresProps) {
  const t = useTranslations("charts");
  if (emisores.length === 0) return null;

  // Nivo dibuja el primer elemento del array abajo y el último arriba en
  // barras horizontales: se ordena ascendente para que el mayor volumen
  // quede arriba (rank 1).
  const data: DatoEmisor[] = [...emisores]
    .sort((a, b) => b.menciones - a.menciones)
    .slice(0, 10)
    .sort((a, b) => a.menciones - b.menciones)
    .map((e) => ({ emisor: e.emisor, menciones: e.menciones }));

  return (
    <div
      className={cn("chart-frame flex h-full min-h-0 w-full flex-col", className)}
      role="img"
      aria-label={t("topEmittersAria")}
    >
      {/* Sin overflow-hidden: el tooltip de Nivo no usa portal, se recortaba
          en las filas de arriba al necesitar salirse hacia arriba. */}
      <div className="min-h-0 min-w-0 flex-1">
        <ResponsiveBar
          data={data}
          keys={["menciones"]}
          indexBy="emisor"
          layout="horizontal"
          margin={{ top: 4, right: 56, bottom: 24, left: 116 }}
          padding={0.5}
          colors={[PALETA_ACTIVA.categorica[0].plano]}
          borderRadius={2}
          enableLabel={false}
          enableGridX={true}
          enableGridY={false}
          axisTop={null}
          axisRight={null}
          axisLeft={{ tickSize: 0, tickPadding: 8, truncateTickAt: 18 }}
          axisBottom={{
            tickSize: 0,
            tickPadding: 6,
            format: (v) => Number(v).toLocaleString("es-MX"),
          }}
          theme={{
            text: { fill: "var(--color-text-muted)", fontSize: 10 },
            grid: { line: { stroke: "var(--color-border-default)", strokeOpacity: 0.5 } },
          }}
          tooltip={TooltipEmisor}
          layers={["grid", "axes", "bars", CapaEtiquetas, CapaInteraccion]}
          animate={false}
        />
      </div>
    </div>
  );
}
