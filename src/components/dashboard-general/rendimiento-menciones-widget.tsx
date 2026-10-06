"use client";

import { useTranslations } from "next-intl";
import { GraficaBurbujas } from "@/components/charts/grafica-burbujas";
import { obtenerRendimientoProyectosMock } from "@/lib/mock/dashboard-general";
import { CardTitleBar } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Proyecto } from "@/types";

export type BurbujaRendimientoReal = {
  proyectoId: string;
  nombre: string;
  x: number;
  y: number;
  z: number;
};

type RendimientoMencionesWidgetProps = {
  proyectos: Proyecto[];
  puntos?: BurbujaRendimientoReal[];
  className?: string;
};

export function RendimientoMencionesWidget({
  proyectos,
  puntos: puntosProp,
  className,
}: RendimientoMencionesWidgetProps) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  // x = menciones reales, y = alcance estimado real, tamaño de burbuja =
  // % de menciones negativas real. Bruno usa "engagement" en el eje X, pero
  // esa métrica no existe en la base de datos (no hay likes/shares/comentarios).
  const puntos = (
    puntosProp ??
    obtenerRendimientoProyectosMock(proyectos).map((b) => ({
      proyectoId: b.proyectoId,
      nombre: b.nombre,
      x: b.engagement,
      y: b.alcance,
      z: b.menciones,
    }))
  ).map((p) => ({ id: p.proyectoId, etiqueta: p.nombre, x: p.x, y: p.y, tamano: p.z }));

  return (
    <section
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-col rounded-lg border border-border-default/30 bg-bg-base p-2.5 shadow-widget sm:p-3",
        className,
      )}
      aria-label={t("mentionPerformance")}
    >
      <CardTitleBar bleed="sm">{t("mentionPerformance")}</CardTitleBar>
      <p className="shrink-0 text-[10px] text-text-muted">
        {t("bubbleAxesHint")}
      </p>

      {/* Sin overflow-hidden: cortaba el tooltip de Nivo (sin portal) cuando
          una burbuja está cerca del borde superior. */}
      <div className="mt-1.5 min-h-0 min-w-0 flex-1">
        <GraficaBurbujas
          puntos={puntos}
          etiquetaX={tCommon("mentions")}
          etiquetaY={tCommon("reach")}
          className="h-full"
        />
      </div>
    </section>
  );
}
