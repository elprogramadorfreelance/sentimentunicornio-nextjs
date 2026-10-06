"use client";

import { useTranslations } from "next-intl";
import { GraficaTonalidadFuente } from "@/components/charts/grafica-tonalidad-fuente";
import {
  obtenerTonalidadPorFuenteMock,
  type TonalidadFuente,
} from "@/lib/mock/dashboard-general";
import { CardTitleBar } from "@/components/ui";
import { cn } from "@/lib/utils";

type TonalidadFuenteWidgetProps = {
  className?: string;
  fuentes?: TonalidadFuente[];
};

export function TonalidadFuenteWidget({
  className,
  fuentes: fuentesProp,
}: TonalidadFuenteWidgetProps) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const fuentes = fuentesProp ?? obtenerTonalidadPorFuenteMock();

  const segmentos = [
    { clave: "neutro", etiqueta: tCommon("neutral"), color: "bg-[#fbbf24]" },
    { clave: "positivo", etiqueta: tCommon("positive"), color: "bg-[#34d399]" },
    { clave: "negativo", etiqueta: tCommon("negative"), color: "bg-[#fb7185]" },
  ] as const;

  return (
    <section
      className={cn(
        "flex h-full min-h-0 flex-col rounded-lg border border-border-default/30 bg-bg-base p-2.5 shadow-widget sm:p-3",
        className,
      )}
      aria-label={t("toneBySource")}
    >
      <CardTitleBar bleed="sm">{t("toneBySource")}</CardTitleBar>

      <ul className="mt-1.5 flex shrink-0 flex-wrap gap-x-2.5 gap-y-0.5">
        {segmentos.map((s) => (
          <li
            key={s.clave}
            className="flex items-center gap-1 text-[10px] text-text-secondary"
          >
            <span
              className={cn("size-1.5 shrink-0 rounded-full", s.color)}
              aria-hidden
            />
            {s.etiqueta}
          </li>
        ))}
      </ul>

      <div className="mt-1.5 min-h-0 flex-1">
        <GraficaTonalidadFuente fuentes={fuentes} className="h-full" />
      </div>
    </section>
  );
}
