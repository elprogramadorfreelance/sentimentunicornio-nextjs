"use client";

import { useTranslations } from "next-intl";
import { GraficaComboTendencia } from "@/components/charts/grafica-combo-tendencia";
import {
  obtenerTendenciaMencionesAlcanceMock,
  type PuntoTendenciaMencionesAlcance,
} from "@/lib/mock/dashboard-general";
import { CardTitleBar } from "@/components/ui";
import { cn } from "@/lib/utils";

type TendenciaMencionesAlcanceWidgetProps = {
  className?: string;
  puntos?: PuntoTendenciaMencionesAlcance[];
};

export function TendenciaMencionesAlcanceWidget({
  className,
  puntos: puntosProp,
}: TendenciaMencionesAlcanceWidgetProps) {
  const t = useTranslations("dashboard");
  const puntos = puntosProp ?? obtenerTendenciaMencionesAlcanceMock();

  return (
    <section
      className={cn(
        "flex h-full min-h-0 flex-col rounded-lg border border-border-default/30 bg-bg-base p-2.5 shadow-widget sm:p-3",
        className,
      )}
      aria-label={t("mentionsReachTrend")}
    >
      <CardTitleBar bleed="sm">{t("mentionsReachTrend")}</CardTitleBar>

      <div className="mt-2 min-h-0 flex-1">
        <GraficaComboTendencia puntos={puntos} className="h-full" />
      </div>
    </section>
  );
}
