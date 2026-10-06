"use client";

import { TrendingUpIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { GraficaBarrasMenciones } from "@/components/charts/grafica-barras-menciones";
import { CardTitleBar } from "@/components/ui";
import { cn } from "@/lib/utils";

type PromedioMencionesWidgetProps = {
  className?: string;
  total?: number;
  cambio?: number | null;
  /** Delta de menciones totales actual vs período anterior (mismo largo de ventana). */
  cambioAbsoluto?: number;
  dias?: readonly number[];
  variante?: "completa" | "compacta";
};

export function PromedioMencionesWidget({
  className,
  total = 0,
  cambio = null,
  cambioAbsoluto = 0,
  dias = [0, 0, 0, 0, 0, 0, 0],
  variante = "completa",
}: PromedioMencionesWidgetProps) {
  const t = useTranslations("dashboard");
  const tDates = useTranslations("dates");
  const promedio = Math.round(total / dias.length);
  // Ambas ventanas tienen el mismo largo, así que la diferencia de promedios
  // diarios es exactamente el delta total dividido entre los días.
  const promedioAbsoluto = Math.round(cambioAbsoluto / dias.length);
  const cambioPositivo = cambio !== null ? cambio >= 0 : promedioAbsoluto >= 0;
  const compacta = variante === "compacta";

  return (
    <section
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border-default/30 bg-bg-base p-2.5 shadow-widget sm:p-3",
        className,
      )}
      aria-label={t("avgMentionsPerDay")}
    >
      <CardTitleBar bleed="sm">{t("avgMentions")}</CardTitleBar>

      <div
        className={cn(
          "mt-1 flex shrink-0 items-baseline gap-2",
          compacta ? "mt-auto" : "mx-auto",
        )}
      >
        <p
          className={cn(
            "font-bold tracking-tight text-text-primary tabular-nums",
            compacta ? "text-xl lg:text-2xl" : "text-2xl lg:text-3xl",
          )}
        >
          {promedio.toLocaleString("es-MX")}
        </p>
        {!compacta &&
          (cambio === null ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-semibold",
                cambioPositivo ? "text-success" : "text-error",
              )}
            >
              <TrendingUpIcon
                className={cn("size-3.5", !cambioPositivo && "rotate-180")}
                aria-hidden
              />
              <span className="tabular-nums">
                {promedioAbsoluto > 0 ? "+" : ""}
                {promedioAbsoluto.toLocaleString("es-MX")}
              </span>
            </span>
          ) : (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-semibold",
                cambioPositivo ? "text-success" : "text-error",
              )}
            >
              <TrendingUpIcon
                className={cn("size-3.5", !cambioPositivo && "rotate-180")}
                aria-hidden
              />
              <span className="tabular-nums">
                {cambioPositivo ? "+" : ""}
                {cambio.toFixed(2)}%
              </span>
            </span>
          ))}
      </div>

      {!compacta && (
        <>
          <p className="mt-2 shrink-0 text-center text-[10px] text-text-muted">
            {dias.length === 7 ? tDates("last7Days") : tDates("last30Days")}
          </p>
          <div className="mt-1 min-h-0 min-w-0 flex-1 overflow-hidden px-2 sm:px-8 lg:px-16">
            <GraficaBarrasMenciones valores={dias} className="h-full min-h-0" />
          </div>
        </>
      )}
    </section>
  );
}
