"use client";

import { ChevronDownIcon, DownloadIcon, FileTextIcon, PresentationIcon, SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
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
import type { HashtagReal } from "@/lib/api";
import {
  descargarResumenNarrativasMarkdown,
  descargarResumenNarrativasPdf,
  descargarResumenNarrativasPptx,
} from "@/lib/exportar-resumen-narrativas";
import type { PalabraClaveReal } from "@/lib/palabras-clave-cliente";
import type { ResumenNarrativasReal } from "@/lib/resumen-narrativas-cliente";
import type { FuenteMenciones } from "@/types";
import type { PaisMapa } from "@/components/charts/grafica-mapa-paises";

type ModalResumenIaNarrativasProps = {
  abierto: boolean;
  onAbiertoChange: (abierto: boolean) => void;
  resumen: ResumenNarrativasReal;
  hashtags: HashtagReal[];
  palabrasClave: PalabraClaveReal[];
  fuentes: FuenteMenciones[];
  países: PaisMapa[];
  alcanceEtiqueta: string;
};

type FormatoDescarga = "markdown" | "pdf" | "pptx";

/** Misma estructura que la referencia de Bruno (panorama + lectura + hashtags + fuentes/regiones + descarga), con datos reales. */
export function ModalResumenIaNarrativas({
  abierto,
  onAbiertoChange,
  resumen,
  hashtags,
  palabrasClave,
  fuentes,
  países,
  alcanceEtiqueta,
}: ModalResumenIaNarrativasProps) {
  const t = useTranslations("narratives");
  const tCommon = useTranslations("common");
  const [descargando, setDescargando] = useState<FormatoDescarga | null>(null);

  async function descargar(formato: FormatoDescarga) {
    setDescargando(formato);
    try {
      if (formato === "markdown") {
        descargarResumenNarrativasMarkdown(resumen, hashtags, palabrasClave, países, fuentes, alcanceEtiqueta);
      } else if (formato === "pdf") {
        await descargarResumenNarrativasPdf(resumen, hashtags, palabrasClave, países, fuentes, alcanceEtiqueta);
      } else {
        await descargarResumenNarrativasPptx(resumen, hashtags, palabrasClave, países, fuentes, alcanceEtiqueta);
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

  return (
    <Dialog open={abierto} onOpenChange={onAbiertoChange}>
      <DialogContent className="flex max-h-[min(92dvh,880px)] w-[calc(100%-2rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b border-border-default/50 px-6 py-5 pr-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <DialogTitle className="flex items-center gap-2">
                <SparklesIcon className="size-5 shrink-0 text-primary" />
                {t("detailedSummaryTitle")}
              </DialogTitle>
              <DialogDescription>{t("detailedSummaryDesc")}</DialogDescription>
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
            <h3 className="text-[10px] font-semibold tracking-widest text-text-muted uppercase">
              {tCommon("panorama")}
            </h3>
            <p className="text-sm font-semibold text-text-primary">
              <TextoConNegritas texto={resumen.titular} />
            </p>
            <p className="text-sm leading-relaxed text-text-secondary">
              <TextoConNegritas texto={resumen.texto} />
            </p>
          </section>

          <section className="space-y-2 rounded-xl border border-primary/15 bg-primary/5 p-4">
            <h3 className="flex items-center gap-1 text-[10px] font-semibold tracking-widest text-primary uppercase">
              <SparklesIcon className="size-3" aria-hidden />
              {t("aiReadingDetail")}
            </h3>
            <ul className="space-y-1.5 text-sm leading-relaxed text-text-secondary">
              {resumen.lectura.map((punto) => (
                <li key={punto}>
                  <TextoConNegritas texto={punto} />
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-2 rounded-xl border border-border-default/60 bg-bg-muted/30 p-4">
            <h3 className="text-[10px] font-semibold tracking-widest text-text-muted uppercase">
              {t("hashtagsHeading")}
            </h3>
            <ul className="space-y-1 text-sm text-text-secondary">
              {hashtags.slice(0, 6).map((item) => (
                <li key={item.hashtag} className="flex justify-between gap-3">
                  <span>{item.hashtag}</span>
                  <span className="tabular-nums text-text-primary">{item.total}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-2 rounded-xl border border-border-default/60 bg-bg-muted/30 p-4">
            <h3 className="text-[10px] font-semibold tracking-widest text-text-muted uppercase">
              {t("sourcesAndCountries")}
            </h3>
            <ul className="space-y-1 text-sm text-text-secondary">
              {fuentes.map((fuente) => (
                <li key={fuente.id} className="flex justify-between gap-3">
                  <span>{fuente.nombre}</span>
                  <span className="tabular-nums text-text-primary">{fuente.total}</span>
                </li>
              ))}
            </ul>
            <ul className="mt-3 space-y-1 border-t border-border-default/50 pt-3 text-sm text-text-secondary">
              {países.slice(0, 6).map((país) => (
                <li key={país.codigoIso3} className="flex justify-between gap-3">
                  <span>{país.pais}</span>
                  <span className="tabular-nums text-text-primary">{país.menciones}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
