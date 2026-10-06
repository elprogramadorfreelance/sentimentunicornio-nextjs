"use client";

import { SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AvisoMotoresIa, Button, TextoConNegritas } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { RespuestaBenchmarking } from "@/types";
import { ModalResumenIaBenchmarking } from "./modal-resumen-ia-benchmarking";

type ResumenIaBenchmarkingProps = {
  datos: RespuestaBenchmarking;
  className?: string;
};

/** Mismo diseño que la referencia de Bruno, con datos 100% reales calculados de las menciones reales de cada proyecto. */
export function ResumenIaBenchmarking({ datos, className }: ResumenIaBenchmarkingProps) {
  const t = useTranslations("benchmarking");
  const tProjects = useTranslations("projects");
  const [modalAbierto, setModalAbierto] = useState(false);

  const texto = t("summaryIntro", {
    mentionsLeader: datos.resumen.liderMenciones,
    reachLeader: datos.resumen.liderAlcance,
    sentimentLeader: datos.resumen.liderSentimiento,
  });

  const chips = [
    { etiqueta: t("chipMentionsLeader"), valor: datos.resumen.liderMenciones },
    { etiqueta: t("chipReachLeader"), valor: datos.resumen.liderAlcance },
    { etiqueta: t("chipSentimentLeader"), valor: datos.resumen.liderSentimiento },
  ];

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
              <TextoConNegritas texto={datos.resumen.titular} />
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
                <span className="truncate text-sm font-bold tracking-tight text-text-primary lg:text-lg">
                  {chip.valor}
                </span>
                <span className="text-[10px] text-text-muted lg:text-xs">{chip.etiqueta}</span>
              </li>
            ))}
          </ul>

          <section className="space-y-2 rounded-xl border border-primary/15 bg-primary/5 p-3">
            <p className="flex items-center gap-1 text-[10px] font-semibold tracking-widest text-primary uppercase">
              <SparklesIcon className="size-3" aria-hidden />
              {t("readingTitle")}
            </p>
            <ul className="space-y-1.5 text-xs leading-relaxed text-text-secondary">
              {datos.resumen.lectura.map((punto) => (
                <li key={punto}>
                  <TextoConNegritas texto={punto} />
                </li>
              ))}
            </ul>
          </section>

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

      <ModalResumenIaBenchmarking abierto={modalAbierto} onAbiertoChange={setModalAbierto} datos={datos} />
    </>
  );
}
