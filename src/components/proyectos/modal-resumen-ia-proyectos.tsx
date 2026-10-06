"use client";

import { ChevronDownIcon, DownloadIcon, FileTextIcon, PresentationIcon, SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { GraficaBarraSentimiento } from "@/components/charts/grafica-barra-sentimiento";
import { GraficaBarrasMenciones } from "@/components/charts/grafica-barras-menciones";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  TextoConNegritas,
} from "@/components/ui";
import {
  descargarResumenMarkdown,
  descargarResumenPdf,
  descargarResumenPptx,
} from "@/lib/exportar-resumen-proyectos";
import type { AlertaPanel } from "@/lib/mock/metricas-panel";
import {
  calcularPanoramaProyectos,
  construirResumenIaEstructurado,
  metricasProyectoVacías,
  narrativaIaProyecto,
} from "@/lib/mock/resumen-ia-proyectos";
import { cn } from "@/lib/utils";
import type { MetricasProyectoPanel, Proyecto, ResumenProyectos } from "@/types";
import { GraficaAnalisisProyectos } from "./grafica-analisis-proyectos";

type ModalResumenIaProyectosProps = {
  abierto: boolean;
  onAbiertoChange: (abierto: boolean) => void;
  proyectos: Proyecto[];
  resumen: ResumenProyectos;
  metricasPorProyecto?: Record<string, MetricasProyectoPanel>;
  alertas?: AlertaPanel[];
  lecturaIa?: { titular: string; parrafo: string; bullets: string[] } | null;
};

type FormatoDescarga = "markdown" | "pdf" | "pptx";

