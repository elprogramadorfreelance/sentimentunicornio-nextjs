"use client";

import type { BarDatum, BarTooltipProps } from "@nivo/bar";
import { ResponsiveBar } from "@nivo/bar";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { PuntoTendenciaTonalidad } from "@/types";
import {
  formatearMenciones,
  SEGMENTOS_TONALIDAD,
} from "./constantes-tonalidad";

type ClaveSegmento = "neutro" | "positivo" | "negativo";

type DatoTendencia = BarDatum & {
  fecha: string;
  positivo: number;
  negativo: number;
  neutro: number;
};

const CLAVES_BARRA: {
  clave: ClaveSegmento;
  commonKey: "neutral" | "positive" | "negative";
  color: string;
}[] = [
  {
    clave: "neutro",
    commonKey: "neutral",
    color: SEGMENTOS_TONALIDAD[0].color,
  },
  {
    clave: "positivo",
    commonKey: "positive",
    color: SEGMENTOS_TONALIDAD[1].color,
  },
  {
    clave: "negativo",
    commonKey: "negative",
    color: SEGMENTOS_TONALIDAD[2].color,
  },
];

type GraficaTendenciaTonalidadesProps = {
  puntos: PuntoTendenciaTonalidad[];
  className?: string;
};

/**
 * Antes solo marcaba el día 1 y 15 de cada mes — pensado para un rango largo
 * (90 días), pero con un período corto (7-14 días, el caso más común) esos
 * dos días casi nunca caen dentro del rango visible, así que el eje X salía
 * prácticamente vacío (bug real reportado por el cliente, 2026-10-01: solo
 * se veía "1 oct" porque hoy da la casualidad de ser el día 1). Ahora
 * reparte like máximo ~7 etiquetas a lo largo de TODO el rango real,
 * sin importar si son 7, 14, 30 o 90 puntos — el primer y último punto
 * siempre se etiquetan.
 */
function fechasConEtiqueta(fechas: string[]): Set<string> {
  const total = fechas.length;
  const máximoEtiquetas = 7;
  const paso = Math.max(1, Math.ceil(total / máximoEtiquetas));
  const conEtiqueta = new Set<string>();
  fechas.forEach((fecha, índice) => {
    if (índice % paso === 0 || índice === total - 1) conEtiqueta.add(fecha);
  });
  return conEtiqueta;
}

function formatearFechaEje(fecha: string): string {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });
}

export function GraficaTendenciaTonalidades({
  puntos,
  className,
}: GraficaTendenciaTonalidadesProps) {
  const t = useTranslations("sentimentPage");
  const tCommon = useTranslations("common");
  const etiquetaPorClave = Object.fromEntries(
    CLAVES_BARRA.map((s) => [s.clave, tCommon(s.commonKey)]),
  ) as Record<ClaveSegmento, string>;

  function TooltipTendencia({
    id,
    value,
    indexValue,
  }: BarTooltipProps<DatoTendencia>) {
    const clave = id as ClaveSegmento;
    const fecha = String(indexValue);
    const [año, mes, día] = fecha.split("-");

    return (
      <div className="rounded-md border border-border-default bg-bg-base px-2.5 py-1.5 text-xs shadow-md">
        <p className="font-semibold text-text-primary">
          {día}/{mes}/{año}
        </p>
        <p className="mt-0.5 text-text-secondary">
          {etiquetaPorClave[clave]}:{" "}
          <span className="font-medium text-text-primary">
            {formatearMenciones(Number(value))}
          </span>
        </p>
      </div>
    );
  }

  if (puntos.length === 0) return null;

  const data: DatoTendencia[] = puntos.map((punto) => ({
    fecha: punto.fecha,
    positivo: punto.positivo,
    negativo: punto.negativo,
    neutro: punto.neutro,
  }));
  const conEtiqueta = fechasConEtiqueta(puntos.map((p) => p.fecha));

  return (
    <div
      className={cn("h-full min-h-0 w-full", className)}
      role="img"
      aria-label={t("tonesTrendAria")}
    >
      <ResponsiveBar
        data={data}
        keys={CLAVES_BARRA.map((s) => s.clave)}
        indexBy="fecha"
        groupMode="stacked"
        margin={{ top: 8, right: 8, bottom: 28, left: 40 }}
        padding={0.12}
        colors={CLAVES_BARRA.map((s) => s.color)}
        borderRadius={1}
        enableLabel={false}
        enableGridX={false}
        enableGridY={true}
        gridYValues={4}
        axisTop={null}
        axisRight={null}
        axisLeft={{
          tickSize: 0,
          tickPadding: 6,
          tickValues: 4,
          format: (v) =>
            Intl.NumberFormat("es-MX", { notation: "compact" }).format(
              Number(v),
            ),
        }}
        axisBottom={{
          tickSize: 0,
          tickPadding: 8,
          format: (v) =>
            conEtiqueta.has(String(v)) ? formatearFechaEje(String(v)) : "",
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
        tooltip={TooltipTendencia}
        animate={false}
      />
    </div>
  );
}
