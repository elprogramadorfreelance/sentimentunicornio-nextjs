"use client";

import { ResponsiveBar } from "@nivo/bar";
import type { LineCustomSvgLayerProps } from "@nivo/line";
import { ResponsiveLine } from "@nivo/line";
import type { PieCustomLayerProps } from "@nivo/pie";
import { ResponsivePie } from "@nivo/pie";
import { useEffect, useState } from "react";
import { GraficaBarraSentimiento } from "@/components/charts/grafica-barra-sentimiento";
import { GraficaMapaRegiones } from "@/components/charts/grafica-mapa-regiones";
import { generarRegionesMock } from "@/lib/mock/narrativas";
import {
  type ClaveTonalidad,
  cssDegradado,
  defAreaNivo,
  type PaletaGraficas,
  rellenosNivo,
} from "@/lib/paletas-graficas";
import { cn } from "@/lib/utils";

const ETIQUETAS: Record<ClaveTonalidad, string> = {
  positivo: "Positivo",
  neutro: "Neutro",
  negativo: "Negativo",
};

const ORDEN_TONALIDAD: readonly ClaveTonalidad[] = [
  "positivo",
  "neutro",
  "negativo",
];

const DESGLOSE: Record<ClaveTonalidad, number> = {
  positivo: 4820,
  neutro: 3110,
  negativo: 1970,
};

const TONALIDAD_POR_FUENTE = [
  { fuente: "X", positivo: 38, neutro: 34, negativo: 28 },
  { fuente: "Facebook", positivo: 46, neutro: 32, negativo: 22 },
  { fuente: "Instagram", positivo: 58, neutro: 27, negativo: 15 },
  { fuente: "TikTok", positivo: 41, neutro: 30, negativo: 29 },
  { fuente: "Noticias", positivo: 33, neutro: 45, negativo: 22 },
  { fuente: "Blogs", positivo: 49, neutro: 36, negativo: 15 },
];

const MENCIONES_POR_FUENTE = [
  { fuente: "X", total: 3120 },
  { fuente: "Facebook", total: 2480 },
  { fuente: "Instagram", total: 1960 },
  { fuente: "TikTok", total: 1540 },
  { fuente: "Noticias", total: 980 },
  { fuente: "Blogs", total: 420 },
];

const SERIE = Array.from({ length: 14 }, (_, i) => {
  const dia = String(i + 8).padStart(2, "0");
  return {
    x: `09/${dia}`,
    positivo: Math.round(320 + 90 * Math.sin(i / 2.2) + i * 8),
    neutro: Math.round(230 + 40 * Math.cos(i / 1.7)),
    negativo: Math.round(140 + 70 * Math.sin(i / 1.4 + 1.2)),
  };
});

const REGIONES = generarRegionesMock("mexico", ["MX"], ["propuesta"], 7);

const TEMA_NIVO = {
  text: { fill: "var(--color-text-muted)", fontSize: 10 },
  grid: {
    line: { stroke: "var(--color-border-default)", strokeOpacity: 0.5 },
  },
};

const FORMATO = new Intl.NumberFormat("es-MX");

type MuestraProps = { paleta: PaletaGraficas };

function Leyenda({
  paleta,
  claves = ORDEN_TONALIDAD,
}: MuestraProps & { claves?: readonly ClaveTonalidad[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
      {claves.map((clave) => (
        <li key={clave} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full"
            style={{ backgroundImage: cssDegradado(paleta[clave], "135deg") }}
          />
          {ETIQUETAS[clave]}
        </li>
      ))}
    </ul>
  );
}

function Muestra({
  titulo,
  children,
  className,
}: {
  titulo: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-lg border border-border-default bg-bg-subtle p-4",
        className,
      )}
    >
      <h3 className="text-sm font-semibold text-text-primary">{titulo}</h3>
      {children}
    </section>
  );
}

export function MuestraEscalaCaras({ paleta }: MuestraProps) {
  const total = DESGLOSE.positivo + DESGLOSE.neutro + DESGLOSE.negativo;
  const segmentos = ORDEN_TONALIDAD.map((clave) => ({
    id: clave,
    etiqueta: ETIQUETAS[clave],
    porcentaje: Math.round((DESGLOSE[clave] / total) * 100),
    color: paleta[clave].plano,
  }));
  return (
    <Muestra titulo="Escala de sentimiento">
      <GraficaBarraSentimiento
        segmentos={segmentos}
        tonos={paleta.escala}
        className={cn("self-start", paleta.claseSuperficie)}
      />
    </Muestra>
  );
}

