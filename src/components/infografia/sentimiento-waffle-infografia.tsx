"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const CELDAS_TOTALES = 40;

type SentimientoWaffleInfografiaProps = {
  className?: string;
  positivo: number;
  negativo: number;
  neutro: number;
  clasificadas: number;
};

export function SentimientoWaffleInfografia({
  className,
  positivo,
  negativo,
  neutro,
  clasificadas,
}: SentimientoWaffleInfografiaProps) {
  const t = useTranslations("common");
  const tInfografia = useTranslations("infografia");

  const celdasPositivas = Math.round((positivo / 100) * CELDAS_TOTALES);
  const celdasNegativas = Math.round((negativo / 100) * CELDAS_TOTALES);
  const celdasNeutras = Math.max(0, CELDAS_TOTALES - celdasPositivas - celdasNegativas);

  const celdas = [
    ...Array.from({ length: celdasPositivas }, (_, i) => ({ id: `positivo-${i}`, color: "bg-[#34d399]" })),
    ...Array.from({ length: celdasNeutras }, (_, i) => ({ id: `neutro-${i}`, color: "bg-[#fbbf24]" })),
    ...Array.from({ length: celdasNegativas }, (_, i) => ({ id: `negativo-${i}`, color: "bg-[#fb7185]" })),
  ];

  return (
    <section
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border-default/30 bg-bg-base p-2.5 shadow-widget sm:p-3",
        className,
      )}
      aria-label={t("sentiment")}
    >
      <h2 className="shrink-0 text-lg font-semibold text-text-muted">{t("sentiment")}</h2>

      {clasificadas > 0 ? (
        <>
          <div className="mt-3 flex min-h-0 flex-1 items-center justify-center">
            <div className="flex flex-wrap content-center justify-center gap-1.5" style={{ maxWidth: "12rem" }}>
              {celdas.map((celda) => (
                <span key={celda.id} className={cn("size-3 shrink-0 rounded-full sm:size-4.5", celda.color)} aria-hidden />
              ))}
            </div>
          </div>
          <div className="mt-3 flex shrink-0 items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-[#059669]">
              <span className="size-2 rounded-full bg-[#34d399]" aria-hidden />
              {positivo}% {t("positive")}
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-[#d97706]">
              <span className="size-2 rounded-full bg-[#fbbf24]" aria-hidden />
              {neutro}% {t("neutralShort")}
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-[#e11d48]">
              <span className="size-2 rounded-full bg-[#fb7185]" aria-hidden />
              {negativo}% {t("negative")}
            </span>
          </div>
        </>
      ) : (
        <p className="flex flex-1 items-center justify-center text-xs text-text-muted">
          {tInfografia("noClassifiedSentiment")}
        </p>
      )}
    </section>
  );
}
