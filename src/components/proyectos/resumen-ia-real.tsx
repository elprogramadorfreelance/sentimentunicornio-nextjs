"use client";

import { ChevronDownIcon, DownloadIcon, FileTextIcon, PresentationIcon, SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { GraficaBarraSentimiento } from "@/components/charts/grafica-barra-sentimiento";
import {
  AvisoMotoresIa,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  TextoConNegritas,
} from "@/components/ui";
import {
  descargarResumenAnalisisMarkdown,
  descargarResumenAnalisisPdf,
  descargarResumenAnalisisPptx,
  tonalidadNarrativas,
} from "@/lib/exportar-resumen-analisis";
import { cn } from "@/lib/utils";
import type { AnálisisReal, DistribuciónFuenteReal } from "@/types";

type FormatoDescarga = "markdown" | "pdf" | "pptx";

/**
 * Destacados por fuente — una oración real por canal combinando volumen
 * (% real de menciones) y tono (sentimiento dominante real), mismo espíritu
 * que pidió el cliente para el resumen de redes (viñeta = volumen + tono en
 * una sola oración fluida), pero calculado aquí en vez de pedírselo a la IA
 * — son datos que YA tenemos exactos (sources_distribution), no hace falta
 * que el modelo los adivine ni los redacte con riesgo de inventar cifras.
 */
function destacadosPorFuente(distribución: DistribuciónFuenteReal[]): string[] {
  return [...distribución]
    .sort((a, b) => b.porcentaje - a.porcentaje)
    .slice(0, 4)
    .map((f) => {
      const tono =
        f.sentimientoDominante === "positivo"
          ? "con tono mayormente positivo"
          : f.sentimientoDominante === "negativo"
            ? "con tono mayormente negativo"
            : "con tono mayormente neutral";
      return `**${f.fuente}** concentra **${f.porcentaje}%** de las menciones, ${tono}.`;
    });
}

const VARIANTE_RIESGO: Record<string, "error" | "warning" | "positivo" | "default"> = {
  Crítico: "error",
  Alto: "error",
  Medio: "warning",
  Bajo: "positivo",
};

const VARIANTE_SENTIMIENTO: Record<string, "positivo" | "negativo" | "neutral"> = {
  positivo: "positivo",
  negativo: "negativo",
  neutral: "neutral",
};

type ResumenIaRealProps = {
  análisis: AnálisisReal | null;
  className?: string;
};

/**
 * El texto real que escribió la IA en la última corrida de "Analizar ahora"
 * — resumen ejecutivo, recomendaciones y narrativas, tal cual salió de
 * `gpt-4o` (ver analyses.response_json). Antes esta información existía en
 * la base de datos pero no se mostraba en ningún lado del detalle de
 * proyecto — ver README.md, entrada 2026-08-19.
 */
export function ResumenIaReal({ análisis, className }: ResumenIaRealProps) {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [descargando, setDescargando] = useState<FormatoDescarga | null>(null);

  const tono = useMemo(
    () => (análisis ? tonalidadNarrativas(análisis) : null),
    [análisis],
  );
  const destacadosFuente = useMemo(
    () => (análisis ? destacadosPorFuente(análisis.distribuciónFuentes) : []),
    [análisis],
  );

  async function descargar(formato: FormatoDescarga) {
    if (!análisis) return;
    setDescargando(formato);
    try {
      if (formato === "markdown") {
        descargarResumenAnalisisMarkdown(análisis);
      } else if (formato === "pdf") {
        await descargarResumenAnalisisPdf(análisis);
      } else {
        await descargarResumenAnalisisPptx(análisis);
      }
      toast.success(tCommon("exportReady"), {
        description:
          formato === "markdown" ? tCommon("summaryMd") : formato === "pdf" ? tCommon("summaryPdf") : tCommon("summaryPptx"),
      });
    } catch (error) {
      toast.error(tCommon("exportFailed"), {
        description: error instanceof Error ? error.message : tCommon("tryAgain"),
      });
    } finally {
      setDescargando(null);
    }
  }

  if (!análisis) {
    return (
      <section
        className={cn(
          "flex h-full min-h-0 flex-col gap-2 rounded-lg border border-border-default/30 bg-bg-base p-4 shadow-widget",
          className,
        )}
      >
        <div className="flex items-center gap-2 text-text-muted">
          <SparklesIcon className="size-4" />
          <h2 className="text-sm font-semibold">{t("aiRealHeading")}</h2>
        </div>
        <p className="text-sm text-text-muted">{t("aiRealEmptyBody")}</p>
      </section>
    );
  }

  const varianteRiesgo = VARIANTE_RIESGO[análisis.nivelRiesgo] ?? "default";

  return (
    <>
      <section
        className={cn(
          "flex h-full min-h-0 flex-col gap-2.5 rounded-lg border border-border-default/30 bg-bg-base p-4 shadow-widget",
          className,
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-text-primary">
            <SparklesIcon className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">{t("aiRealHeading")}</h2>
            <AvisoMotoresIa />
          </div>
          <Badge variante={varianteRiesgo}>
            {t("aiRealRisk", { level: análisis.nivelRiesgo })}
          </Badge>
        </div>

        <div className="space-y-1">
          {análisis.resumenTitular && (
            <p className="text-sm font-semibold text-text-primary">
              <TextoConNegritas texto={análisis.resumenTitular} />
            </p>
          )}
          <p className="line-clamp-3 text-sm leading-relaxed text-text-secondary">
            {análisis.resumenEjecutivo ? (
              <TextoConNegritas texto={análisis.resumenEjecutivo} />
            ) : (
              t("aiRealNoSummary")
            )}
          </p>
        </div>

        <ul className="grid grid-cols-3 gap-1.5">
          {[
            { etiqueta: t("aiRealNarrativesChip"), valor: análisis.narrativas.length },
            { etiqueta: t("aiRealRecommendationsChip"), valor: análisis.recomendaciones.length },
            { etiqueta: t("aiRealHashtagsChip"), valor: análisis.hashtags.length },
          ].map((chip) => (
            <li
              key={chip.etiqueta}
              className="flex flex-col items-start gap-0.5 rounded-lg bg-bg-muted/80 px-2 py-1.5"
            >
              <span className="text-sm font-bold tabular-nums tracking-tight text-text-primary">
                {chip.valor}
              </span>
              <span className="text-[10px] text-text-muted">{chip.etiqueta}</span>
            </li>
          ))}
        </ul>

        {tono && análisis.narrativas.length > 0 && (
          <div className="space-y-1.5 rounded-lg border border-border-default/50 bg-bg-base/70 p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              {t("aiRealToneHeading")}
            </p>
            <GraficaBarraSentimiento
              segmentos={[
                { id: "positivo", etiqueta: tCommon("positive"), porcentaje: tono.positivo, color: "bg-success" },
                { id: "neutro", etiqueta: tCommon("neutral"), porcentaje: tono.neutro, color: "bg-border-strong" },
                { id: "negativo", etiqueta: tCommon("negative"), porcentaje: tono.negativo, color: "bg-error" },
              ]}
              className="h-3"
            />
          </div>
        )}

        {destacadosFuente.length > 0 && (
          <ul className="space-y-1 text-xs leading-relaxed text-text-secondary">
            {destacadosFuente.slice(0, 2).map((d) => (
              <li key={d}>
                <TextoConNegritas texto={d} />
              </li>
            ))}
          </ul>
        )}

        {análisis.narrativas.length > 0 && (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex flex-wrap gap-1.5">
              {análisis.narrativas.map((n) => (
                <Badge
                  key={n.nombre}
                  variante={VARIANTE_SENTIMIENTO[n.sentimiento] ?? "default"}
                >
                  {n.nombre}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-auto self-start"
          onClick={() => setModalAbierto(true)}
        >
          {t("aiRealViewFull")}
        </Button>
      </section>

      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="flex max-h-[min(92dvh,880px)] w-[calc(100%-2rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="shrink-0 border-b border-border-default/50 px-6 py-5 pr-12">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <DialogTitle className="flex items-center gap-2">
                  <SparklesIcon className="size-5 shrink-0 text-primary" />
                  {t("aiRealModalTitle", { tema: análisis.tema })}
                </DialogTitle>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" size="sm" className="shrink-0" disabled={!!descargando}>
                    <DownloadIcon className="size-4" />
                    {descargando ? tCommon("generating") : t("downloadSummary")}
                    <ChevronDownIcon className="size-3.5 opacity-80" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onSelect={() => void descargar("pptx")}>
                    <PresentationIcon />
                    {tCommon("exportPptx")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => void descargar("pdf")}>
                    <FileTextIcon />
                    {tCommon("exportPdf")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => void descargar("markdown")}>
                    <FileTextIcon />
                    {tCommon("exportMd")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
            <div className="flex items-center gap-2">
              <Badge variante={varianteRiesgo}>
                {t("aiRealRisk", { level: análisis.nivelRiesgo })}
              </Badge>
              <span className="text-xs text-text-muted">
                {new Date(análisis.creadoEn).toLocaleString("es-MX", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>

            <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
              {[
                { etiqueta: t("aiRealRiskChip"), valor: análisis.nivelRiesgo },
                { etiqueta: t("aiRealNarrativesChip"), valor: String(análisis.narrativas.length) },
                { etiqueta: t("aiRealRecommendationsChip"), valor: String(análisis.recomendaciones.length) },
                { etiqueta: t("aiRealHashtagsChip"), valor: String(análisis.hashtags.length) },
              ].map((chip) => (
                <li
                  key={chip.etiqueta}
                  className="flex flex-col items-start gap-0.5 rounded-lg bg-bg-muted/80 px-2.5 py-2"
                >
                  <span className="text-lg font-bold tracking-tight text-text-primary tabular-nums">
                    {chip.valor}
                  </span>
                  <span className="text-[10px] text-text-muted">{chip.etiqueta}</span>
                </li>
              ))}
            </ul>

            <div>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
                {t("aiRealExecutiveSummary")}
              </h3>
              {análisis.resumenTitular && (
                <p className="mb-1 text-sm font-semibold text-text-primary">
                  <TextoConNegritas texto={análisis.resumenTitular} />
                </p>
              )}
              <p className="text-sm leading-relaxed text-text-primary">
                {análisis.resumenEjecutivo ? (
                  <TextoConNegritas texto={análisis.resumenEjecutivo} />
                ) : (
                  t("aiRealNoSummary")
                )}
              </p>
            </div>

            {destacadosFuente.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  {t("aiRealSourcesHighlights")}
                </h3>
                <ul className="space-y-1.5 text-sm leading-relaxed text-text-secondary">
                  {destacadosFuente.map((d) => (
                    <li key={d} className="flex gap-1.5">
                      <span aria-hidden>•</span>
                      <span>
                        <TextoConNegritas texto={d} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tono && análisis.narrativas.length > 0 && (
              <section className="space-y-2 rounded-xl border border-border-default/60 bg-bg-muted/30 p-4">
                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                  {t("aiRealToneHeading")}
                </h3>
                <GraficaBarraSentimiento
                  segmentos={[
                    { id: "positivo", etiqueta: tCommon("positive"), porcentaje: tono.positivo, color: "bg-success" },
                    { id: "neutro", etiqueta: tCommon("neutral"), porcentaje: tono.neutro, color: "bg-border-strong" },
                    { id: "negativo", etiqueta: tCommon("negative"), porcentaje: tono.negativo, color: "bg-error" },
                  ]}
                  className="h-4"
                />
                <p className="text-[10px] text-text-muted">
                  {t("aiRealToneSummary", {
                    pos: tono.positivo,
                    neu: tono.neutro,
                    neg: tono.negativo,
                    count: análisis.narrativas.length,
                  })}
                </p>
              </section>
            )}

            {análisis.narrativas.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  {t("aiRealNarrativesDetected")}
                </h3>
                <ul className="space-y-2.5">
                  {análisis.narrativas.map((n) => (
                    <li
                      key={n.nombre}
                      className="rounded-lg border border-border-default/50 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-text-primary">{n.nombre}</p>
                        <Badge variante={VARIANTE_SENTIMIENTO[n.sentimiento] ?? "default"}>
                          {n.sentimiento}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-text-muted">
                        {[n.menciones, n.tendencia && `tendencia: ${n.tendencia}`, n.riesgo && `riesgo: ${n.riesgo}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {análisis.recomendaciones.length > 0 && (
              <div>
                <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  {t("aiRealRecommendationsChip")}
                </h3>
                <ul className="list-disc space-y-1 pl-5 text-sm text-text-secondary">
                  {análisis.recomendaciones.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {análisis.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {análisis.hashtags.map((h) => (
                  <span key={h} className="text-xs text-primary">
                    {h.startsWith("#") ? h : `#${h}`}
                  </span>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
