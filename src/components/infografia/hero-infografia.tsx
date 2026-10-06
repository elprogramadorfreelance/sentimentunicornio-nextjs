"use client";

import { useLocale, useTranslations } from "next-intl";
import { localeBcp47 } from "@/i18n/config";
import { cn } from "@/lib/utils";

type HeroInfografiaProps = {
  className?: string;
  nombreProyecto: string;
  mencionesTotales: number;
  cambioMenciones: number | null; // null = "N/D", sin período anterior real que comparar
  alcanceTotal: number;
  diasPeriodo: number;
};

export function HeroInfografia({
  className,
  nombreProyecto,
  mencionesTotales,
  cambioMenciones,
  alcanceTotal,
  diasPeriodo,
}: HeroInfografiaProps) {
  const t = useTranslations("infografia");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const bcp47 = localeBcp47(locale);
  const positivo = cambioMenciones !== null && cambioMenciones >= 0;

  return (
    <section
      className={cn(
        "flex flex-col justify-center gap-1 overflow-hidden rounded-lg bg-gradient-to-r from-navy to-brand-blue px-5 py-6 text-white shadow-widget sm:px-8",
        className,
      )}
    >
      <p className="text-xs font-medium tracking-wide text-white/70 uppercase">{tCommon("panorama")}</p>
      <h1 className="text-xl font-bold tracking-tight text-balance sm:text-2xl lg:text-3xl">
        {t("heroHeadlineOurs", {
          project: nombreProyecto,
          mentions: mencionesTotales.toLocaleString(bcp47),
        })}
        {mencionesTotales > 0 && cambioMenciones !== null && (
          <>
            {" "}
            (
            {t("heroChangeOurs", {
              sign: positivo ? "+" : "",
              percent: cambioMenciones.toLocaleString(bcp47, { maximumFractionDigits: 1 }),
            })}
            )
          </>
        )}
      </h1>
      <p className="text-xs text-white/70 sm:text-sm">
        {t("heroSubtitleOurs", {
          days: diasPeriodo,
          reach: alcanceTotal.toLocaleString(bcp47),
        })}
      </p>
    </section>
  );
}
