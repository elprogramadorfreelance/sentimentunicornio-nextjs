"use client";

import { useTranslations } from "next-intl";
import { GraficaComparacionLineas } from "@/components/charts/grafica-comparacion-lineas";
import {
  obtenerTendenciaAlcanceMock,
  type PuntoTendenciaAlcance,
} from "@/lib/mock/dashboard-general";
import { CardTitleBar } from "@/components/ui";
import { cn } from "@/lib/utils";

type TendenciaAlcanceWidgetProps = {
  className?: string;
  puntos?: PuntoTendenciaAlcance[];
};

export function TendenciaAlcanceWidget({
  className,
  puntos: puntosProp,
}: TendenciaAlcanceWidgetProps) {
  const t = useTranslations("dashboard");
  const puntos = puntosProp ?? obtenerTendenciaAlcanceMock();

  return (
    <section
      className={cn(
        "flex h-full min-h-0 flex-col rounded-lg border border-border-default/30 bg-bg-base p-2.5 shadow-widget sm:p-3",
        className,
      )}
      aria-label={t("reachTrend")}
    >
      <CardTitleBar bleed="sm">
        {t("reachTrend")}{" "}
        <span className="text-xs font-normal align-middle">
          {t("estimatedSuffix")}
        </span>
      </CardTitleBar>

      <div className="mt-2 min-h-0 flex-1">
        <GraficaComparacionLineas puntos={puntos} className="h-full" />
      </div>
    </section>
  );
}
