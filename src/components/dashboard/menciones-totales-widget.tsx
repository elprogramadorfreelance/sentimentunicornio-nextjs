"use client";

import { TrendingUpIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { GraficaBarrasMenciones } from "@/components/charts/grafica-barras-menciones";
import { CardTitleBar } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Hardcoded: métrica + 7 días del rango seleccionado. */
const MENCIONES_MOCK = {
  total: 12_456,
  cambio: 12.4,
  dias: [1_420, 1_680, 1_510, 1_180, 1_750, 2_050, 2_866] as const,
};

type MencionesTotalesWidgetProps = {
  className?: string;
  total?: number;
  cambio?: number | null;
  cambioAbsoluto?: number;
  dias?: readonly number[];
  variante?: "completa" | "compacta";
};

export function MencionesTotalesWidget({
  className,
  total = MENCIONES_MOCK.total,
  cambio = MENCIONES_MOCK.cambio,
  cambioAbsoluto = 0,
  dias = MENCIONES_MOCK.dias,
  variante = "completa",
}: MencionesTotalesWidgetProps) {
  const t = useTranslations("dashboard");
  const tDates = useTranslations("dates");
  const cambioPositivo = cambio !== null ? cambio >= 0 : cambioAbsoluto >= 0;
  const compacta = variante === "compacta";

  return (
    <section
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-border-default/30 bg-bg-base p-2.5 shadow-widget sm:p-3",
        className,
      )}
      aria-label={t("totalMentions")}
    >
      <CardTitleBar bleed="sm">{t("totalMentions")}</CardTitleBar>

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
          {total.toLocaleString("es-MX")}
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
                {cambioAbsoluto > 0 ? "+" : ""}
                {cambioAbsoluto.toLocaleString("es-MX")}
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
                {cambio.toFixed(1)}%
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
