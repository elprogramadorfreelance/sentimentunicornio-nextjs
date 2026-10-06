"use client";

import { ChevronDownIcon, DownloadIcon, FileTextIcon, PresentationIcon, SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
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
} from "@/components/ui";
import {
  descargarReporteBusquedaMarkdown,
  descargarReporteBusquedaPdf,
  descargarReporteBusquedaPptx,
  type ReporteBusquedaReal,
} from "@/lib/exportar-reporte-busqueda";

export type FormatoReporteBusqueda = "pdf" | "pptx" | "markdown";

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

type ModalAnalisisBusquedaProps = {
  abierto: boolean;
  onAbiertoChange: (abierto: boolean) => void;
  reporte: ReporteBusquedaReal | null;
};

/**
 * El resumen ejecutivo, narrativas y recomendaciones son lo que gpt-4o
 * realmente escribió sobre los resultados reales de la búsqueda (mismo motor
 * que ya usa el análisis de proyectos, ver GET /api/search-live/analizar) —
 * no un texto armado localmente a partir de números promediados.
 */
export function ModalAnalisisBusqueda({ abierto, onAbiertoChange, reporte }: ModalAnalisisBusquedaProps) {
  const t = useTranslations("searchPage");
  const tCommon = useTranslations("common");
  const tProjects = useTranslations("projects");
  const [exportando, setExportando] = useState<FormatoReporteBusqueda | null>(null);

  async function exportar(formato: FormatoReporteBusqueda) {
    if (!reporte) return;
    setExportando(formato);
    try {
      if (formato === "pdf") await descargarReporteBusquedaPdf(reporte);
      else if (formato === "markdown") descargarReporteBusquedaMarkdown(reporte);
      else await descargarReporteBusquedaPptx(reporte);
      toast.success(tCommon("reportExported"), {
        description:
          formato === "pdf"
            ? tCommon("filePdfReady")
            : formato === "pptx"
              ? tCommon("filePptxReady")
              : tCommon("fileMdReady"),
      });
    } catch (errorDesconocido) {
      toast.error(tCommon("exportFailedReport"), {
        description: errorDesconocido instanceof Error ? errorDesconocido.message : tCommon("tryAgainLaterAlt"),
      });
    } finally {
      setExportando(null);
    }
  }

  const varianteRiesgo = reporte ? (VARIANTE_RIESGO[reporte.nivelRiesgo] ?? "default") : "default";

  return (
    <Dialog open={abierto && !!reporte} onOpenChange={onAbiertoChange}>
      <DialogContent className="flex max-h-[min(92dvh,880px)] w-[calc(100%-2rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b border-border-default/50 px-6 py-5 pr-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <DialogTitle className="flex items-center gap-2">
                <SparklesIcon className="size-5 shrink-0 text-primary" />
                {t("analysisTitle")}
              </DialogTitle>
              <DialogDescription>
                {reporte
                  ? t("analysisDescOurs", {
                      query: reporte.consulta,
                      results: reporte.totalResultados,
                      sources: reporte.totalFuentes,
                    })
                  : t("analysisDescFallbackOurs")}
              </DialogDescription>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" size="sm" className="shrink-0" disabled={!reporte || !!exportando}>
                  <DownloadIcon className="size-4" />
                  {exportando ? tCommon("exporting") : tCommon("exportReport")}
                  <ChevronDownIcon className="size-3.5 opacity-80" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onSelect={() => void exportar("pdf")}>
                  <FileTextIcon />
                  {tCommon("exportPdfDetailed")}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void exportar("pptx")}>
                  <PresentationIcon />
                  {tCommon("exportPptx")}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void exportar("markdown")}>
                  <FileTextIcon />
                  {tCommon("exportMd")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogHeader>

        {reporte && (
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
            <div className="flex items-center gap-2">
              <Badge variante={varianteRiesgo}>{tProjects("aiRealRisk", { level: reporte.nivelRiesgo })}</Badge>
              <span className="text-xs text-text-muted">
                {t("sentimentBreakdownInline", {
                  pos: reporte.sentimiento.positivo,
                  neu: reporte.sentimiento.neutral,
                  neg: reporte.sentimiento.negativo,
                })}
              </span>
            </div>

            <div>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">{tProjects("aiRealExecutiveSummary")}</h3>
              <p className="text-sm leading-relaxed text-text-primary">
                {reporte.resumenEjecutivo || tProjects("aiRealNoSummary")}
              </p>
            </div>

            {reporte.narrativas.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">{tProjects("aiRealNarrativesDetected")}</h3>
                <ul className="space-y-2.5">
                  {reporte.narrativas.map((n) => (
                    <li key={n.nombre} className="rounded-lg border border-border-default/50 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-text-primary">{n.nombre}</p>
                        <Badge variante={VARIANTE_SENTIMIENTO[n.sentimiento.toLowerCase()] ?? "default"}>{n.sentimiento}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-text-muted">
                        {[
                          n.menciones,
                          n.tendencia && t("trendInline", { value: n.tendencia }),
                          n.riesgo && t("riskInline", { value: n.riesgo }),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {reporte.recomendaciones.length > 0 && (
              <div>
                <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">{tProjects("aiRealRecommendationsChip")}</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm text-text-secondary">
                  {reporte.recomendaciones.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {reporte.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {reporte.hashtags.map((h) => (
                  <span key={h} className="text-xs text-primary">
                    {h.startsWith("#") ? h : `#${h}`}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
