"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { GraficaBarraSentimiento } from "@/components/charts/grafica-barra-sentimiento";
import { cn } from "@/lib/utils";
import { InterruptorIa } from "./interruptor-ia";
import { TituloSeccionLanding } from "./titulo-seccion-landing";

const EASE = [0.23, 1, 0.32, 1] as const;
const DURACION_FADE = 0.18;
const RETRASO_PILAR_MS = 60;

const SENTIMIENTO = {
  positivo: 51,
  neutro: 36,
  negativo: 13,
} as const;

const TENDENCIA = [
  { id: "d1", valor: 42 },
  { id: "d2", valor: 55 },
  { id: "d3", valor: 48 },
  { id: "d4", valor: 61 },
  { id: "d5", valor: 58 },
  { id: "d6", valor: 72 },
  { id: "d7", valor: 80 },
] as const;

const FILAS_RUIDO = [
  { fuente: "X / Twitter", vol: "4 208", nss: "−0.21", lag: "2m" },
  { fuente: "El Financiero", vol: "1 104", nss: "0.08", lag: "14m" },
  { fuente: "Reforma RSS", vol: "986", nss: "−0.03", lag: "7m" },
  { fuente: "Facebook", vol: "2 640", nss: "0.14", lag: "9m" },
  { fuente: "Foros / blogs", vol: "1 476", nss: "−0.18", lag: "41m" },
  { fuente: "TikTok", vol: "1 000", nss: "0.02", lag: "6m" },
] as const;

const BARRAS_RUIDO = [92, 38, 71, 54, 88, 22, 65, 47] as const;

