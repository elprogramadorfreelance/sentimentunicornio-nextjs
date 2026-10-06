"use client";

import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import {
  type MediaInteraccion,
  obtenerImagenesVideosMock,
} from "@/lib/mock/dashboard-general";
import { CardTitleBar } from "@/components/ui";
import { cn } from "@/lib/utils";

type ImagenesVideosWidgetProps = {
  className?: string;
  media?: MediaInteraccion[];
  total?: number;
};

const TOTAL_MOCK = 100;

function formatearInteracciones(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function ImagenesVideosWidget({
  className,
  media: mediaProp,
  total = TOTAL_MOCK,
}: ImagenesVideosWidgetProps) {
  const t = useTranslations("dashboard");
  const media = mediaProp ?? obtenerImagenesVideosMock(18);
  const [seleccionado, setSeleccionado] = useState<MediaInteraccion | null>(
    null,
  );

  return (
    <section
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border-default/30 bg-bg-base p-2.5 shadow-widget sm:p-3",
        className,
      )}
      aria-label={t("mediaTitle")}
    >
      <div className="flex shrink-0 items-baseline justify-between gap-2">
        <CardTitleBar bleed="sm">{t("mediaTitle")}</CardTitleBar>
        <span className="shrink-0 text-[11px] text-text-muted tabular-nums">
          {t("mediaRange", { shown: media.length, total })}
        </span>
      </div>

      <div className="mt-2 grid min-h-0 flex-1 grid-cols-6 gap-1.5 overflow-y-auto pr-0.5 sm:grid-cols-9">
        {media.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSeleccionado(item)}
            className="relative aspect-square shrink-0 overflow-hidden rounded-md transition-transform duration-[160ms] ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
            aria-label={t("mediaDetailAria", {
              source: item.fuente,
              ref: item.referencia,
            })}
          >
            {/* biome-ignore lint/performance/noImgElement: mock con URLs externas de Unsplash, no requiere optimización de next/image */}
            <img
              src={item.imagenUrl}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
            {!!item.interacciones && (
              <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-1 pb-0.5 pt-2 text-[9px] font-semibold text-white">
                {formatearInteracciones(item.interacciones)}
              </span>
            )}
          </button>
        ))}
      </div>

      <Button
        asChild
        size="sm"
        variant="secondary"
        className="mt-2 w-fit self-end"
      >
        <Link href="/menciones">{t("viewRelated")}</Link>
      </Button>

      <Dialog
        open={seleccionado !== null}
        onOpenChange={(abierto) => !abierto && setSeleccionado(null)}
      >
        <DialogContent className="sm:max-w-md">
          {seleccionado && (
            <>
              <div className="-m-6 mb-0 aspect-video overflow-hidden rounded-t-lg">
                {/* biome-ignore lint/performance/noImgElement: mock con URLs externas de Unsplash, no requiere optimización de next/image */}
                <img
                  src={seleccionado.imagenUrl.replace(
                    "w=300&h=300",
                    "w=640&h=360",
                  )}
                  alt=""
                  className="size-full object-cover"
                />
              </div>
              <DialogHeader className="pt-4">
                <DialogTitle>{seleccionado.fuente}</DialogTitle>
                <DialogDescription>{seleccionado.referencia}</DialogDescription>
              </DialogHeader>
              <Button asChild size="sm" className="mt-2 w-fit">
                <a
                  href={seleccionado.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("viewOriginal")}
                  <ExternalLinkIcon className="ml-1.5 size-3.5" />
                </a>
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
