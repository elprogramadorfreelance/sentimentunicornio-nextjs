"use client";

import {
  ArrowRightIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import type { CategoríaSentimiento, MenciónEditorial } from "@/types";

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

type ListaMencionesEditorialesProps = {
  menciones: MenciónEditorial[];
  className?: string;
  hrefVerMas?: string;
};

export function ListaMencionesEditoriales({
  menciones: mencionesEntrada,
  className,
  hrefVerMas = "/monitoreo/busqueda",
}: ListaMencionesEditorialesProps) {
  const t = useTranslations("mentions");
  const tCommon = useTranslations("common");
  // Ranking de "más presencia": sin fecha real de publicación la mención no
  // se puede ubicar en el tiempo — su fecha mostrada sería la de ingesta, no
  // la de publicación (caso real 2026-10-03: un post de abril-mayo aparecía
  // como 29-sep). Mismo criterio que tendencias/temas.
  const menciones = useMemo(
    () => mencionesEntrada.filter((m) => !m.fechaEstimada),
    [mencionesEntrada],
  );
  const [mostrarIndicador, setMostrarIndicador] = useState(
    menciones.length > 3,
  );

  useEffect(() => {
    setMostrarIndicador(menciones.length > 3);
  }, [menciones]);

  return (
    <Card
      className={cn(
        "relative flex min-h-0 flex-col overflow-hidden border-primary/20 bg-bg-base p-4 shadow-sm",
        className,
      )}
    >
      <span className="absolute inset-x-0 top-0 h-1 bg-primary" aria-hidden />
      <CardHeader className="mb-3">
        <CardTitle className="font-semibold text-text-primary">
          {t("editorialPresence")}
        </CardTitle>
        <p className="mt-1 text-xs text-text-muted">
          {t("editorialHelp")}
        </p>
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
                {t("editorialEmpty")}
              </p>
            ) : (
              <ul className="divide-y divide-border-default/60">
                {menciones.map((mención) => (
                  <li key={mención.id} className="py-3 first:pt-0">
                    <Link
                      href={mención.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary"
                          aria-hidden
                        >
                          {mención.fuente
                            .split(" ")
                            .map((parte) => parte[0])
                            .join("")
                            .slice(0, 2)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="line-clamp-2 text-xs font-semibold leading-snug text-text-primary group-hover:text-primary">
                              {mención.título}
                            </p>
                            <ExternalLinkIcon className="mt-0.5 size-3.5 shrink-0 text-text-muted group-hover:text-primary" />
                          </div>
                          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-text-muted">
                            {mención.extracto}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <Badge
                              variante={BADGE_SENTIMIENTO[mención.sentimiento]}
                              className="rounded-md px-1.5 py-0 text-[9px]"
                            >
                              {tCommon(CLAVE_SENTIMIENTO[mención.sentimiento])}
                            </Badge>
                            <span className="text-[9px] text-text-muted">
                              {mención.fuente} ·{" "}
                              {new Date(mención.publicadaEn).toLocaleDateString(
                                "es-MX",
                                { day: "2-digit", month: "short" },
                              )}
                            </span>
                            <span className="ml-auto text-[9px] font-medium text-text-secondary tabular-nums">
                              {tCommon("reachCount", {
                                value: Intl.NumberFormat("es-MX", {
                                  notation: "compact",
                                }).format(mención.alcance),
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
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
              {t("scrollMore")}
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