function DocumentoRuido() {
  const t = useTranslations("landing");

  return (
    <div className="flex h-full flex-col gap-2.5 p-5 sm:p-6" aria-hidden>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-500">
            {t("simplifyDocNoisyTitle")}
          </p>
          <p className="mt-0.5 truncate text-[10px] text-zinc-400 dark:text-zinc-600">
            {t("simplifyDocNoisyMeta")}
          </p>
        </div>
        <span className="shrink-0 rounded border border-zinc-300 px-1.5 py-0.5 font-mono text-[9px] text-zinc-400 dark:border-zinc-700 dark:text-zinc-600">
          RAW
        </span>
      </div>

      <p className="text-[10px] leading-relaxed text-zinc-500 opacity-80 dark:text-zinc-500">
        {t("simplifyDocNoisyP1")}
      </p>
      <p className="text-[10px] leading-relaxed text-zinc-500 opacity-70 dark:text-zinc-500">
        {t("simplifyDocNoisyP2")}
      </p>

      <div className="grid grid-cols-8 gap-1">
        {BARRAS_RUIDO.map((ancho) => (
          <div
            key={ancho}
            className="h-8 overflow-hidden rounded-sm bg-zinc-200 dark:bg-zinc-800"
          >
            <div
              className="h-full bg-zinc-400/70 dark:bg-zinc-600/60"
              style={{ width: `${ancho}%` }}
            />
          </div>
        ))}
      </div>

      <table className="w-full border-collapse text-[10px] text-zinc-500 dark:text-zinc-500">
        <thead>
          <tr className="border-b border-zinc-300 text-left dark:border-zinc-700">
            <th className="py-1 font-medium">
              {t("simplifyDocNoisyColFuente")}
            </th>
            <th className="py-1 font-medium">{t("simplifyDocNoisyColVol")}</th>
            <th className="py-1 font-medium">{t("simplifyDocNoisyColNss")}</th>
            <th className="py-1 font-medium">{t("simplifyDocNoisyColLag")}</th>
          </tr>
        </thead>
        <tbody>
          {FILAS_RUIDO.map((fila) => (
            <tr
              key={fila.fuente}
              className="border-b border-zinc-200/80 dark:border-zinc-800"
            >
              <td className="py-1 pr-2">{fila.fuente}</td>
              <td className="py-1 font-mono tabular-nums">{fila.vol}</td>
              <td className="py-1 font-mono tabular-nums">{fila.nss}</td>
              <td className="py-1 font-mono tabular-nums">{fila.lag}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-auto text-[9px] tracking-wide text-zinc-400 uppercase dark:text-zinc-600">
        {t("simplifyDocNoisyFoot")}
      </p>
    </div>
  );
}

function DocumentoLimpio() {
  const t = useTranslations("landing");
  const tCommon = useTranslations("common");
  const { positivo, neutro, negativo } = SENTIMIENTO;
  const maxTendencia = Math.max(...TENDENCIA.map((punto) => punto.valor));

  const segmentos = [
    {
      id: "positivo",
      etiqueta: tCommon("positive"),
      porcentaje: positivo,
      color: "bg-success",
    },
    {
      id: "neutro",
      etiqueta: tCommon("neutralShort"),
      porcentaje: neutro,
      color: "bg-border-strong",
    },
    {
      id: "negativo",
      etiqueta: tCommon("negative"),
      porcentaje: negativo,
      color: "bg-error",
    },
  ];

  const kpis = [
    {
      label: t("simplifyKpiMentionsLabel"),
      value: t("simplifyKpiMentionsValue"),
      hint: t("simplifyKpiMentionsHint"),
    },
    {
      label: t("simplifyKpiSentimentLabel"),
      value: t("simplifyKpiSentimentValue"),
      hint: t("simplifyKpiSentimentHint"),
    },
    {
      label: t("simplifyKpiAlertLabel"),
      value: t("simplifyKpiAlertValue"),
      hint: t("simplifyKpiAlertHint"),
    },
  ];

  return (
    <div className="flex h-full flex-col gap-4 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-text-primary">
            {t("simplifyDocCleanTitle")}
          </h3>
          <p className="mt-0.5 text-xs text-text-secondary">
            {t("simplifyDocCleanPeriod")}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-lg border border-border-default/60 bg-bg-muted/50 px-2.5 py-2"
          >
            <dt className="text-[10px] font-medium tracking-wide text-text-muted uppercase">
              {kpi.label}
            </dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums text-text-primary">
              {kpi.value}
            </dd>
            <p className="text-[10px] leading-tight text-text-secondary">
              {kpi.hint}
            </p>
          </div>
        ))}
      </dl>

      <div>
        <p className="mb-2 text-[10px] font-semibold tracking-wide text-text-secondary uppercase">
          {t("simplifyChartSentiment")}
        </p>
        <GraficaBarraSentimiento segmentos={segmentos} />
        <p className="mt-1.5 text-[10px] text-text-muted">
          {t("serviceSentimientoPie", {
            pos: positivo,
            neu: neutro,
            neg: negativo,
          })}
        </p>
      </div>

      <div className="mt-auto">
        <p className="mb-2 text-[10px] font-semibold tracking-wide text-text-secondary uppercase">
          {t("simplifyChartTrend")}
        </p>
        <div className="flex h-16 items-end gap-1.5" aria-hidden>
          {TENDENCIA.map((punto) => (
            <div
              key={punto.id}
              className="flex-1 rounded-sm bg-linear-to-t from-indigo-500/80 to-sky-400/80"
              style={{ height: `${(punto.valor / maxTendencia) * 100}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function IaSimplificaLanding() {
  const t = useTranslations("landing");
  const reducirMovimiento = useReducedMotion();
  const [simplificado, setSimplificado] = useState(false);

  const pilares = [
    {
      id: "evolucion",
      titulo: t("simplifyPillarEvolutionTitle"),
      cuerpo: t("simplifyPillarEvolutionBody"),
    },
    {
      id: "contexto",
      titulo: t("simplifyPillarContextTitle"),
      cuerpo: t("simplifyPillarContextBody"),
    },
    {
      id: "priorizacion",
      titulo: t("simplifyPillarPriorityTitle"),
      cuerpo: t("simplifyPillarPriorityBody"),
    },
    {
      id: "claridad",
      titulo: t("simplifyPillarClarityTitle"),
      cuerpo: t("simplifyPillarClarityBody"),
    },
  ];

  return (
    <section
      id="ia-simplifica"
      className="relative scroll-mt-20 overflow-hidden py-24 sm:py-28"
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-zinc-200/70 transition-opacity duration-500 dark:bg-zinc-950",
          simplificado ? "opacity-0" : "opacity-100",
        )}
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-linear-to-br from-indigo-500/12 via-transparent to-sky-400/14 transition-opacity duration-500 dark:from-indigo-500/16 dark:to-sky-400/20",
          simplificado ? "opacity-100" : "opacity-0",
        )}
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-none absolute -top-24 -left-16 size-72 rounded-full bg-indigo-500/15 blur-3xl transition-opacity duration-500 dark:bg-indigo-400/20",
          simplificado ? "opacity-100" : "opacity-0",
        )}
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-none absolute -right-10 -bottom-20 size-80 rounded-full bg-sky-400/14 blur-3xl transition-opacity duration-500 dark:bg-sky-400/18",
          simplificado ? "opacity-100" : "opacity-0",
        )}
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <TituloSeccionLanding
            text={t("simplifyProblemTitle")}
            className="font-display text-3xl font-black tracking-tight text-balance sm:text-4xl"
          />
          <p className="mt-5 max-w-[65ch] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            {t("simplifyProblemBody")}
          </p>
        </div>

        <div className="mt-14 grid items-center gap-12 sm:mt-16 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <div>
            <h3
              className={cn(
                "font-display text-2xl leading-snug font-black tracking-tight text-balance sm:text-3xl",
                "transition-colors duration-400",
                simplificado
                  ? "text-text-primary"
                  : "text-zinc-500 dark:text-zinc-500",
              )}
            >
              {t("simplifyTitle")}
            </h3>
            <p
              className={cn(
                "mt-4 text-lg leading-relaxed",
                "transition-colors duration-400",
                simplificado
                  ? "text-text-secondary"
                  : "text-zinc-400 dark:text-zinc-600",
              )}
            >
              {t("simplifySubtitle")}
            </p>

            <div className="mt-8 py-5">
              <InterruptorIa
                checked={simplificado}
                onCheckedChange={setSimplificado}
                label={t("simplifySwitchAria")}
              />
            </div>
          </div>

          <div
            className={cn(
              "relative overflow-hidden rounded-xl border bg-bg-base",
              "transition-[filter,box-shadow,border-color] duration-500",
              simplificado
                ? "border-indigo-200/60 shadow-[0_1rem_2.5rem_-2rem_#4f46e5] grayscale-0 dark:border-sky/30 dark:shadow-[0_1rem_2.5rem_-2rem_#38bdf8]"
                : "border-zinc-300 grayscale-[0.4] saturate-50 dark:border-zinc-700",
            )}
          >
            <div className="invisible pointer-events-none" aria-hidden>
              <DocumentoLimpio />
            </div>

            <div className="absolute inset-0 overflow-hidden">
              {reducirMovimiento ? (
                simplificado ? (
                  <DocumentoLimpio />
                ) : (
                  <DocumentoRuido />
                )
              ) : (
                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    key={simplificado ? "limpio" : "ruido"}
                    className="h-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: DURACION_FADE, ease: EASE }}
                  >
                    {simplificado ? <DocumentoLimpio /> : <DocumentoRuido />}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>

        <dl className="mt-16 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {pilares.map((pilar, indice) => {
            const retraso = reducirMovimiento
              ? undefined
              : { transitionDelay: `${indice * RETRASO_PILAR_MS}ms` };
            const transicion = reducirMovimiento
              ? "transition-none"
              : "transition-[color,opacity] duration-400 ease-out";

            return (
              <div key={pilar.id} className="relative pt-6">
                <span
                  className="absolute inset-x-0 top-0 h-px bg-zinc-300 dark:bg-zinc-700"
                  aria-hidden
                />
                <span
                  className={cn(
                    "absolute inset-x-0 top-0 h-px bg-linear-to-r from-indigo-500 to-sky-400",
                    transicion,
                    simplificado ? "opacity-100" : "opacity-0",
                  )}
                  style={retraso}
                  aria-hidden
                />
                <dt
                  className={cn(
                    "font-display text-xl font-bold",
                    transicion,
                    simplificado
                      ? "text-text-primary"
                      : "text-zinc-500 dark:text-zinc-500",
                  )}
                  style={retraso}
                >
                  {pilar.titulo}
                </dt>
                <dd
                  className={cn(
                    "mt-2 leading-relaxed",
                    transicion,
                    simplificado
                      ? "text-text-secondary"
                      : "text-zinc-600 dark:text-zinc-400",
                  )}
                  style={retraso}
                >
                  {pilar.cuerpo}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
