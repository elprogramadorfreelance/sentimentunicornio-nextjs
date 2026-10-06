"use client";

import { ArrowRightIcon, FileTextIcon, FrownIcon, MessageSquareIcon, MinusIcon, Share2Icon, SmileIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ComponentType, SVGProps } from "react";
import { useEffect, useState } from "react";
import { GraficaBarraTraficoFuente } from "@/components/charts/grafica-barra-trafico-fuente";
import { AvisoLimitePlan, DisclaimerDataHistorica, EstadoSinProyectos } from "@/components/layout";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/components/ui";
import { useMenciones } from "@/lib/hooks/use-menciones";
import { useProyectosActivos } from "@/lib/hooks/use-proyectos-activos";
import { guardarRangoRecordado, leerRangoRecordado } from "@/lib/rango-calendario-seleccionado";
import { cn } from "@/lib/utils";
import type { FuenteMenciones } from "@/types";
import { CalendarioMenciones } from "./calendario-menciones";
import { GraficaTendenciaMenciones } from "./grafica-tendencia-menciones";
import { ListaMencionesEditoriales } from "./lista-menciones-editoriales";

// Un período elegido en el calendario puede no tener ninguna mención —
// antes de esto solo pasaba con un proyecto nuevo sin datos, ahora es un
// caso normal al filtrar por fecha.
function porcentajeDelTotal(valor: number, total: number): number {
  return total > 0 ? Math.round((valor / total) * 100) : 0;
}

const IDS_SKELETON_MÉTRICAS = [
  "total",
  "positivas",
  "negativas",
  "sociales",
  "editoriales",
] as const;

type IconoMétrica = ComponentType<SVGProps<SVGSVGElement>>;

type TarjetaMétricaProps = {
  etiqueta: string;
  valor: number;
  cambio: number | null;
  cambioAbsoluto: number;
  detalle: string;
  tono: "principal" | "positivo" | "negativo" | "social" | "editorial";
  href: string;
  Icono: IconoMétrica;
  destacada?: boolean;
};

const ESTILOS_TONO_MÉTRICA: Record<
  TarjetaMétricaProps["tono"],
  { icono: string; acento: string }
> = {
  principal: {
    icono: "bg-primary/10 text-primary",
    acento: "bg-primary",
  },
  positivo: {
    icono: "bg-success/10 text-success",
    acento: "bg-success",
  },
  negativo: {
    icono: "bg-error/10 text-error",
    acento: "bg-error",
  },
  social: {
    icono: "bg-sky/10 text-primary",
    acento: "bg-sky",
  },
  editorial: {
    icono: "bg-accent/10 text-accent",
    acento: "bg-accent",
  },
};

