"use client";

import { useTranslations } from "next-intl";
import { GraficaTopEmisores } from "@/components/charts/grafica-top-emisores";
import { cn } from "@/lib/utils";
import type { EmisorVolumen } from "@/types";

type TopEmisoresInfografiaProps = {
  className?: string;
  emisores: EmisorVolumen[];
};

export function TopEmisoresInfografia({ className, emisores }: TopEmisoresInfografiaProps) {
  const t = useTranslations("infografia");
  return (
    <section
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border-default/30 bg-bg-base p-2.5 shadow-widget sm:p-3",
        className,
      )}
      aria-label={t("topEmittersOfPeriod")}
    >
      <h2 className="shrink-0 text-lg font-semibold text-text-muted">{t("topEmittersOfPeriod")}</h2>

      <div className="mt-2 min-h-0 min-w-0 flex-1 overflow-hidden">
        {emisores.length > 0 ? (
          <GraficaTopEmisores emisores={emisores} className="h-full" />
        ) : (
          <p className="flex h-full items-center justify-center text-xs text-text-muted">
            {t("notEnoughSourceData")}
          </p>
        )}
      </div>
    </section>
  );
}
