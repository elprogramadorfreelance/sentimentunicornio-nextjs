"use client";

import { SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { GraficaBarraSentimiento } from "@/components/charts/grafica-barra-sentimiento";
import { AvisoMotoresIa, Button, TextoConNegritas } from "@/components/ui";
import {
  construirTextoResumenIaSentimiento,
  narrativaDestacadaSentimiento,
  panoramaSentimientoIa,
  titularResumenIaSentimiento,
} from "@/lib/mock/resumen-ia-sentimiento";
import { cn } from "@/lib/utils";
import type { RespuestaSentimiento } from "@/types";
import { formatearPorcentaje } from "./constantes-tonalidad";
import { ModalResumenIaSentimiento } from "./modal-resumen-ia-sentimiento";

type ResumenIaSentimientoProps = {
  datos: RespuestaSentimiento;
  nombreProyecto: string | null;
  className?: string;
};

/** Mismo diseño que la referencia de Bruno — mismo texto, mismos chips, misma "Lectura de la IA" — con datos 100% reales en vez de los números inventados del mock. */
export function ResumenIaSentimiento({
  datos,
  nombreProyecto,
  className,
}: ResumenIaSentimientoProps) {
  const t = useTranslations("sentimentPage");
  const tCommon = useTranslations("common");
  const tProjects = useTranslations("projects");
  const [modalAbierto, setModalAbierto] = useState(false);

  const texto = useMemo(
    () => construirTextoResumenIaSentimiento(datos, nombreProyecto),
    [datos, nombreProyecto],
  );
  const panorama = useMemo(() => panoramaSentimientoIa(datos), [datos]);
  const titular = useMemo(() => titularResumenIaSentimiento(panorama), [panorama]);
  const destacados = useMemo(
    () => narrativaDestacadaSentimiento(datos),
    [datos],
  );
  const chips = [
    {
      etiqueta: tCommon("positive"),
      valor: formatearPorcentaje(panorama.positivo),
    },
    {
      etiqueta: tCommon("negative"),
      valor: formatearPorcentaje(panorama.negativo),
    },
    {
      etiqueta: tCommon("neutral"),
      valor: formatearPorcentaje(panorama.neutro),
    },
  ];

  const segmentosSentimiento = [
    {
      id: "positivo",
      etiqueta: tCommon("positive"),
      porcentaje: Math.round(panorama.positivo),
      color: "bg-success",
    },
    {
      id: "neutro",
      etiqueta: tCommon("neutral"),
      porcentaje: Math.round(panorama.neutro),
      color: "bg-border-strong",
    },
    {
      id: "negativo",
      etiqueta: tCommon("negative"),
      porcentaje: Math.round(panorama.negativo),
      color: "bg-error",
    },
  ] as const;

  return (
    <>
      <div
        className={cn(
          "relative flex min-h-0 flex-col overflow-hidden rounded-xl border border-border-default bg-bg-base p-4 lg:p-5",
          className,
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(130%_90%_at_0%_0%,color-mix(in_srgb,var(--color-accent)_12%,transparent),transparent_58%),linear-gradient(160deg,color-mix(in_srgb,var(--color-accent)_5%,var(--color-bg-base)),var(--color-bg-base)_70%)]"
        />

        <div className="relative flex min-h-0 flex-1 flex-col gap-3 lg:gap-4">
          <div className="flex items-center gap-1.5">
            <SparklesIcon className="size-3.5 shrink-0 text-accent lg:size-4" aria-hidden />
            <span className="text-[10px] font-semibold tracking-widest text-text-muted uppercase lg:text-xs">
              {t("aiSummary")}
            </span>
            <AvisoMotoresIa />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-text-primary lg:text-base">
              {titular}
            </p>
            <p className="text-xs leading-relaxed text-text-secondary lg:text-sm">
              <TextoConNegritas texto={texto} />
            </p>
          </div>

          <ul className="grid grid-cols-3 gap-1.5 lg:gap-2">
            {chips.map((chip) => (
              <li
                key={chip.etiqueta}
                className="flex flex-col items-start gap-0.5 rounded-lg bg-bg-muted/80 px-2 py-1.5 lg:px-3 lg:py-2.5"
              >
                <span className="text-sm font-bold tracking-tight text-text-primary tabular-nums lg:text-xl">
                  {chip.valor}
                </span>
                <span className="text-[10px] text-text-muted lg:text-xs">{chip.etiqueta}</span>
              </li>
            ))}
          </ul>

          <div className="grid gap-3 lg:grid-cols-2">
            <section className="rounded-xl border border-border-default/50 bg-bg-base/70 p-3">
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <p className="text-[10px] font-semibold tracking-widest text-text-muted uppercase">
                  {t("aggregatedSentiment")}
                </p>
                <span className="text-sm font-bold text-success tabular-nums">
                  {t("percentPositive", { n: Math.round(panorama.positivo) })}
                </span>
              </div>
              <GraficaBarraSentimiento segmentos={segmentosSentimiento} />
              <p className="mt-2 text-[10px] text-text-muted">
                {t("sentimentMix", {
                  pos: Math.round(panorama.positivo),
                  neu: Math.round(panorama.neutro),
                  neg: Math.round(panorama.negativo),
                })}
              </p>
            </section>

            <section className="space-y-2 rounded-xl border border-primary/15 bg-primary/5 p-3">
              <p className="flex items-center gap-1 text-[10px] font-semibold tracking-widest text-primary uppercase">
                <SparklesIcon className="size-3" aria-hidden />
                {t("aiReading")}
              </p>
              <ul className="space-y-1.5 text-xs leading-relaxed text-text-secondary">
                {destacados.slice(0, 3).map((punto) => (
                  <li key={punto}>
                    <TextoConNegritas texto={punto} />
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="mt-auto h-7 w-full text-xs lg:h-9 lg:text-sm"
            onClick={() => setModalAbierto(true)}
          >
            <SparklesIcon className="size-3.5" />
            {tProjects("aiGenerate")}
          </Button>
        </div>
      </div>

      <ModalResumenIaSentimiento
        abierto={modalAbierto}
        onAbiertoChange={setModalAbierto}
        datos={datos}
        nombreProyecto={nombreProyecto}
      />
    </>
  );
}