function formatearNúmero(valor: number): string {
  return Intl.NumberFormat("es-MX", {
    notation: valor >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(valor);
}

function TarjetaMétricaMenciones({
  etiqueta,
  valor,
  cambio,
  cambioAbsoluto,
  detalle,
  tono,
  href,
  Icono,
  destacada = false,
}: TarjetaMétricaProps) {
  const t = useTranslations("common");
  const tMentions = useTranslations("mentions");
  const tendencia = cambio === null ? "nd" : cambio > 0 ? "sube" : cambio < 0 ? "baja" : "estable";
  const estilos = ESTILOS_TONO_MÉTRICA[tono];

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-border-default/50 bg-bg-base p-3 shadow-widget",
        destacada && "border-primary/30 bg-primary/[0.035]",
      )}
    >
      <span
        className={cn(
          "absolute inset-x-3 top-0 h-0.5 rounded-b-full opacity-75",
          estilos.acento,
          destacada && "inset-x-0 h-1 rounded-none opacity-100",
        )}
        aria-hidden
      />
      <CardContent className="flex h-full flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-text-secondary">
            {etiqueta}
          </p>
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              estilos.icono,
            )}
          >
            <Icono className="size-[1.125rem]" aria-hidden />
          </span>
        </div>
        <div>
          <p
            className={cn(
              "font-bold tracking-tight text-text-primary tabular-nums",
              destacada ? "text-3xl" : "text-2xl",
            )}
          >
            {formatearNúmero(valor)}
          </p>
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 border-t border-border-default/40 pt-2">
          <p className="text-[11px] font-medium text-text-muted">{detalle}</p>
          <div className="flex shrink-0 flex-col items-end gap-0.5">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                tendencia === "sube" && "bg-success/10 text-success",
                tendencia === "baja" && "bg-error/10 text-error",
                (tendencia === "estable" || tendencia === "nd") && "bg-bg-muted text-text-secondary",
              )}
            >
              {tendencia === "sube" ? (
                <TrendingUpIcon className="size-3" aria-hidden />
              ) : tendencia === "baja" ? (
                <TrendingDownIcon className="size-3" aria-hidden />
              ) : tendencia === "estable" ? (
                <MinusIcon className="size-3" aria-hidden />
              ) : null}
              {cambio === null
                ? `${cambioAbsoluto > 0 ? "+" : ""}${formatearNúmero(cambioAbsoluto)}`
                : `${cambio > 0 ? "+" : ""}${cambio.toFixed(1)}%`}
            </span>
            <span className="text-[9px] leading-none text-text-muted">
              {tMentions("vsPrevious")}
            </span>
          </div>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="mt-1 h-7 w-full justify-between px-2.5 text-[10px]"
        >
          <Link href={href}>
            {t("seeMore")}
            <ArrowRightIcon className="size-3" aria-hidden />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function FuentesMencionesCard({
  fuentes,
  className,
}: {
  fuentes: FuenteMenciones[];
  className?: string;
}) {
  const t = useTranslations("mentions");
  return (
    <Card
      className={cn(
        "flex min-h-0 flex-col bg-bg-base p-4 shadow-widget",
        className,
      )}
    >
      <CardHeader className="mb-3">
        <CardTitle className="font-semibold text-text-primary">
          {t("bySourceType")}
        </CardTitle>
        <p className="mt-1 text-xs text-text-muted">
          {t("byChannelHelp")}
        </p>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto">
        {fuentes.length === 0 ? (
          <p className="py-6 text-center text-xs text-text-muted">
            {t("emptyPeriod")}
          </p>
        ) : (
          <ol className="space-y-3">
            {fuentes.map((fuente, índice) => (
              <li key={fuente.id}>
                <div className="mb-1 flex items-center gap-2 text-[11px]">
                  <span className="w-4 text-right text-text-muted tabular-nums">
                    {índice + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium text-text-secondary">
                    {fuente.nombre}
                  </span>
                  {fuente.cambio === null ? (
                    // El % no es confiable con una base de período anterior
                    // muy chica (ver VOLUMEN_MINIMO_CAMBIO — protege contra
                    // casos reales como "+847,366.7%"), pero el delta real
                    // de menciones SIEMPRE es calculable — mostrar eso en
                    // vez de "N/D" (pedido explícito del cliente, 2026-10-02:
                    // "no puede existir N/D jamás en esta gráfica").
                    <span
                      className={cn(
                        "font-semibold tabular-nums",
                        fuente.cambioAbsoluto >= 0 ? "text-success" : "text-error",
                      )}
                    >
                      {fuente.cambioAbsoluto >= 0 ? "+" : ""}
                      {formatearNúmero(fuente.cambioAbsoluto)}
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "font-semibold tabular-nums",
                        fuente.cambio >= 0 ? "text-success" : "text-error",
                      )}
                    >
                      {fuente.cambio >= 0 ? "+" : ""}
                      {fuente.cambio}%
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 pl-6">
                  <span className="w-14 shrink-0 text-[10px] font-semibold text-text-primary tabular-nums">
                    {formatearNúmero(fuente.total)}
                  </span>
                  <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-bg-muted">
                    <GraficaBarraTraficoFuente
                      fuente={fuente.nombre}
                      porcentaje={fuente.porcentaje}
                      color={fuente.color}
                    />
                  </div>
                  <span className="w-9 text-right text-[9px] text-text-muted tabular-nums">
                    {fuente.porcentaje}%
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function SkeletonMenciones() {
  const t = useTranslations("mentions");
  return (
    <output className="block space-y-4" aria-label={t("loading")}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {IDS_SKELETON_MÉTRICAS.map((id) => (
          <Skeleton key={id} className="h-44 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-12">
        <Skeleton className="h-[370px] rounded-lg xl:col-span-3" />
        <Skeleton className="h-[370px] rounded-lg xl:col-span-6" />
        <Skeleton className="h-[370px] rounded-lg xl:col-span-3" />
      </div>
      <Skeleton className="h-80 rounded-lg" />
    </output>
  );
}

export function MencionesVista() {
  const t = useTranslations("mentions");
  const tCommon = useTranslations("common");
  // Selector multi-proyecto del sidebar (ver use-proyectos-activos.tsx):
  // "un solo proyecto elegido" filtra de verdad; "todos" o "2+ proyectos"
  // muestra sin filtrar (mismo criterio que Bruno — filtrar Menciones a un
  // subconjunto arbitrario no está soportado, solo un proyecto o todos).
  const { idUnicoOAgregado, sinSeleccion } = useProyectosActivos();
  const [rango, setRango] = useState<{ inicio: string; fin: string } | null>(null);
  const { datos, cargando, error } = useMenciones(idUnicoOAgregado, rango);

  function cambiarRango(nuevo: { inicio: string; fin: string } | null) {
    setRango(nuevo);
    guardarRangoRecordado(nuevo);
  }

  // Hereda el último rango de fechas elegido en cualquier página (Dashboard
  // o Menciones) — solo una vez al montar, el rango no vive en la URL.
  useEffect(() => {
    const recordado = leerRangoRecordado();
    if (recordado) setRango(recordado);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function crearHrefDetalle(sentimiento?: "positivo" | "negativo") {
    const parámetros = new URLSearchParams();
    if (idUnicoOAgregado) parámetros.set("proyecto", idUnicoOAgregado);
    if (sentimiento) parámetros.set("sentimiento", sentimiento);
    const consulta = parámetros.toString();
    return consulta ? `/menciones/detalle?${consulta}` : "/menciones/detalle";
  }

  const hrefDetalle = crearHrefDetalle();
  const tarjetas = datos
    ? [
        {
          etiqueta: t("total"),
          valor: datos.resumen.total,
          cambio: datos.resumen.cambioTotal,
          cambioAbsoluto: datos.resumen.cambioTotalAbsoluto,
          detalle: t("volumeMonitored"),
          tono: "principal" as const,
          href: hrefDetalle,
          Icono: MessageSquareIcon,
          destacada: true,
        },
        {
          etiqueta: t("positive"),
          valor: datos.resumen.positivas,
          cambio: datos.resumen.cambioPositivas,
          cambioAbsoluto: datos.resumen.cambioPositivasAbsoluto,
          detalle: tCommon("percentOfTotal", {
            n: porcentajeDelTotal(datos.resumen.positivas, datos.resumen.total),
          }),
          tono: "positivo" as const,
          href: crearHrefDetalle("positivo"),
          Icono: SmileIcon,
        },
        {
          etiqueta: t("negative"),
          valor: datos.resumen.negativas,
          cambio: datos.resumen.cambioNegativas,
          cambioAbsoluto: datos.resumen.cambioNegativasAbsoluto,
          detalle: tCommon("percentOfTotal", {
            n: porcentajeDelTotal(datos.resumen.negativas, datos.resumen.total),
          }),
          tono: "negativo" as const,
          href: crearHrefDetalle("negativo"),
          Icono: FrownIcon,
        },
        {
          etiqueta: t("onSocial"),
          valor: datos.resumen.redesSociales,
          cambio: datos.resumen.cambioRedesSociales,
          cambioAbsoluto: datos.resumen.cambioRedesSocialesAbsoluto,
          detalle: tCommon("percentOfTotal", {
            n: porcentajeDelTotal(datos.resumen.redesSociales, datos.resumen.total),
          }),
          tono: "social" as const,
          href: hrefDetalle,
          Icono: Share2Icon,
        },
        {
          etiqueta: t("editorial"),
          valor: datos.resumen.editoriales,
          cambio: datos.resumen.cambioEditoriales,
          cambioAbsoluto: datos.resumen.cambioEditorialesAbsoluto,
          detalle: tCommon("percentOfTotal", {
            n: porcentajeDelTotal(datos.resumen.editoriales, datos.resumen.total),
          }),
          tono: "editorial" as const,
          href: hrefDetalle,
          Icono: FileTextIcon,
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      <DisclaimerDataHistorica />
      {datos?.límiteHistórico?.activo && (
        <AvisoLimitePlan días={datos.límiteHistórico.días} />
      )}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("title")}</h1>
          <p className="mt-1 text-sm text-text-muted">{t("subtitleLong")}</p>
        </div>
      </header>

      {sinSeleccion ? (
        <EstadoSinProyectos
          titulo={tCommon("selectAtLeastOneProject")}
          descripcion={tCommon("selectAtLeastOneHint")}
        />
      ) : cargando && !datos ? (
        <SkeletonMenciones />
      ) : error || !datos ? (
        <Card className="border-error/30 bg-error/5 text-sm text-error">
          {error ?? t("loadError")}
        </Card>
      ) : (
        <div
          className={cn(
            "space-y-4 transition-opacity duration-200",
            cargando && "opacity-55",
          )}
        >
          <section
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
            aria-label={t("summary")}
          >
            {tarjetas.map((tarjeta) => (
              <TarjetaMétricaMenciones key={tarjeta.etiqueta} {...tarjeta} />
            ))}
          </section>

          <div className="grid gap-4 xl:grid-cols-12">
            <CalendarioMenciones
              className="h-[370px] xl:col-span-3"
              rangoInicial={rango}
              onRangoChange={cambiarRango}
              máximoDías={datos?.límiteHistórico?.activo ? datos.límiteHistórico.días : null}
            />

            <Card className="flex h-[370px] min-h-0 flex-col bg-bg-base p-4 shadow-widget xl:col-span-5">
              <CardHeader className="mb-1">
                <CardTitle className="font-semibold text-text-primary">
                  {t("trendTitle")}
                </CardTitle>
                <p className="mt-1 text-xs text-text-muted">
                  {t("trendHelp")}
                </p>
              </CardHeader>
              <CardContent className="min-h-0 flex-1">
                <GraficaTendenciaMenciones puntos={datos.tendencia} />
              </CardContent>
            </Card>

            <ListaMencionesEditoriales
              menciones={datos.menciones}
              hrefVerMas={hrefDetalle}
              className="h-[370px] xl:col-span-4"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-12">
            <Card className="flex h-80 min-h-0 flex-col bg-bg-base p-4 shadow-widget xl:col-span-8">
              <CardHeader className="mb-1 flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="font-semibold text-text-primary">
                    {t("volume")}
                  </CardTitle>
                  <p className="mt-1 text-xs text-text-muted">
                    {t("compareHelp")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-[10px] text-text-muted">
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-primary" />
                    {t("periodCurrent")}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-sky-muted" />
                    {t("periodPrevious")}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="min-h-0 flex-1">
                <GraficaTendenciaMenciones puntos={datos.tendencia} comparar />
              </CardContent>
            </Card>

            <FuentesMencionesCard
              fuentes={datos.fuentes}
              className="h-80 xl:col-span-4"
            />
          </div>
        </div>
      )}
    </div>
  );
}
