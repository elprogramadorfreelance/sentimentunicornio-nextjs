"use client";

import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { CardTitleBar } from "@/components/ui";
import type { TendenciaPanel } from "@/lib/mock/metricas-panel";
import { cn } from "@/lib/utils";

const TENDENCIAS_DEFAULT: TendenciaPanel[] = [
  { posicion: 1, nombre: "Mundial 2026", cambio: 1, url: null },
  { posicion: 2, nombre: "#FelizDía", cambio: 0, url: null },
  { posicion: 3, nombre: "Gobierno de México", cambio: 4, url: null },
  { posicion: 4, nombre: "La Casa de los Famosos", cambio: 0, url: null },
  { posicion: 5, nombre: "Pedrito Sola", cambio: 0, url: null },
  { posicion: 6, nombre: "Plan DN3", cambio: 0, url: null },
  { posicion: 7, nombre: "ONU", cambio: -3, url: null },
  { posicion: 8, nombre: "Trump", cambio: 0, url: null },
  { posicion: 9, nombre: "Claudia Sheinbaum", cambio: -1, url: null },
  { posicion: 10, nombre: "CDMX", cambio: 0, url: null },
];

type TendenciasWidgetProps = {
  className?: string;
  tendencias?: TendenciaPanel[];
  // Al dar clic en un tema, se prefiere mostrar las menciones reales que lo
  // componen (mismo patrón que Narrativas) en vez de saltar a una sola URL
  // externa — un tema es por definición lo que MÁS se repite, no un solo
  // post. Si no se pasa, cae al link antiguo (`url`) por compatibilidad.
  onTemaClick?: (nombre: string) => void;
};

export function TendenciasWidget({
  className,
  tendencias = TENDENCIAS_DEFAULT,
  onTemaClick,
}: TendenciasWidgetProps) {
  const t = useTranslations("dashboard");

  return (
    <section
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border-default/30 bg-bg-base p-2.5 shadow-widget sm:p-3",
        className,
      )}
      aria-label={t("topTopics")}
    >
      <CardTitleBar bleed="sm">{t("topTopics")}</CardTitleBar>

      <ol className="mt-2 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-0.5 lg:mt-6 lg:gap-6">
        {tendencias.slice(0, 5).map(({ posicion, nombre, cambio, url }) => (
          <li
            key={`${posicion}-${nombre}`}
            className="flex shrink-0 items-center gap-1.5 text-sm leading-none"
          >
            <span className="w-4 shrink-0 text-right text-sm tabular-nums text-text-muted">
              {posicion}
            </span>
            {onTemaClick ? (
              <button
                type="button"
                onClick={() => onTemaClick(nombre)}
                className="min-w-0 flex-1 truncate text-left text-base font-medium text-text-secondary underline-offset-2 hover:text-accent hover:underline"
                title={nombre}
              >
                {nombre}
              </button>
            ) : url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate text-base font-medium text-text-secondary underline-offset-2 hover:text-accent hover:underline"
                title={nombre}
              >
                {nombre}
              </a>
            ) : (
              <span className="min-w-0 flex-1 text-base truncate text-text-secondary font-medium">
                {nombre}
              </span>
            )}
            {cambio !== 0 && (
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-0.5 text-[11px] font-medium tabular-nums",
                  cambio > 0 ? "text-success" : "text-error",
                )}
              >
                {cambio > 0 ? (
                  <ArrowUpIcon className="size-2.5 stroke-[3]" aria-hidden />
                ) : (
                  <ArrowDownIcon className="size-2.5 stroke-[3]" aria-hidden />
                )}
                <span className="sr-only">
                  {cambio > 0 ? t("trendUp") : t("trendDown")}{" "}
                </span>
                {Math.abs(cambio)}
                <span className="sr-only"> {t("positions")}</span>
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
