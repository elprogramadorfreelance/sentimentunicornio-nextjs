"use client";

import type { BarDatum, BarTooltipProps } from "@nivo/bar";
import { ResponsiveBar } from "@nivo/bar";
import { useTranslations } from "next-intl";
import { PALETA_ACTIVA } from "@/lib/paletas-graficas";
import { cn } from "@/lib/utils";
import type { Proyecto } from "@/types";

type DatoAnalisisProyecto = BarDatum & {
  id: string;
  proyecto: string;
  proyectoCompleto: string;
  analisis: number;
};

function TooltipProyecto({ data: fila }: BarTooltipProps<DatoAnalisisProyecto>) {
  return (
    <div className="rounded-md border border-border-default bg-bg-base px-2.5 py-1.5 text-xs shadow-md">
      <p className="font-semibold text-text-primary">{fila.proyectoCompleto}</p>
      <p className="mt-0.5 text-text-secondary">
        <span className="font-medium text-text-primary">{fila.analisis}</span> análisis
      </p>
    </div>
  );
}

type GraficaAnalisisProyectosProps = {
  proyectos: Proyecto[];
  className?: string;
};

export function GraficaAnalisisProyectos({
  proyectos,
  className,
}: GraficaAnalisisProyectosProps) {
  const t = useTranslations("charts");
  const tProjects = useTranslations("projects");
  // El nombre real completo se conserva aparte para el tooltip — la etiqueta
  // del eje sigue recortada (no cabe rotada en el margen), pero antes no
  // había forma de leer el nombre completo en ningún lado, ni pasando el
  // mouse encima.
  const data: DatoAnalisisProyecto[] = proyectos.map((p) => ({
    id: p.id,
    proyecto: p.nombre.length > 18 ? `${p.nombre.slice(0, 16)}…` : p.nombre,
    proyectoCompleto: p.nombre,
    analisis: p.analisis,
  }));

  if (data.length === 0) {
    return <p className="text-xs text-text-muted">{t("noProjects")}</p>;
  }

  return (
    <div
      className={cn("h-44 w-full", className)}
      role="img"
      aria-label={tProjects("analysisByProjectAria")}
    >
      <ResponsiveBar
        data={data}
        keys={["analisis"]}
        indexBy="proyecto"
        margin={{ top: 8, right: 8, bottom: 48, left: 36 }}
        padding={0.35}
        colors={[PALETA_ACTIVA.categorica[0].plano]}
        borderRadius={4}
        enableLabel={false}
        axisBottom={{
          tickRotation: -28,
          tickSize: 0,
          tickPadding: 8,
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 6,
          tickValues: 4,
        }}
        tooltip={TooltipProyecto}
        theme={{
          text: {
            fill: "var(--color-text-muted)",
            fontSize: 10,
          },
          axis: {
            ticks: {
              text: {
                fill: "var(--color-text-muted)",
                fontSize: 10,
              },
            },
          },
          grid: {
            line: {
              stroke: "var(--color-border-default)",
              strokeOpacity: 0.5,
            },
          },
        }}
        animate={false}
      />
    </div>
  );
}
