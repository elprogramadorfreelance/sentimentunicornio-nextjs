"use client";

import { ExternalLinkIcon, EyeIcon, FileTextIcon, MessageCircleIcon, NewspaperIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { SimpleIcon } from "simple-icons";
import { siFacebook, siInstagram, siTiktok, siX, siYoutube } from "simple-icons/icons";
import { Badge, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import type {
  CategoríaSentimiento,
  MenciónDetalle,
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

function IconoFuente({
  tipo,
  icono,
}: {
  tipo: TipoFuenteMención;
  icono?: SimpleIcon;
}) {
  if (icono) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="size-3.5"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d={icono.path} />
      </svg>
    );
  }

  const Icono = tipo === "noticias" ? NewspaperIcon : FileTextIcon;
  return <Icono className="size-4" />;
}

function formatearNúmero(valor: number | null, etiquetaND: string): string {
  if (valor == null) return etiquetaND;
  return Intl.NumberFormat("es-MX", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(valor);
}

type ColumnaMencionesDetalleProps = {
  tipo: TipoFuenteMención;
  nombre: string;
  menciones: MenciónDetalle[];
  // Total real de esta fuente entre todas las menciones filtradas — no
  // "cuántas se han cargado hasta ahorita" (`menciones.length`), que se
  // quedaba muy por debajo del real apenas la fuente tenía más de una página.
  total: number;
  hayMás: boolean;
  cargandoMás: boolean;
  onCargarMás: () => void;
};

export function ColumnaMencionesDetalle({
  tipo,
  nombre,
  menciones,
  total,
  hayMás,
  cargandoMás,
  onCargarMás,
}: ColumnaMencionesDetalleProps) {
  const t = useTranslations("mentions");
  const tCommon = useTranslations("common");
  const estilo = ESTILO_FUENTE[tipo];

  return (
    <section
      aria-labelledby={`fuente-${tipo}`}
      className="flex h-[34rem] min-w-0 snap-start flex-col lg:h-[calc(100dvh-22rem)] lg:min-h-[24rem]"
    >
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2 px-1">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold",
              estilo.color,
            )}
            aria-hidden
          >
            <IconoFuente tipo={tipo} icono={estilo.icono} />
          </span>
          <h2
            id={`fuente-${tipo}`}
            className="truncate text-sm font-bold text-text-primary"
          >
            {nombre}
          </h2>
        </div>
        <span className="rounded-full bg-bg-muted px-2 py-0.5 text-[10px] font-semibold text-text-muted tabular-nums">
          {total}
        </span>
      </div>

      {/* Antes cargaba más automáticamente al acercarse al final del scroll
          (scroll infinito) — pedido explícito del cliente: que el usuario
          decida cuándo pedir más, no que se dispare solo. Mismos datos/
          paginación de siempre, solo que ahora requiere el clic del botón
          de abajo en vez de disparar con el scroll. */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {menciones.map((mención) => (
          <Card
            key={mención.id}
            className="group bg-bg-base p-3 shadow-widget transition-colors hover:border-primary/25"
          >
            <article>
              <div className="flex items-start gap-2.5">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                    estilo.color,
                  )}
                  aria-hidden
                >
                  {mención.autor
                    .split(" ")
                    .map((parte) => parte[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-text-primary">
                        {mención.autor}
                      </p>
                      <p className="truncate text-[10px] text-text-muted">
                        {mención.usuario}
                      </p>
                    </div>
                    <Link
                      href={mención.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t("openMention", { author: mención.autor })}
                      className="flex size-7 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <ExternalLinkIcon className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              <p className="mt-2.5 text-xs leading-relaxed text-text-secondary">
                {mención.contenido}
              </p>

              <div className="mt-3 flex items-center justify-between gap-2">
                <Badge
                  variante={BADGE_SENTIMIENTO[mención.sentimiento]}
                  className="rounded-md px-1.5 py-0 text-[9px]"
                >
                  {tCommon(CLAVE_SENTIMIENTO[mención.sentimiento])}
                </Badge>
                <time
                  dateTime={mención.publicadaEn}
                  className="text-[9px] text-text-muted"
                  title={mención.fechaEstimada ? t("estimatedDateTooltip") : undefined}
                >
                  {mención.fechaEstimada && (
                    <span aria-hidden className="mr-0.5">
                      ~
                    </span>
                  )}
                  {new Date(mención.publicadaEn).toLocaleDateString("es-MX", {
                    day: "2-digit",
                    month: "short",
                  })}
                </time>
              </div>

              {/* "Compartidos" se quitó para todas las fuentes: ninguna
                  plataforma real (ni Facebook, X, Instagram o TikTok) expone
                  ese número por separado hoy en día — mostrarlo como "N/D"
                  siempre prometía un dato que nunca iba a llegar. Vistas/
                  interacciones tampoco aplican a noticias/blogs (un artículo
                  de prensa no tiene "vistas" en el sentido de red social). */}
              {mención.tipoFuente !== "noticias" && mención.tipoFuente !== "blogs" && (
                <div className="mt-2.5 flex items-center gap-3 border-t border-border-default/50 pt-2 text-[9px] text-text-muted">
                  <span className="inline-flex items-center gap-1">
                    <EyeIcon className="size-3" aria-hidden />
                    {formatearNúmero(mención.alcance, t("noReportedValue"))}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageCircleIcon className="size-3" aria-hidden />
                    {formatearNúmero(mención.interacciones, t("noReportedValue"))}
                  </span>
                </div>
              )}
            </article>
          </Card>
        ))}
        <div className="px-1 py-2 text-center" aria-live="polite">
          {cargandoMás ? (
            <span className="text-[10px] text-text-muted">{t("loadingMore")}</span>
          ) : hayMás ? (
            <button
              type="button"
              onClick={onCargarMás}
              className="rounded-md px-2 py-1 text-[10px] font-medium text-primary transition-colors hover:bg-bg-muted hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {t("loadMoreButton")}
            </button>
          ) : (
            <span className="text-[10px] text-text-muted">{t("endOfList")}</span>
          )}
        </div>
      </div>
    </section>
  );
}
