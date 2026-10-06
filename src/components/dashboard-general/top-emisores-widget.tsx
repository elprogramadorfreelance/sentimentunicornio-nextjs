"use client";

import { useTranslations } from "next-intl";
import { GraficaTopEmisores } from "@/components/charts/grafica-top-emisores";
import { CardTitleBar } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { EmisorVolumen } from "@/types";

type TopEmisoresWidgetProps = {
  className?: string;
  emisores: EmisorVolumen[];
};

export function TopEmisoresWidget({ className, emisores }: TopEmisoresWidgetProps) {
  const t = useTranslations("dashboard");
  const tInfografia = useTranslations("infografia");

  return (
    <section
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-col rounded-lg border border-border-default/30 bg-bg-base p-2.5 shadow-widget sm:p-3",
        className,
      )}
      aria-label={t("topEmitters")}
    >
      <CardTitleBar bleed="sm">{t("topEmitters")}</CardTitleBar>

      {/* Sin overflow-hidden: cortaba el tooltip de Nivo (sin portal) en las
          filas de arriba. */}
      <div className="mt-2 min-h-0 min-w-0 flex-1">
        {emisores.length > 0 ? (
          <GraficaTopEmisores emisores={emisores} className="h-full" />
        ) : (
          <p className="flex h-full items-center justify-center text-xs text-text-muted">
            {tInfografia("notEnoughSourceData")}
          </p>
        )}
      </div>
    </section>
  );
}
