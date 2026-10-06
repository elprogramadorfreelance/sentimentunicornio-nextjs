"use client";

import { useTranslations } from "next-intl";
import { GraficaBarraTraficoFuente } from "@/components/charts/grafica-barra-trafico-fuente";
import { CardTitleBar } from "@/components/ui";
import type { FuenteTraficoPanel } from "@/lib/mock/metricas-panel";
import { cn } from "@/lib/utils";

const FUENTES_DEFAULT: FuenteTraficoPanel[] = [
  {
    id: "x",
    fuente: "X (Twitter)",
    menciones: "2.4K",
    porcentaje: 55,
    color: "var(--color-sky)",
  },
  {
    id: "facebook",
    fuente: "Facebook",
    menciones: "3.5K",
    porcentaje: 80,
    color: "var(--color-navy)",
  },
  {
    id: "blogs",
    fuente: "Blogs",
    menciones: "1.8K",
    porcentaje: 35,
    color: "var(--color-blue)",
  },
];

type TraficoFuentesWidgetProps = {
  className?: string;
  fuentes?: FuenteTraficoPanel[];
};

export function TraficoFuentesWidget({
  className,
  fuentes = FUENTES_DEFAULT,
}: TraficoFuentesWidgetProps) {
  const t = useTranslations("dashboard");

  return (
    <section
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border-default/30 bg-bg-base p-2.5 shadow-widget sm:p-3",
        className,
      )}
      aria-label={t("mentionsBySource")}
    >
      <CardTitleBar bleed="sm">{t("mentionsBySource")}</CardTitleBar>

      <ul className="mt-2 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-0.5">
        {fuentes.map(({ id, fuente, menciones, porcentaje, color }) => (
          <li key={id} className="shrink-0 space-y-1">
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="text-text-secondary">{fuente}</span>
              <span className="shrink-0 text-text-muted tabular-nums">
                {t("mentionsCount", { count: menciones })}
              </span>
            </div>
            <div
              className="relative h-3 w-full overflow-hidden rounded-sm bg-bg-muted"
              role="img"
              aria-label={`${fuente}: ${t("mentionsCount", { count: menciones })}`}
            >
              <GraficaBarraTraficoFuente
                fuente={fuente}
                porcentaje={porcentaje}
                color={color}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
