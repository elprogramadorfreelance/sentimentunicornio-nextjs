"use client";

import type { BarCustomLayerProps, BarDatum, BarTooltipProps } from "@nivo/bar";
import { ResponsiveBar } from "@nivo/bar";
import { useTooltip } from "@nivo/tooltip";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { NssPorTema } from "@/types";
import { PALETA_ACTIVA } from "@/lib/paletas-graficas";

type DatoNssTema = BarDatum & {
  tema: string;
  nss: number;
  n: number;
};

/** Etiqueta "{signo}{nss} pts" junto a la línea de cero de cada barra (no en
 * su extremo lejano) — con valores muy dispares entre temas (ej. varios en
 * -100 y solo uno en +50) una barra larga llega casi hasta el margen, y su
 * etiqueta en el extremo chocaba con el nombre del tema del eje izquierdo.
 * Pegada a cero, nunca se acerca al margen sin importar cuánto mida la
 * barra. */
function CapaEtiquetas({ bars }: BarCustomLayerProps<DatoNssTema>) {
  return (
    <g>
      {bars.map((bar) => {
        const { nss } = bar.data.data;
        // Nivo puede pasar una barra en tránsito sin su dato todavía resuelto
        // (ej. justo tras un cambio de rango en el calendario) — se omite esa
        // etiqueta en vez de reventar o inventar un "0 pts" que no es real.
        if (nss == null) return null;
        const positivo = nss >= 0;
        const texto = `${positivo ? "+" : ""}${nss.toLocaleString("es-MX", { maximumFractionDigits: 1 })} pts`;
        const xCero = positivo ? bar.x : bar.x + bar.width;
        return (
          <text
            key={bar.key}
            x={positivo ? xCero + 6 : xCero - 6}
            y={bar.y + bar.height / 2}
            textAnchor={positivo ? "start" : "end"}
            dominantBaseline="middle"
            fontSize={10}
            fontWeight={600}
            fill="var(--color-text-secondary)"
          >
            {texto}
          </text>
        );
      })}
    </g>
  );
}

function TooltipNss({ data: fila }: BarTooltipProps<DatoNssTema>) {
  if (fila.nss == null) return null;
  return (
    <div className="rounded-md border border-border-default bg-bg-base px-2.5 py-1.5 text-xs shadow-md">
      <p className="font-semibold text-text-primary">{fila.tema}</p>
      <p className="mt-0.5 text-text-secondary">
        NSS:{" "}
        <span className="font-medium text-text-primary">
          {fila.nss >= 0 ? "+" : ""}
          {fila.nss.toLocaleString("es-MX", { maximumFractionDigits: 1 })} pts
        </span>
      </p>
    </div>
  );
}

// Reemplaza la interactividad nativa de Nivo (siempre centra el tooltip
// arriba del cursor) por un control real de posición. Seguir el mouse (como
// en las otras gráficas de barras) no basta aquí: las barras negativas más
// cortas (ej. "-100 pts") quedan pegadas justo junto a la columna de nombres
// del eje, así que un tooltip "a la derecha del cursor" sigue cayendo casi
// encima del nombre. En vez de seguir el mouse, se ancla en la línea del
// cero (mismo punto de referencia que ya usa CapaEtiquetas) — ese punto
// siempre tiene espacio real de sobra a la derecha, sin importar qué tan
// corta sea la barra.
function CapaInteraccion({ bars }: BarCustomLayerProps<DatoNssTema>) {
  const { showTooltipAt, hideTooltip } = useTooltip();
  return (
    <g>
      {bars.map((bar) => {
        const { nss } = bar.data.data;
        const xCero = (nss ?? 0) >= 0 ? bar.x : bar.x + bar.width;
        const contenido = (
          <TooltipNss {...bar.data} value={bar.data.value ?? 0} color={bar.color} label={bar.label} />
        );
        return (
          <rect
            key={bar.key}
            x={bar.x}
            y={bar.y}
            width={bar.width}
            height={bar.height}
            fill="transparent"
            onMouseEnter={() => showTooltipAt(contenido, [xCero, bar.y + bar.height / 2], "right")}
            onMouseMove={() => showTooltipAt(contenido, [xCero, bar.y + bar.height / 2], "right")}
            onMouseLeave={hideTooltip}
          />
        );
      })}
    </g>
  );
}

