"use client";

import { useTranslations } from "next-intl";
import { GraficaBarraAlcanceFuente } from "@/components/charts/grafica-barra-alcance-fuente";
import {
  type FuentePotencial,
  formatearAlcanceCompacto,
  obtenerAlcancePorFuenteMock,
} from "@/lib/mock/dashboard-general";
import { CardTitleBar } from "@/components/ui";
import { PALETA_ACTIVA } from "@/lib/paletas-graficas";
import { cn } from "@/lib/utils";

const COLORES_FUENTE = PALETA_ACTIVA.categorica.map((tono) => tono.plano);

type AlcanceFuenteWidgetProps = {
  className?: string;
  fuentes?: FuentePotencial[];
};

export function AlcanceFuenteWidget({
  className,
  fuentes: fuentesProp,
}: AlcanceFuenteWidgetProps) {
  const t = useTranslations("dashboard");
  // Noticias/Web y YouTube estructuralmente nunca traen alcance real medido
  // (ningún buscador expone esa cifra para esos canales) — mostrarlos en
  // "0" aquí no es un dato real, es simplemente ausencia de dato. Pedido
  // explícito del cliente (2026-10-02): si no hay alcance real, mejor no
  // mostrar el medio. Se renumera por posición en la lista ya filtrada, no
  // por el campo `posicion` original, para no dejar huecos (1, 2, 3...).
  const fuentes = (fuentesProp ?? obtenerAlcancePorFuenteMock())
    .filter((f) => f.alcance > 0)
    .map((f, índice) => ({ ...f, posicion: índice + 1 }));
  const max = Math.max(...fuentes.map((f) => f.alcance), 1);

  return (
    <section
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border-default/30 bg-bg-base p-2.5 shadow-widget sm:p-3",
        className,
      )}
      aria-label={t("reachBySource")}
    >
      <CardTitleBar bleed="sm">
        {t("reachBySource")}{" "}
        <span className="text-xs font-normal align-middle">
          {t("estimatedSuffix")}
        </span>
      </CardTitleBar>
      <p className="shrink-0 text-[10px] text-text-muted">
        {t("reachBySourceSubtitle")}
      </p>

      <ul className="mt-2 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-0.5">
        {fuentes.map(({ posicion, fuente, alcance }, index) => (
          <li key={fuente} className="shrink-0">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-4 shrink-0 text-right tabular-nums text-text-muted">
                {posicion}
              </span>
              <span className="min-w-0 flex-1 truncate text-text-secondary">
                {fuente}
              </span>
              <span className="w-14 shrink-0 text-right font-semibold tabular-nums text-text-primary">
                {formatearAlcanceCompacto(alcance)}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 pl-6">
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-bg-muted">
                <GraficaBarraAlcanceFuente
                  fuente={fuente}
                  alcance={alcance}
                  max={max}
                  color={COLORES_FUENTE[index % COLORES_FUENTE.length]}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
