"use client";

import { ChevronDownIcon, DownloadIcon, FileTextIcon, PresentationIcon, SparklesIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
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
import { localeBcp47 } from "@/i18n/config";
import {
  descargarResumenBenchmarkingMarkdown,
  descargarResumenBenchmarkingPdf,
  descargarResumenBenchmarkingPptx,
} from "@/lib/exportar-resumen-benchmarking";
import type { RespuestaBenchmarking } from "@/types";

type ModalResumenIaBenchmarkingProps = {
  abierto: boolean;
  onAbiertoChange: (abierto: boolean) => void;
  datos: RespuestaBenchmarking;
};

type FormatoDescarga = "markdown" | "pdf" | "pptx";

/** Misma estructura que la referencia de Bruno (panorama + lectura + vista general por proyecto + descarga), con datos reales. */
export function ModalResumenIaBenchmarking({
  abierto,
  onAbiertoChange,
  datos,
}: ModalResumenIaBenchmarkingProps) {
  const t = useTranslations("benchmarking");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const bcp47 = localeBcp47(locale);
  const [descargando, setDescargando] = useState<FormatoDescarga | null>(null);
  const intro = t("summaryIntro", {
    mentionsLeader: datos.resumen.liderMenciones,
    reachLeader: datos.resumen.liderAlcance,
    sentimentLeader: datos.resumen.liderSentimiento,
  });

  async function descargar(formato: FormatoDescarga) {
    setDescargando(formato);
    try {
      if (formato === "markdown") {
        descargarResumenBenchmarkingMarkdown(datos);
      } else if (formato === "pdf") {
        await descargarResumenBenchmarkingPdf(datos);
      } else {
        await descargarResumenBenchmarkingPptx(datos);
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
        description: error instanceof Error ? error.message : tCommon("tryAgain"),
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
                {tCommon("detailedAiSummary")}
              </DialogTitle>
              <DialogDescription>{t("detailedDesc")}</DialogDescription>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" size="sm" className="shrink-0" disabled={!!descargando}>
                  <DownloadIcon className="size-4" />
                  {descargando ? tCommon("generating") : tCommon("downloadSummary")}
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
          <section className="space-y-2">
            <h3 className="text-[10px] font-semibold tracking-widest text-text-muted uppercase">{tCommon("panorama")}</h3>
            <p className="text-sm font-semibold text-text-primary">
              <TextoConNegritas texto={datos.resumen.titular} />
            </p>
            <p className="text-sm leading-relaxed text-text-secondary">
              <TextoConNegritas texto={intro} />
            </p>
          </section>

          <section className="space-y-2 rounded-xl border border-primary/15 bg-primary/5 p-4">
            <h3 className="flex items-center gap-1 text-[10px] font-semibold tracking-widest text-primary uppercase">
              <SparklesIcon className="size-3" aria-hidden />
              {tCommon("aiReadingShort")}
            </h3>
            <ul className="space-y-1.5 text-sm leading-relaxed text-text-secondary">
              {datos.resumen.lectura.map((punto) => (
                <li key={punto}>
                  <TextoConNegritas texto={punto} />
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-2 rounded-xl border border-border-default/60 bg-bg-muted/30 p-4">
            <h3 className="text-[10px] font-semibold tracking-widest text-text-muted uppercase">{t("overviewTitle")}</h3>
            <ul className="space-y-1 text-sm text-text-secondary">
              {datos.proyectos.map((proyecto) => (
                <li key={proyecto.proyectoId} className="flex justify-between gap-3">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ background: proyecto.color }}
                      aria-hidden
                    />
                    {proyecto.nombre}
                  </span>
                  <span className="tabular-nums text-text-primary">
                    {proyecto.mencionesTotales.toLocaleString(bcp47)} {tCommon("mentions").toLowerCase()} ·{" "}
                    {(proyecto.alcanceRedesSociales + proyecto.alcanceFueraRedes).toLocaleString(bcp47, {
                      notation: "compact",
                    })}{" "}
                    {tCommon("reach").toLowerCase()}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
