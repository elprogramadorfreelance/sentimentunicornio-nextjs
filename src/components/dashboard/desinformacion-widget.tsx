"use client";

import { Frown, Meh, Smile } from "lucide-react";
import { useTranslations } from "next-intl";
import { CardTitleBar } from "@/components/ui";
import { nivelCaraSentimiento } from "@/lib/mock/metricas-vista-proyecto";
import { cn } from "@/lib/utils";

type DesinformacionWidgetProps = {
  className?: string;
  porcentaje?: number;
  actualizacion?: string;
  // Con muy pocas menciones clasificadas (ej. 5 de 47), un % "duro" en rojo o
  // verde aparenta más certeza de la que hay — con una muestra así de chica
  // un par de menciones distintas cambian el resultado por completo. Se
  // muestra en tono neutral en vez de la carita feliz/triste hasta que haya
  // más data real clasificada (el número sigue siendo el real, no se oculta).
  muestraPequeña?: boolean;
  // Cero menciones clasificadas todavía (proyecto recién creado, backfill en
  // curso) — un 50%/58% "neutral" ahí se ve como una medición real cuando no
  // hubo ninguna. Mostrar "N/D" en vez de inventar un punto de partida.
  sinDatos?: boolean;
  variante?: "completa" | "compacta";
};

export function DesinformacionWidget({
  className,
  porcentaje = 58,
  actualizacion,
  muestraPequeña = false,
  sinDatos = false,
  variante = "completa",
}: DesinformacionWidgetProps) {
  const t = useTranslations("dashboard");
  const nivel = muestraPequeña || sinDatos ? "neutral" : nivelCaraSentimiento(porcentaje);
  const Icono = nivel === "feliz" ? Smile : nivel === "neutral" ? Meh : Frown;
  const textoActualizacion =
    actualizacion ?? t("lastUpdatedMinutes", { count: 5 });
  const compacta = variante === "compacta";

  return (
    <section
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border-default/30 bg-bg-base p-2.5 shadow-widget sm:p-3",
        className,
      )}
      aria-label={t("positivePerceptionAria", { n: porcentaje })}
    >
      <CardTitleBar bleed="sm">{t("positivePerception")}</CardTitleBar>

      {compacta ? (
        <p className="mt-auto text-xl font-bold tracking-tight text-text-primary tabular-nums lg:text-2xl">
          {sinDatos ? t("noMentionsYet") : `${porcentaje}%`}
        </p>
      ) : (
        <>
          <div className="flex min-h-0 flex-1 items-center justify-center gap-3">
            <span
              className={cn(
                "flex size-14 shrink-0 items-center justify-center rounded-full",
                nivel === "feliz" && "bg-success/10 text-success",
                nivel === "neutral" && "bg-warning/20 text-text-primary",
                nivel === "triste" && "bg-error/10 text-error",
              )}
            >
              <Icono className="size-8 stroke-[1.75]" aria-hidden />
            </span>
            <div>
              <p className="text-3xl font-bold tracking-tight text-text-primary tabular-nums">
                {sinDatos ? t("noMentionsYet") : `${porcentaje}%`}
              </p>
              <p className="text-xs text-text-muted">
                {t("favorablePerceptionSuffix")}
              </p>
            </div>
          </div>

          <p className="mt-1.5 shrink-0 text-right text-[10px] text-text-muted italic">
            *{textoActualizacion}
          </p>
        </>
      )}
    </section>
  );
}