type GraficaNssPorTemaProps = {
  temas: NssPorTema[];
  className?: string;
};

export function GraficaNssPorTema({ temas, className }: GraficaNssPorTemaProps) {
  const t = useTranslations("charts");
  if (temas.length === 0) return null;

  // Nivo dibuja el primer elemento del array abajo y el último arriba en
  // barras horizontales: se ordena descendente para que el tema más
  // negativo quede arriba.
  // Nombres de narrativa reales pueden ser frases largas ("Problemática de
  // la administración de Semarnat..."). El eje ya se encarga de recortarlas
  // (truncateTickAt más abajo) — aquí se manda el nombre completo real para
  // que el tooltip lo muestre entero de verdad (antes decía que lo hacía
  // pero el dato ya llegaba recortado desde aquí).
  const data: DatoNssTema[] = [...temas]
    .sort((a, b) => b.nss - a.nss)
    .map((tema) => ({ tema: tema.tema, nss: tema.nss, n: tema.n }));

  // Escala independiente por lado en vez de un ±máximo simétrico: cuando casi
  // todos los temas son negativos y solo uno o dos son positivos (el caso
  // real más común), una escala simétrica le regala al lado positivo la
  // misma mitad del ancho que al negativo aunque casi no tenga barras —
  // dejando las barras negativas más largas y apretadas de lo necesario.
  const máximoPositivo = Math.max(0, ...data.map((d) => d.nss), 10);
  const mínimoNegativo = Math.min(0, ...data.map((d) => d.nss), -10);
  const escalaMax = máximoPositivo * 1.15;
  const escalaMin = mínimoNegativo * 1.15;

  return (
    <div
      className={cn("chart-frame flex h-full min-h-0 w-full flex-col", className)}
      role="img"
      aria-label={t("nssByTopicAria")}
    >
      {/* Sin overflow-hidden: el tooltip de Nivo no usa portal, se recortaba
          en las filas de arriba al necesitar salirse hacia arriba. */}
      <div className="min-h-0 min-w-0 flex-1">
        <ResponsiveBar
          data={data}
          keys={["nss"]}
          indexBy="tema"
          layout="horizontal"
          valueScale={{ type: "linear", min: escalaMin, max: escalaMax }}
          margin={{ top: 4, right: 100, bottom: 24, left: 140 }}
          padding={0.35}
          colors={(d) => (d.data.nss >= 0 ? PALETA_ACTIVA.positivo.plano : PALETA_ACTIVA.negativo.plano)}
          borderRadius={2}
          enableLabel={false}
          enableGridX={true}
          enableGridY={false}
          markers={[
            {
              axis: "x",
              value: 0,
              lineStyle: { stroke: "var(--color-border-default)", strokeWidth: 1 },
            },
          ]}
          axisTop={null}
          axisRight={null}
          axisLeft={{ tickSize: 0, tickPadding: 8, truncateTickAt: 22 }}
          axisBottom={{
            tickSize: 0,
            tickPadding: 6,
            format: (v) => `${v > 0 ? "+" : ""}${v}`,
          }}
          theme={{
            text: { fill: "var(--color-text-muted)", fontSize: 10 },
            grid: { line: { stroke: "var(--color-border-default)", strokeOpacity: 0.5 } },
          }}
          tooltip={TooltipNss}
          layers={["grid", "markers", "axes", "bars", CapaEtiquetas, CapaInteraccion]}
          animate={false}
        />
      </div>
    </div>
  );
}
