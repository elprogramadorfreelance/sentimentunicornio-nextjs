"use client";

import { ChevronDownIcon, DownloadIcon, FileTextIcon, PresentationIcon, SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { GraficaBarraSentimiento } from "@/components/charts/grafica-barra-sentimiento";
import { GraficaTonalidadFuente } from "@/components/charts/grafica-tonalidad-fuente";
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
import {
  descargarResumenSentimientoMarkdown,
  descargarResumenSentimientoPdf,
  descargarResumenSentimientoPptx,
} from "@/lib/exportar-resumen-sentimiento";
import {
  construirTextoResumenIaSentimiento,
  narrativaDestacadaSentimiento,
  panoramaSentimientoIa,
  titularResumenIaSentimiento,
} from "@/lib/mock/resumen-ia-sentimiento";
import type { RespuestaSentimiento } from "@/types";

type ModalResumenIaSentimientoProps = {
  abierto: boolean;
  onAbiertoChange: (abierto: boolean) => void;
  datos: RespuestaSentimiento;
  nombreProyecto: string | null;
};

type FormatoDescarga = "markdown" | "pdf" | "pptx";

/** Misma estructura que la referencia de Bruno (panorama + sentimiento agregado + tonalidad por fuente + lectura IA + descarga), con datos reales. */
export function ModalResumenIaSentimiento({
  abierto,
  onAbiertoChange,
  datos,
  nombreProyecto,
}: ModalResumenIaSentimientoProps) {
  const t = useTranslations("sentimentPage");
  const tCommon = useTranslations("common");
  const [descargando, setDescargando] = useState<FormatoDescarga | null>(null);

  const intro = useMemo(
    () => construirTextoResumenIaSentimiento(datos, nombreProyecto),
    [datos, nombreProyecto],
  );
  const panorama = useMemo(() => panoramaSentimientoIa(datos), [datos]);
  const titular = useMemo(() => titularResumenIaSentimiento(panorama), [panorama]);
  const destacados = useMemo(
    () => narrativaDestacadaSentimiento(datos),
    [datos],
  );

  const segmentos = [
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

  async function descargar(formato: FormatoDescarga) {
    setDescargando(formato);
    try {
      if (formato === "markdown") {
        descargarResumenSentimientoMarkdown(datos, nombreProyecto);
      } else if (formato === "pdf") {
        await descargarResumenSentimientoPdf(datos, nombreProyecto);
      } else {
        await descargarResumenSentimientoPptx(datos, nombreProyecto);
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

  const alcanceDescripción = t("detailedDesc", {
    scope: nombreProyecto
      ? t("detailedDescProject", { name: nombreProyecto })
      : t("detailedDescAggregated"),
  });

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
              <DialogDescription>{alcanceDescripción}</DialogDescription>
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
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              {tCommon("panorama")}
            </h3>
            <p className="text-sm font-semibold text-text-primary">{titular}</p>
            <p className="text-sm leading-relaxed text-text-secondary">
              <TextoConNegritas texto={intro} />
            </p>
          </section>

          <section className="space-y-3 rounded-xl border border-border-default/60 bg-bg-muted/30 p-4">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                {t("aggregatedSentiment")}
              </h3>
              <span className="text-sm font-bold text-success tabular-nums">
                {t("percentPositive", { n: Math.round(panorama.positivo) })}
              </span>
            </div>
            <GraficaBarraSentimiento segmentos={segmentos} />
            <p className="text-[10px] text-text-muted">
              {t("sentimentMix", {
                pos: Math.round(panorama.positivo),
                neu: Math.round(panorama.neutro),
                neg: Math.round(panorama.negativo),
              })}
            </p>
          </section>

          <section className="space-y-2 rounded-xl border border-border-default/60 bg-bg-muted/30 p-4">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              {t("toneBySourceShort")}
            </h3>
            <GraficaTonalidadFuente
              fuentes={datos.tonalidadPorFuente}
              className="h-52"
            />
          </section>

          <section className="space-y-2 rounded-xl border border-primary/15 bg-primary/5 p-4">
            <h3 className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
              <SparklesIcon className="size-3" aria-hidden />
              {tCommon("aiReadingShort")}
            </h3>
            <ul className="space-y-1.5 text-sm leading-relaxed text-text-secondary">
              {destacados.map((punto) => (
                <li key={punto}>
                  <TextoConNegritas texto={punto} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
