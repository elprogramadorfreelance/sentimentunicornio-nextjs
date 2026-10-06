"use client";

import { ArrowRightIcon, ChevronDownIcon, ExternalLinkIcon, FileTextIcon, NewspaperIcon } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { SimpleIcon } from "simple-icons";
import { siFacebook, siInstagram, siTiktok, siX, siYoutube } from "simple-icons/icons";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { localeBcp47 } from "@/i18n/config";
import { formatoTiempoRelativo } from "@/lib/formato-tiempo";
import { cn } from "@/lib/utils";
import type {
  CategoríaSentimiento,
  MenciónEditorial,
  TipoFuenteMención,
} from "@/types";

const BADGE_SENTIMIENTO: Record<
  CategoríaSentimiento,
  "positivo" | "neutral" | "negativo"
> = {
  positivo: "positivo",
  neutral: "neutral",
  negativo: "negativo",
};

const CLAVE_SENTIMIENTO: Record<
  CategoríaSentimiento,
  "positive" | "neutral" | "negative"
> = {
  positivo: "positive",
  neutral: "neutral",
  negativo: "negative",
};

const ESTILO_FUENTE: Record<
  TipoFuenteMención,
  { color: string; icono?: SimpleIcon }
> = {
  x: { color: "bg-text-primary text-bg-base", icono: siX },
  facebook: { color: "bg-primary text-primary-fg", icono: siFacebook },
  instagram: { color: "bg-accent text-primary-fg", icono: siInstagram },
  youtube: { color: "bg-error text-primary-fg", icono: siYoutube },
  tiktok: { color: "bg-text-primary text-bg-base", icono: siTiktok },
  noticias: { color: "bg-sky text-navy" },
  blogs: { color: "bg-success text-primary-fg" },
};

function IconoFuente({ tipo }: { tipo: TipoFuenteMención }) {
  const estilo = ESTILO_FUENTE[tipo];
  if (estilo.icono) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="size-3.5"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d={estilo.icono.path} />
      </svg>
    );
  }
  const Icono = tipo === "noticias" ? NewspaperIcon : FileTextIcon;
  return <Icono className="size-4" />;
}

type ListaMencionesSentimientoProps = {
  título: string;
  descripción: string;
  menciones: MenciónEditorial[];
  hrefVerMas: string;
  className?: string;
};

export function ListaMencionesSentimiento({
  título,
  descripción,
  menciones,
  hrefVerMas,
  className,
}: ListaMencionesSentimientoProps) {
  const t = useTranslations("sentimentPage");
  const tCommon = useTranslations("common");
  const tMentions = useTranslations("mentions");
  const tDates = useTranslations("dates");
  const locale = useLocale();
  const [mostrarIndicador, setMostrarIndicador] = useState(
    menciones.length > 3,
  );

  useEffect(() => {
    setMostrarIndicador(menciones.length > 3);
  }, [menciones]);

  return (
    <Card
      className={cn(
        "relative flex min-h-0 flex-col overflow-hidden border-border-default/50 bg-bg-base p-4 shadow-widget",
        className,
      )}
    >
      <CardHeader className="mb-3">
        <CardTitle className="font-semibold text-text-primary">
          {título}
        </CardTitle>
        <p className="mt-1 text-xs text-text-muted">{descripción}</p>
      </CardHeader>

      <div className="relative min-h-0 flex-1">
        <CardContent className="h-full">
          <div
            className="h-full overflow-y-auto pb-8 pr-1"
            onScroll={(evento) => {
              const contenido = evento.currentTarget;
              const llegóAlFinal =
                contenido.scrollHeight -
                  contenido.scrollTop -
                  contenido.clientHeight <
                12;
              setMostrarIndicador(!llegóAlFinal);
            }}
          >
            {menciones.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-muted">
                {t("listEmpty")}
              </p>
            ) : (
              <ul className="divide-y divide-border-default/60">
                {menciones.map((mención) => {
                  const estilo = ESTILO_FUENTE[mención.tipoFuente];
                  return (
                    <li key={mención.id} className="py-3 first:pt-0">
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                            estilo.color,
                          )}
                          aria-hidden
                        >
                          <IconoFuente tipo={mención.tipoFuente} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-text-primary">
                                {mención.autor}
                              </p>
                              <p className="truncate text-[10px] text-text-muted">
                                {mención.fuente}
                              </p>
                            </div>
                            <Link
                              href={mención.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={t("openOriginal", {
                                author: mención.autor,
                              })}
                              className="flex size-7 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors duration-150 hover:bg-bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.97]"
                            >
                              <ExternalLinkIcon className="size-3.5" />
                            </Link>
                          </div>
                          <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-text-secondary">
                            {mención.extracto}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <Badge
                              variante={BADGE_SENTIMIENTO[mención.sentimiento]}
                              className="rounded-md px-1.5 py-0 text-[9px]"
                            >
                              {tCommon(CLAVE_SENTIMIENTO[mención.sentimiento])}
                            </Badge>
                            <time
                              dateTime={mención.publicadaEn}
                              className="text-[9px] text-text-muted"
                            >
                              {formatoTiempoRelativo(
                                mención.publicadaEn,
                                {
                                  now: tDates("now"),
                                  minutes: (count) => tDates("minutes", { count }),
                                  hours: (count) => tDates("hours", { count }),
                                  yesterday: tDates("yesterday"),
                                  days: (count) => tDates("days", { count }),
                                },
                                localeBcp47(locale),
                              )}
                            </time>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </CardContent>

        {mostrarIndicador && menciones.length > 3 && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 flex h-12 items-end justify-center bg-gradient-to-t from-bg-base via-bg-base/90 to-transparent pb-1"
            aria-hidden
          >
            <span className="inline-flex items-center gap-1 rounded-full border border-border-default/60 bg-bg-base px-2 py-1 text-[10px] font-medium text-text-secondary shadow-sm">
              {tMentions("scrollMore")}
              <ChevronDownIcon className="size-3 animate-bounce motion-reduce:animate-none" />
            </span>
          </div>
        )}
      </div>

      <footer className="mt-3 shrink-0 border-t border-border-default/60 pt-3">
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={hrefVerMas}>
            {tCommon("seeMore")}
            <ArrowRightIcon className="size-3.5" />
          </Link>
        </Button>
      </footer>
    </Card>
  );
}