export function MuestraDona({ paleta }: MuestraProps) {
  const data = ORDEN_TONALIDAD.map((clave) => ({
    id: clave,
    label: ETIQUETAS[clave],
    value: DESGLOSE[clave],
    color: paleta[clave].plano,
  }));
  const { defs, fill } = rellenosNivo(
    paleta,
    ORDEN_TONALIDAD.map((clave) => ({ clave, degradado: paleta[clave] })),
    "diagonal",
  );

  function CapaCentro({
    centerX,
    centerY,
    dataWithArc,
  }: PieCustomLayerProps<(typeof data)[number]>) {
    const total = dataWithArc.reduce((acc, d) => acc + d.value, 0);
    return (
      <g transform={`translate(${centerX},${centerY})`}>
        <text
          textAnchor="middle"
          y={-6}
          fill="var(--color-text-muted)"
          style={{ fontSize: 11 }}
        >
          Menciones
        </text>
        <text
          textAnchor="middle"
          y={14}
          fill="var(--color-text-primary)"
          style={{ fontSize: 18, fontWeight: 700 }}
        >
          {FORMATO.format(total)}
        </text>
      </g>
    );
  }

  return (
    <Muestra titulo="Distribución de sentimiento">
      <div className="chart-frame h-48">
        <ResponsivePie
          data={data}
          margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
          innerRadius={0.68}
          padAngle={1.6}
          cornerRadius={3}
          colors={(d) => d.data.color}
          defs={defs}
          fill={fill}
          enableArcLabels={false}
          enableArcLinkLabels={false}
          isInteractive={false}
          layers={["arcs", CapaCentro]}
          animate={false}
        />
      </div>
      <Leyenda paleta={paleta} />
    </Muestra>
  );
}

type SerieLinea = { id: ClaveTonalidad; data: { x: string; y: number }[] };

export function MuestraSerie({ paleta }: MuestraProps) {
  const data: SerieLinea[] = ORDEN_TONALIDAD.map((clave) => ({
    id: clave,
    data: SERIE.map((punto) => ({ x: punto.x, y: punto[clave] })),
  }));
  const defs = ORDEN_TONALIDAD.map((clave) =>
    defAreaNivo(`${paleta.id}-area-${clave}`, paleta[clave]),
  );

  function CapaAreas({
    series,
    areaGenerator,
  }: LineCustomSvgLayerProps<SerieLinea>) {
    return (
      <g>
        {series.map((serie) => {
          const path = areaGenerator(
            serie.data.map((d) => ({ x: d.position.x, y: d.position.y })),
          );
          if (!path) return null;
          return (
            <path
              key={String(serie.id)}
              d={path}
              fill={`url(#${paleta.id}-area-${serie.id})`}
            />
          );
        })}
      </g>
    );
  }

  return (
    <Muestra titulo="Tendencia de sentimiento">
      <div className="chart-frame h-52">
        <ResponsiveLine<SerieLinea>
          data={data}
          margin={{ top: 12, right: 8, bottom: 28, left: 36 }}
          xScale={{ type: "point" }}
          yScale={{ type: "linear", min: 0, max: "auto", stacked: false }}
          curve="monotoneX"
          colors={data.map((serie) => paleta[serie.id].plano)}
          lineWidth={2.25}
          defs={defs}
          enablePoints={false}
          enableGridX={false}
          gridYValues={4}
          axisBottom={{
            tickSize: 0,
            tickPadding: 8,
            tickValues: SERIE.filter((_, i) => i % 3 === 0).map((p) => p.x),
          }}
          axisLeft={{ tickSize: 0, tickPadding: 8, tickValues: 4 }}
          theme={TEMA_NIVO}
          isInteractive={false}
          layers={["grid", "axes", CapaAreas, "lines"]}
          animate={false}
        />
      </div>
      <Leyenda paleta={paleta} />
    </Muestra>
  );
}

export function MuestraTonalidadFuente({ paleta }: MuestraProps) {
  const claves: readonly ClaveTonalidad[] = ["positivo", "neutro", "negativo"];
  const { defs, fill } = rellenosNivo(
    paleta,
    claves.map((clave) => ({ clave, degradado: paleta[clave] })),
    "horizontal",
  );
  return (
    <Muestra titulo="Tonalidad por fuente">
      <div className="chart-frame h-56">
        <ResponsiveBar
          data={[...TONALIDAD_POR_FUENTE].reverse()}
          keys={[...claves]}
          indexBy="fuente"
          layout="horizontal"
          groupMode="stacked"
          margin={{ top: 4, right: 16, bottom: 20, left: 64 }}
          padding={0.35}
          colors={({ id }) => paleta[id as ClaveTonalidad].plano}
          defs={defs}
          fill={fill}
          borderRadius={2}
          enableLabel={false}
          enableGridX
          enableGridY={false}
          gridXValues={[0, 25, 50, 75, 100]}
          axisTop={null}
          axisRight={null}
          axisLeft={{ tickSize: 0, tickPadding: 8 }}
          axisBottom={{
            tickSize: 0,
            tickPadding: 6,
            tickValues: [0, 25, 50, 75, 100],
            format: (v) => `${v}%`,
          }}
          theme={TEMA_NIVO}
          isInteractive={false}
          animate={false}
        />
      </div>
      <Leyenda paleta={paleta} claves={claves} />
    </Muestra>
  );
}

