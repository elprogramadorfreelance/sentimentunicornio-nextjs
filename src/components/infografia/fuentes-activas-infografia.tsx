"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { FuenteMenciones } from "@/types";

type FuentesActivasInfografiaProps = {
  className?: string;
  fuentes: FuenteMenciones[];
};

export function FuentesActivasInfografia({ className, fuentes }: FuentesActivasInfografiaProps) {
  const t = useTranslations("infografia");
  const datos = [...fuentes].sort((a, b) => b.total - a.total).slice(0, 6);
  const máximo = Math.max(...datos.map((fuente) => fuente.total), 1);

  return (
    <section
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border-default/30 bg-bg-base p-2.5 shadow-widget sm:p-3",
        className,
      )}
      aria-label={t("activeSources")}
    >
      <h2 className="shrink-0 text-lg font-semibold text-text-muted">{t("activeSources")}</h2>

      {datos.length > 0 ? (
        <div className="mt-4 flex min-h-0 flex-1 items-end justify-around gap-2 px-1">
          {datos.map((fuente) => {
            const altura = Math.max(8, Math.round((fuente.total / máximo) * 100));
            return (
              <div key={fuente.id} className="flex h-full flex-col items-center justify-end gap-2">
                <span className="text-sm font-bold tabular-nums text-text-primary">{fuente.porcentaje}%</span>
                <div className="flex h-full w-7 items-end overflow-hidden rounded-full bg-bg-muted sm:w-9">
                  <div
                    className="w-full rounded-full transition-[height] duration-300"
                    style={{ height: `${altura}%`, background: fuente.color }}
                    aria-hidden
                  />
                </div>
                <span className="max-w-14 truncate text-center text-[10px] font-medium text-text-muted">
                  {fuente.nombre}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="flex flex-1 items-center justify-center text-xs text-text-muted">
          {t("notEnoughSourceData")}
        </p>
      )}
    </section>
  );
}