export function ModalResumenIaProyectos({
  abierto,
  onAbiertoChange,
  proyectos,
  resumen,
  metricasPorProyecto = {},
  alertas = [],
  lecturaIa = null,
}: ModalResumenIaProyectosProps) {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const [descargando, setDescargando] = useState<FormatoDescarga | null>(null);

  const etiquetaTipo: Record<string, string> = {
    influencer: t("typeInfluencer"),
    agencia: t("typeAgency"),
    politico: t("typePolitician"),
    marca: t("typeBrand"),
    figura_publica: t("typePublicFigure"),
    otro: t("typeOther"),
  };

  const panorama = useMemo(
    () => calcularPanoramaProyectos(proyectos, metricasPorProyecto),
    [proyectos, metricasPorProyecto],
  );
  const resumenIa = useMemo(
    () => construirResumenIaEstructurado(proyectos, resumen, panorama, alertas),
    [proyectos, resumen, panorama, alertas],
  );

  async function descargar(formato: FormatoDescarga) {
    setDescargando(formato);
    try {
      if (formato === "markdown") {
        descargarResumenMarkdown(proyectos, resumen, metricasPorProyecto);
      } else if (formato === "pdf") {
        await descargarResumenPdf(proyectos, resumen, metricasPorProyecto);
      } else {
        await descargarResumenPptx(proyectos, resumen, metricasPorProyecto);
      }
      toast.success(tCommon("exportReady"), {
        description:
          formato === "markdown"
            ? tCommon("summaryMd")
            : formato === "pdf"
              ? tCommon("summaryPdf")
              : tCommon("summaryPptx"),
      });
    } catch (error) {
      toast.error(tCommon("exportFailed"), {
        description:
          error instanceof Error ? error.message : tCommon("tryAgain"),
      });
    } finally {
      setDescargando(null);
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={onAbiertoChange}>
      <DialogContent className="flex max-h-[min(92dvh,880px)] w-[calc(100%-2rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b border-border-default/50 px-6 py-5 pr-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <DialogTitle className="flex items-center gap-2">
                <SparklesIcon className="size-5 shrink-0 text-primary" />
                {t("aiDetailTitle")}
              </DialogTitle>
              <DialogDescription>{t("aiDetailSubtitle")}</DialogDescription>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  className="shrink-0"
                  disabled={!!descargando || proyectos.length === 0}
                >
                  <DownloadIcon className="size-4" />
                  {descargando ? tCommon("generating") : t("downloadSummary")}
                  <ChevronDownIcon className="size-3.5 opacity-80" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onSelect={() => {
                    void descargar("pptx");
                  }}
                >
                  <PresentationIcon />
                  {tCommon("exportPptx")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    void descargar("pdf");
                  }}
                >
                  <FileTextIcon />
                  {tCommon("exportPdf")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    void descargar("markdown");
                  }}
                >
                  <FileTextIcon />
                  {tCommon("exportMd")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <section className="space-y-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              {t("overview")}
            </h3>
            <p className="text-sm font-semibold text-text-primary">
              {lecturaIa?.titular ?? resumenIa.titular}
            </p>
            <p className="text-sm leading-relaxed text-text-secondary">
              <TextoConNegritas texto={lecturaIa?.parrafo ?? resumenIa.párrafo} />
            </p>
            {(lecturaIa?.bullets.length ? lecturaIa.bullets : resumenIa.bullets).length > 0 && (
              <ul className="space-y-1 text-sm leading-relaxed text-text-secondary">
                {(lecturaIa?.bullets.length ? lecturaIa.bullets : resumenIa.bullets).map((bullet) => (
                  <li key={bullet} className="flex gap-1.5">
                    <span aria-hidden>•</span>
                    <span>
                      <TextoConNegritas texto={bullet} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-2 rounded-xl border border-border-default/60 bg-bg-muted/30 p-4">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              {t("analysisByProject")}
            </h3>
            <GraficaAnalisisProyectos proyectos={proyectos} />
          </section>

          <section className="space-y-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              {t("detailByProject")}
            </h3>

            {proyectos.length === 0 ? (
              <p className="text-sm text-text-muted">
                {t("noProjectsToDetail")}
              </p>
            ) : (
              <ul className="space-y-3">
                {proyectos.map((proyecto) => {
                  const metricas =
                    metricasPorProyecto[proyecto.id] ?? metricasProyectoVacías();
                  const narrativa = narrativaIaProyecto(proyecto, metricas);
                  const segmentos = [
                    {
                      id: "pos",
                      etiqueta: tCommon("positive"),
                      porcentaje: metricas.positivo,
                      color: "bg-success",
                    },
                    {
                      id: "neu",
                      etiqueta: tCommon("neutralShort"),
                      porcentaje: metricas.neutro,
                      color: "bg-bg-muted",
                    },
                    {
                      id: "neg",
                      etiqueta: tCommon("negative"),
                      porcentaje: metricas.negativo,
                      color: "bg-error",
                    },
                  ] as const;

                  return (
                    <li
                      key={proyecto.id}
                      className="rounded-xl border border-border-default/60 bg-bg-base p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-bold text-text-primary">
                              {proyecto.nombre}
                            </h4>
                            <Badge
                              variante={
                                proyecto.estado === "activo"
                                  ? "positivo"
                                  : "warning"
                              }
                              className="rounded-lg"
                            >
                              {proyecto.estado === "activo"
                                ? t("active")
                                : t("inactive")}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-text-muted">
                            {etiquetaTipo[proyecto.tipo]} · {proyecto.ubicacion}{" "}
                            · {t("analysisCount", { count: proyecto.analisis })}
                          </p>
                        </div>
                        <div className="flex gap-3 text-right">
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-text-muted">
                              {tCommon("reach")}
                            </p>
                            <p className="text-sm font-bold tabular-nums text-text-primary">
                              {metricas.alcance.toLocaleString("es-MX")}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-text-muted">
                              {t("alerts")}
                            </p>
                            <p className="text-sm font-bold tabular-nums text-text-primary">
                              {metricas.alertas}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2.5">
                        <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
                          <SparklesIcon className="size-3" aria-hidden />
                          {t("aiReading")}
                        </p>
                        <p className="text-xs leading-relaxed text-text-secondary">
                          {narrativa}
                        </p>
                      </div>

                      <div className="mt-3 grid gap-4 sm:grid-cols-[1.2fr_1fr]">
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-medium text-text-muted">
                            {t("estimatedSentiment")}
                          </p>
                          <GraficaBarraSentimiento segmentos={segmentos} />
                          <p className="text-[10px] text-text-muted">
                            +{metricas.positivo}% · ∼{metricas.neutro}% · −
                            {metricas.negativo}%
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-medium text-text-muted">
                            {t("mentions7d")}
                          </p>
                          <div className="h-14">
                            <GraficaBarrasMenciones
                              valores={metricas.mencionesSemana}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {proyecto.palabrasClave.slice(0, 4).map((kw) => (
                          <span
                            key={kw}
                            className="rounded-md bg-bg-muted px-2 py-0.5 text-[10px] text-text-secondary"
                          >
                            {kw}
                          </span>
                        ))}
                        {proyecto.redesConectadas.map((red) => (
                          <span
                            key={red}
                            className={cn(
                              "rounded-md border border-border-default/50 px-2 py-0.5 text-[10px] text-text-muted",
                            )}
                          >
                            {red}
                          </span>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
