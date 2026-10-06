"use client";

import { useTranslations } from "next-intl";
import { GraficaNssPorTema } from "@/components/charts/grafica-nss-por-tema";
import { CardTitleBar } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { NssPorTema } from "@/types";

type NssPorTemaWidgetProps = {
  className?: string;
  temas: NssPorTema[];
};

export function NssPorTemaWidget({ className, temas }: NssPorTemaWidgetProps) {
  const t = useTranslations("dashboard");
  const tInfografia = useTranslations("infografia");

  return (
    <section
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-col rounded-lg border border-border-default/30 bg-bg-base p-2.5 shadow-widget sm:p-3",
        className,
      )}
      aria-label={t("nssByTopic")}
    >
      <CardTitleBar bleed="sm">{t("nssByTopic")}</CardTitleBar>

      {/* Sin overflow-hidden: cortaba el tooltip de Nivo (sin portal) en las
          filas de arriba. */}
      <div className="mt-2 min-h-0 min-w-0 flex-1">
        {temas.length > 0 ? (
          <GraficaNssPorTema temas={temas} className="h-full" />
        ) : (
          <p className="flex h-full items-center justify-center text-xs text-text-muted">
            {tInfografia("notEnoughSourceData")}
          </p>
        )}
      </div>
    </section>
  );
}