export function MuestraMencionesFuente({ paleta }: MuestraProps) {
  const entradas = MENCIONES_POR_FUENTE.map((fila, i) => ({
    clave: fila.fuente,
    degradado: paleta.categorica[i % paleta.categorica.length],
  }));
  const { defs, fill } = rellenosNivo(
    paleta,
    entradas,
    "vertical",
    "indexValue",
  );
  return (
    <Muestra titulo="Menciones por fuente">
      <div className="chart-frame h-52">
        <ResponsiveBar
          data={MENCIONES_POR_FUENTE}
          keys={["total"]}
          indexBy="fuente"
          margin={{ top: 8, right: 8, bottom: 24, left: 40 }}
          padding={0.3}
          colors={({ index }) =>
            paleta.categorica[index % paleta.categorica.length].plano
          }
          defs={defs}
          fill={fill}
          borderRadius={4}
          enableLabel={false}
          enableGridY
          gridYValues={4}
          axisTop={null}
          axisRight={null}
          axisBottom={{ tickSize: 0, tickPadding: 8 }}
          axisLeft={{
            tickSize: 0,
            tickPadding: 8,
            tickValues: 4,
            format: (v) =>
              new Intl.NumberFormat("es-MX", { notation: "compact" }).format(
                Number(v),
              ),
          }}
          theme={TEMA_NIVO}
          isInteractive={false}
          animate={false}
        />
      </div>
    </Muestra>
  );
}

type ImagenesReporte = { sentimiento: string; porFuente: string };

export function MuestraReporte({ paleta }: MuestraProps) {
  const [imagenes, setImagenes] = useState<ImagenesReporte | null>(null);

  useEffect(() => {
    let cancelado = false;
    import("@/lib/reportes/graficas-pdf").then((graficas) => {
      if (cancelado) return;
      const total = DESGLOSE.positivo + DESGLOSE.neutro + DESGLOSE.negativo;
      setImagenes({
        sentimiento: graficas.generarBarraSentimientoConPaleta(
          {
            positivo: (DESGLOSE.positivo / total) * 100,
            neutro: (DESGLOSE.neutro / total) * 100,
            negativo: (DESGLOSE.negativo / total) * 100,
          },
          paleta,
        ),
        porFuente: graficas.generarTonalidadPorFuenteConPaleta(
          TONALIDAD_POR_FUENTE.map((fila) => fila.fuente),
          TONALIDAD_POR_FUENTE,
          paleta,
        ),
      });
    });
    return () => {
      cancelado = true;
    };
  }, [paleta]);

  return (
    <Muestra titulo="Reporte PDF / PPTX">
      <p className="text-xs text-text-secondary">
        Imágenes generadas con el mismo motor que usan las exportaciones. El
        reporte siempre se imprime sobre fondo blanco.
      </p>
      <div className="grid gap-3 rounded-md bg-white p-3 ring-1 ring-black/5">
        {imagenes ? (
          <>
            {/* biome-ignore lint/performance/noImgElement: PNG en data URL generado en cliente */}
            <img
              src={imagenes.sentimiento}
              alt={`Barra de sentimiento del reporte, ${paleta.nombre}`}
              className="w-full"
            />
            {/* biome-ignore lint/performance/noImgElement: PNG en data URL generado en cliente */}
            <img
              src={imagenes.porFuente}
              alt={`Tonalidad por fuente del reporte, ${paleta.nombre}`}
              className="w-full"
            />
          </>
        ) : (
          <div className="aspect-[640/340] w-full" />
        )}
      </div>
    </Muestra>
  );
}

export function MuestraMapa({ paleta }: MuestraProps) {
  return (
    <Muestra titulo="Menciones por región">
      <div className="h-64">
        <GraficaMapaRegiones
          regiones={REGIONES}
          alcance="mexico"
          rampa={paleta.rampa}
        />
      </div>
    </Muestra>
  );
}
