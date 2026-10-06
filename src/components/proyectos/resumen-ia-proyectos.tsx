"use client";

import { SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { GraficaBarraSentimiento } from "@/components/charts/grafica-barra-sentimiento";
import { GraficaBarrasMenciones } from "@/components/charts/grafica-barras-menciones";
import { AvisoMotoresIa, Button, TextoConNegritas } from "@/components/ui";
import type { AlertaPanel } from "@/lib/mock/metricas-panel";
import {
  calcularPanoramaProyectos,
  chipsResumenIa,
  construirResumenIaEstructurado,
} from "@/lib/mock/resumen-ia-proyectos";
import { cn } from "@/lib/utils";
import type { MetricasProyectoPanel, Proyecto, ResumenProyectos } from "@/types";
import { GraficaAnalisisProyectos } from "./grafica-analisis-proyectos";
import { ModalResumenIaProyectos } from "./modal-resumen-ia-proyectos";

type ResumenIaPanelLlm = { titular: string; parrafo: string; bullets: string[] };

type ResumenIaProyectosProps = {
  proyectos: Proyecto[];
  resumen: ResumenProyectos;
  metricasPorProyecto?: Record<string, MetricasProyectoPanel>;
  /** Reales, ya filtradas con evidencia real (ver filtrarAlertasConEvidenciaReal
   * en db.js) — se usan para explicar POR QUÉ el tono es como es, citando
   * las narrativas reales detrás, no solo el conteo. */
  alertas?: AlertaPanel[];
  detallado?: boolean;
  className?: string;
};

export function ResumenIaProyectos({
  proyectos,
  resumen,
  metricasPorProyecto = {},
  alertas = [],
  detallado = false,
  className,
}: ResumenIaProyectosProps) {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const [modalAbierto, setModalAbierto] = useState(false);

  const panorama = useMemo(
    () => calcularPanoramaProyectos(proyectos, metricasPorProyecto),
    [proyectos, metricasPorProyecto],
  );
  const resumenIa = useMemo(
    () => construirResumenIaEstructurado(proyectos, resumen, panorama, alertas),
    [proyectos, resumen, panorama, alertas],
  );

  // Lectura redactada por IA a partir de las métricas reales (ver
  // resumen-ia-panel.js). Mientras llega, o si falla, se muestra el texto base.
  const [lecturaIa, setLecturaIa] = useState<ResumenIaPanelLlm | null>(null);
  const payloadIa = useMemo(() => {
    const activos = proyectos.filter((p) => p.estado === "activo");
    const metricas = activos
      .map((p) => {
        const m = metricasPorProyecto[p.id];
        if (!m) return null;
        return {
          nombre: p.nombre,
          menciones: m.menciones,
          mencionesUltimos7Dias: [...m.mencionesSemana],
          positivo: m.positivo,
          neutro: m.neutro,
          negativo: m.negativo,
          clasificadas: m.clasificadas,
          alcanceEstimado: m.alcance,
          alertasAbiertas: m.alertas,
          alertaCrisis: m.alertaCrisis,
          temasPrincipales: m.temasPrincipales,
          fuentesPrincipales: m.fuentesPrincipales,
        };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);
    if (metricas.length === 0) return null;
    return {
      proyectosActivos: activos.length,
      proyectosInactivos: proyectos.length - activos.length,
      metricas,
      alertas: alertas.slice(0, 8).map((a) => a.mensaje),
    };
  }, [proyectos, metricasPorProyecto, alertas]);
  const claveIa = payloadIa ? JSON.stringify(payloadIa) : null;

  useEffect(() => {
    if (!payloadIa) {
      setLecturaIa(null);
      return;
    }
    let cancelado = false;
    fetch("/api/proyectos/resumen-ia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadIa),
    })
      .then((r) => (r.ok ? (r.json() as Promise<ResumenIaPanelLlm>) : null))
      .then((datos) => {
        if (!cancelado) setLecturaIa(datos);
      })
      .catch(() => {
        if (!cancelado) setLecturaIa(null);
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveIa]);

  const titularMostrado = lecturaIa?.titular ?? resumenIa.titular;
  const parrafoMostrado = lecturaIa?.parrafo ?? resumenIa.párrafo;
  const bulletsMostrados = lecturaIa?.bullets.length ? lecturaIa.bullets : resumenIa.bullets;
  const chips = useMemo(() => {
    const originales = chipsResumenIa(proyectos);
    const claves = ["chipActive", "chipAnalysis", "chipNetworks"] as const;
    return originales.map((chip, indice) => ({
      ...chip,
      etiqueta: t(claves[indice] ?? "chipActive"),
    }));
  }, [proyectos, t]);

  const segmentosSentimiento = [
    {
      id: "positivo",
      etiqueta: tCommon("positive"),
      porcentaje: panorama.sentimiento.positivo,
      color: "bg-success",
    },
    {
      id: "neutro",
      etiqueta: tCommon("neutralShort"),
      porcentaje: panorama.sentimiento.neutro,
      color: "bg-border-strong",
    },
    {
      id: "negativo",
      etiqueta: tCommon("negative"),
      porcentaje: panorama.sentimiento.negativo,
      color: "bg-error",
    },
  ] as const;

  return (
    <>
      <div
        className={cn(
          "relative flex h-full min-h-[7.5rem] flex-col overflow-hidden rounded-xl border border-border-default bg-bg-base",
          detallado ? "p-4 lg:p-5" : "p-3",
          className,
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(130%_90%_at_0%_0%,color-mix(in_srgb,var(--color-accent)_12%,transparent),transparent_58%),linear-gradient(160deg,color-mix(in_srgb,var(--color-accent)_5%,var(--color-bg-base)),var(--color-bg-base)_70%)]"
        />

        <div
          className={cn(
            "relative flex min-h-0 flex-1 flex-col",
            detallado ? "gap-3 lg:gap-4" : "gap-2",
          )}
        >
          <div className="flex items-center gap-1.5">
            <SparklesIcon
              className={cn(
                "shrink-0 text-accent",
                detallado ? "size-3.5 lg:size-4" : "size-3.5",
              )}
              aria-hidden
            />
            <span
              className={cn(
                "font-semibold uppercase tracking-widest text-text-muted",
                detallado ? "text-[10px] lg:text-xs" : "text-[10px]",
              )}
            >
              {t("aiSummary")}
            </span>
            <AvisoMotoresIa />
          </div>

          <div className={cn(detallado ? "space-y-1" : "space-y-0.5")}>
            <p
              className={cn(
                "font-semibold text-text-primary",
                detallado ? "text-sm lg:text-base" : "text-xs",
              )}
            >
              {titularMostrado}
            </p>
            <p
              className={cn(
                "text-text-secondary",
                detallado
                  ? "text-xs leading-relaxed lg:text-sm lg:leading-relaxed"
                  : "line-clamp-2 text-[11px] leading-relaxed",
              )}
            >
              <TextoConNegritas texto={parrafoMostrado} />
            </p>
          </div>

          <ul
            className={cn(
              "grid grid-cols-3",
              detallado ? "gap-1.5 lg:gap-2" : "gap-1.5",
            )}
          >
            {chips.map((chip) => (
              <li
                key={chip.etiqueta}
                className={cn(
                  "flex flex-col items-start gap-0.5 rounded-lg bg-bg-muted/80",
                  detallado ? "px-2 py-1.5 lg:px-3 lg:py-2.5" : "px-2 py-1",
                )}
              >
                <span
                  className={cn(
                    "font-bold tabular-nums tracking-tight text-text-primary",
                    detallado ? "text-sm lg:text-xl" : "text-sm",
                  )}
                >
                  {chip.valor}
                </span>
                <span
                  className={cn(
                    "text-text-muted",
                    detallado ? "text-[10px] lg:text-xs" : "text-[9px]",
                  )}
                >
                  {chip.etiqueta}
                </span>
              </li>
            ))}
          </ul>

          {detallado && (
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
              {/* Es un comparativo entre proyectos — con 0 o 1 proyecto no
                  hay nada que comparar, y mostrarla igual deja una tarjeta
                  con una sola barra (o ninguna) que parece rota en vez de
                  simplemente no aplicar todavía. Se oculta hasta que haya
                  2+ proyectos reales que comparar. */}
              {proyectos.length >= 2 && (
                <section className="rounded-xl border border-border-default/50 bg-bg-base/70 p-3">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                        {t("activityByProject")}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {t("activityByProjectHelp")}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-text-primary tabular-nums">
                      {t("reachValue", {
                        value: panorama.alcanceTotal.toLocaleString("es-MX"),
                      })}
                    </span>
                  </div>
                  <GraficaAnalisisProyectos
                    proyectos={proyectos}
                    className="h-40"
                  />
                </section>
              )}

              <div className="grid gap-3">
                <section className="rounded-xl border border-border-default/50 bg-bg-base/70 p-3">
                  <div className="mb-3 flex items-baseline justify-between gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                      {t("aggregateSentiment")}
                    </p>
                    <span className="text-sm font-bold text-success tabular-nums">
                      {t("positivePercent", {
                        n: panorama.sentimiento.positivo,
                      })}
                    </span>
                  </div>
                  <GraficaBarraSentimiento segmentos={segmentosSentimiento} />
                  <p className="mt-2 text-[10px] text-text-muted">
                    {t("sentimentBreakdown", {
                      pos: panorama.sentimiento.positivo,
                      neu: panorama.sentimiento.neutro,
                      neg: panorama.sentimiento.negativo,
                    })}
                  </p>
                </section>

                <section className="rounded-xl border border-border-default/50 bg-bg-base/70 p-3">
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                      {t("mentions7d")}
                    </p>
                    <span className="text-sm font-bold text-text-primary tabular-nums">
                      {panorama.mencionesSemana
                        .reduce((suma, valor) => suma + valor, 0)
                        .toLocaleString("es-MX")}
                    </span>
                  </div>
                  <div className="h-14">
                    <GraficaBarrasMenciones
                      valores={panorama.mencionesSemana}
                    />
                  </div>
                </section>
              </div>

              {bulletsMostrados.length > 0 && (
                <section className="space-y-2 rounded-xl border border-primary/15 bg-primary/5 p-3">
                  <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
                    <SparklesIcon className="size-3" aria-hidden />
                    {t("featuredContext")}
                  </p>
                  <ul className="space-y-1.5 text-xs leading-relaxed text-text-secondary">
                    {bulletsMostrados.map((bullet) => (
                      <li key={bullet}>
                        <TextoConNegritas texto={bullet} />
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}

          <Button
            type="button"
            size="sm"
            variant="secondary"
            className={cn(
              "mt-auto w-full",
              detallado ? "h-7 text-xs lg:h-9 lg:text-sm" : "h-7 text-[11px]",
            )}
            onClick={() => setModalAbierto(true)}
          >
            <SparklesIcon className="size-3.5" />
            {t("aiGenerate")}
          </Button>
        </div>
      </div>

      <ModalResumenIaProyectos
        abierto={modalAbierto}
        onAbiertoChange={setModalAbierto}
        proyectos={proyectos}
        resumen={resumen}
        metricasPorProyecto={metricasPorProyecto}
        alertas={alertas}
        lecturaIa={lecturaIa}
      />
    </>
  );
}
