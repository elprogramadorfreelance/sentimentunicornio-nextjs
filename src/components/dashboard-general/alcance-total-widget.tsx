"use client";

import { TrendingUpIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { GraficaBarrasMenciones } from "@/components/charts/grafica-barras-menciones";
import { CardTitleBar } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Hardcoded: alcance agregado de todos los proyectos activos en el rango. */
const ALCANCE_MOCK = {
  total: 13_700_000,
  cambio: 3.13,
  dias: [
    8_200_000, 9_100_000, 8_700_000, 10_400_000, 12_100_000, 11_600_000,
    13_700_000,
  ] as const,
};

type AlcanceTotalWidgetProps = {
  className?: string;
  total?: number;
  cambio?: number | null;
  cambioAbsoluto?: number;
  dias?: readonly number[];
  variante?: "completa" | "compacta";
};

function formatearAlcance(valor: number): string {
  if (valor >= 1_000_000_000)
    return `${(valor / 1_000_000_000).toFixed(1)} mil M`;
  if (valor >= 1_000_000) return `${(valor / 1_000_000).toFixed(1)} M`;
  if (valor >= 1_000) return `${(valor / 1_000).toFixed(1)} mil`;
  return valor.toLocaleString("es-MX");
}

export function AlcanceTotalWidget({
  className,
  total = ALCANCE_MOCK.total,
  cambio = ALCANCE_MOCK.cambio,
  cambioAbsoluto = 0,
  dias = ALCANCE_MOCK.dias,
  variante = "completa",
}: AlcanceTotalWidgetProps) {
  const t = useTranslations("dashboard");
  const tDates = useTranslations("dates");
  const cambioPositivo = cambio !== null ? cambio >= 0 : cambioAbsoluto >= 0;
  const compacta = variante === "compacta";

  return (
    <section
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border-default/30 bg-bg-base p-2.5 shadow-widget sm:p-3",
        className,
      )}
      aria-label={t("totalReach")}
    >
      <CardTitleBar bleed="sm">
        {t("totalReach")}{" "}
        <span className="text-xs font-normal align-middle">
          {t("estimatedSuffix")}
        </span>
      </CardTitleBar>

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
          {formatearAlcance(total)}
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
                {formatearAlcance(cambioAbsoluto)}
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
