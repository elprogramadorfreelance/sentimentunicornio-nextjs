"use client";

import { InfoIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { GraficaTonalidadFuente } from "@/components/charts/grafica-tonalidad-fuente";
import { CalendarioMenciones } from "@/components/menciones/calendario-menciones";
import {
  AvisoLimitePlan,
  DisclaimerDataHistorica,
  EstadoSinProyectos,
} from "@/components/layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui";
import { useProyectosActivos } from "@/lib/hooks/use-proyectos-activos";
import { useSentimiento } from "@/lib/hooks/use-sentimiento";
import { PALETA_ACTIVA } from "@/lib/paletas-graficas";
import { guardarRangoRecordado, leerRangoRecordado } from "@/lib/rango-calendario-seleccionado";
import { cn } from "@/lib/utils";
import type { PuntoSerieSentimiento, SegmentoTonalidad } from "@/types";
import {
  CLAVE_ETIQUETA_TONALIDAD,
  formatearMenciones,
  formatearPorcentaje,
  SEGMENTOS_TONALIDAD,
} from "./constantes-tonalidad";
import { GraficaDonaSentimiento } from "./grafica-dona-sentimiento";
import {
  GraficaSerieSentimiento,
  type ModoSerieSentimiento,
} from "./grafica-serie-sentimiento";
import { GraficaTendenciaTonalidades } from "./grafica-tendencia-tonalidades";
import { ListaMencionesSentimiento } from "./lista-menciones-sentimiento";
import { ResumenIaSentimiento } from "./resumen-ia-sentimiento";

function formatearRango(inicio: string, fin: string): string {
  const opciones: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
  };
  const inicioFmt = new Date(`${inicio}T00:00:00`).toLocaleDateString(
    "es-MX",
    opciones,
  );
  const finFmt = new Date(`${fin}T00:00:00`).toLocaleDateString("es-MX", {
    ...opciones,
    year: "numeric",
  });
  return `${inicioFmt} – ${finFmt}`;
}

function TituloConAyuda({
  id,
  título,
  ayuda,
}: {
  id: string;
  título: string;
  ayuda: string;
}) {
  return (
    <div id={id} className="flex items-center gap-1.5">
      <CardTitle className="font-semibold text-text-primary">
        {título}
      </CardTitle>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-md text-text-muted transition-colors duration-150 hover:bg-bg-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.97]"
            aria-label={ayuda}
          >
            <InfoIcon className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {ayuda}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function LeyendaTonalidad({ segmentos }: { segmentos: SegmentoTonalidad[] }) {
  const tCommon = useTranslations("common");
  const porCategoría = Object.fromEntries(
    segmentos.map((s) => [s.categoría, s]),
  ) as Record<SegmentoTonalidad["categoría"], SegmentoTonalidad>;

  return (
    <ul className="flex min-w-0 flex-col justify-center gap-2.5">
      {SEGMENTOS_TONALIDAD.map((item) => {
        const segmento = porCategoría[item.categoría];
        if (!segmento) return null;
        return (
          <li key={item.categoría} className="flex items-start gap-2">
            <span
              className={cn("mt-1 size-2.5 shrink-0 rounded-sm", item.clase)}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-xs font-medium text-text-secondary">
                {tCommon(CLAVE_ETIQUETA_TONALIDAD[item.categoría])}
              </p>
              <p className="text-sm font-semibold tabular-nums text-text-primary">
                {formatearMenciones(segmento.valor)}
                <span className="ml-1.5 text-[11px] font-medium text-text-muted">
                  {formatearPorcentaje(segmento.porcentaje)}
                </span>
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function SelectorModoSerie({
  id,
  modo,
  onChange,
}: {
  id: string;
  modo: ModoSerieSentimiento;
  onChange: (modo: ModoSerieSentimiento) => void;
}) {
  const t = useTranslations("sentimentPage");
  const opciones: { valor: ModoSerieSentimiento; etiqueta: string }[] = [
    { valor: "porcentaje", etiqueta: t("unitPercent") },
    { valor: "menciones", etiqueta: t("unitCount") },
  ];

  return (
    <fieldset
      aria-label={t("chartUnit")}
      className="m-0 inline-flex max-w-full min-w-0 rounded-lg border border-border-default/60 p-0.5"
    >
      {opciones.map((opción) => {
        const activo = modo === opción.valor;
        return (
          <button
            key={opción.valor}
            id={activo ? id : undefined}
            type="button"
            aria-pressed={activo}
            onClick={() => onChange(opción.valor)}
            className={cn(
              "h-7 max-w-[9.5rem] truncate rounded-md px-2 text-[10px] font-semibold transition-colors duration-150 active:scale-[0.97]",
              activo
                ? "bg-bg-muted text-text-primary"
                : "text-text-muted hover:text-text-primary",
            )}
          >
            {opción.etiqueta}
          </button>
        );
      })}
    </fieldset>
  );
}

function TarjetaSerieSentimiento({
  id,
  título,
  ayuda,
  puntos,
  color,
}: {
  id: string;
  título: string;
  ayuda: string;
  puntos: PuntoSerieSentimiento[];
  color: string;
}) {
  const t = useTranslations("sentimentPage");
  const tMentions = useTranslations("mentions");
  const [modo, setModo] = useState<ModoSerieSentimiento>("porcentaje");

  return (
    <Card className="flex h-[320px] min-h-0 flex-col bg-bg-base p-4 shadow-widget">
      <CardHeader className="mb-1 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <TituloConAyuda id={id} título={título} ayuda={ayuda} />
          <p className="mt-1 text-xs text-text-muted">
            {t("periodVsPrevious")}
          </p>
        </div>
        <SelectorModoSerie id={`${id}-modo`} modo={modo} onChange={setModo} />
      </CardHeader>
      <ul className="mb-1 flex shrink-0 items-center gap-3 text-[10px] text-text-muted">
        <li className="flex items-center gap-1">
          <span
            className="size-1.5 rounded-full"
            style={{ backgroundColor: color }}
            aria-hidden
          />
          {tMentions("periodCurrent")}
        </li>
        <li className="flex items-center gap-1">
          <span
            className="h-px w-3 border-t border-dashed"
            style={{ borderColor: color }}
            aria-hidden
          />
          {tMentions("periodPrevious")}
        </li>
      </ul>
      <CardContent className="min-h-0 flex-1">
        <GraficaSerieSentimiento
          puntos={puntos}
          modo={modo}
          color={color}
          className="h-full"
        />
      </CardContent>
    </Card>
  );
}

function SkeletonSentimiento() {
  const t = useTranslations("sentimentPage");
  return (
    <output className="block space-y-4" aria-label={t("loading")}>
      <div className="grid gap-4 xl:grid-cols-12">
        <Skeleton className="h-[380px] rounded-lg xl:col-span-3" />
        <Skeleton className="h-[380px] rounded-lg xl:col-span-3" />
        <Skeleton className="h-[380px] rounded-lg xl:col-span-6" />
      </div>
      <Skeleton className="h-[320px] rounded-lg" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[320px] rounded-lg" />
        <Skeleton className="h-[320px] rounded-lg" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[420px] rounded-lg" />
        <Skeleton className="h-[420px] rounded-lg" />
      </div>
    </output>
  );
}

export function SentimientoVista() {
  const t = useTranslations("sentimentPage");
  const tCommon = useTranslations("common");
  const tMentions = useTranslations("mentions");
  // Selector multi-proyecto del sidebar: "un solo proyecto elegido" filtra;
  // "todos" o "2+" muestra sin filtrar (mismo criterio que Menciones).
  const { idUnicoOAgregado, proyectos, sinSeleccion } = useProyectosActivos();
  const [rango, setRango] = useState<{ inicio: string; fin: string } | null>(null);
  const { datos, cargando, error } = useSentimiento(idUnicoOAgregado, rango);

  function cambiarRango(nuevo: { inicio: string; fin: string } | null) {
    setRango(nuevo);
    guardarRangoRecordado(nuevo);
  }

  // Hereda el último rango de fechas elegido en Dashboard o Menciones — solo
  // al montar, igual que esas páginas (ver rango-calendario-seleccionado.ts).
  useEffect(() => {
    const recordado = leerRangoRecordado();
    if (recordado) setRango(recordado);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function crearHrefDetalle(sentimiento: "positivo" | "negativo") {
    const parámetros = new URLSearchParams();
    if (idUnicoOAgregado) parámetros.set("proyecto", idUnicoOAgregado);
    parámetros.set("sentimiento", sentimiento);
    return `/menciones/detalle?${parámetros.toString()}`;
  }

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
        <SkeletonSentimiento />
      ) : error || !datos ? (
        <Card className="border-error/30 bg-error/5 text-sm text-error">
          {error ?? t("error")}
        </Card>
      ) : (
        <div
          className={cn(
            "space-y-4 transition-opacity duration-200",
            cargando && "opacity-55",
          )}
        >
          <div className="grid gap-4 xl:grid-cols-12">
            <CalendarioMenciones
              className="h-[380px] xl:col-span-3"
              rangoInicial={rango}
              onRangoChange={cambiarRango}
              máximoDías={datos?.límiteHistórico?.activo ? datos.límiteHistórico.días : null}
            />

            <Card className="@container flex min-h-[380px] flex-col bg-bg-base p-4 shadow-widget xl:col-span-3">
              <CardHeader className="mb-1 flex flex-row items-start justify-between gap-3">
                <div>
                  <TituloConAyuda
                    id="desglose-tonalidad"
                    título={t("breakdown")}
                    ayuda={t("breakdownHelp")}
                  />
                  <p className="mt-1 text-xs text-text-muted">
                    {formatearRango(datos.período.inicio, datos.período.fin)}
                  </p>
                </div>
              </CardHeader>
              {/* Antes usaba `sm:` (ancho de VENTANA) para decidir dona+leyenda
                  lado a lado — pero esta tarjeta vive en una columna de grid
                  (xl:col-span-3, ver el fix de "espacio en blanco" del mismo
                  día) cuyo ancho REAL no tiene nada que ver con el de la
                  ventana: con ventana ancha pero columna angosta, igual
                  forzaba el layout de 2 columnas y la dona quedaba aplastada
                  en el poco espacio que le tocaba (reportado por el cliente,
                  2026-10-02). `@container` responde al ancho real de ESTA
                  tarjeta, no al de la ventana — y minmax(9rem,...) le pone un
                  piso real a la dona para que nunca se encoja a casi nada
                  dentro de esas 2 columnas.
                  REGRESIÓN encontrada el mismo día: el breakpoint estándar
                  `@sm` (384px) resultó más ancho que el contenido real de
                  esta tarjeta, así que nunca se activaba — caía siempre al
                  fallback de 1 columna (dona + leyenda apiladas), que
                  desbordaba la altura FIJA de la tarjeta (antes h-[380px]) y
                  la leyenda se salía por debajo del borde, encimándose con la
                  siguiente sección. Dos arreglos, no solo ajustar el número:
                  (1) @[20rem] en vez de @sm — el mínimo real que piden las 2
                  columnas es 18.25rem (9+8.5+gap-3); (2) más robusto, la
                  tarjeta pasó de altura FIJA a min-h-[380px] y CardContent ya
                  no tiene `min-h-0` — así, si el contenido alguna vez
                  necesita más espacio del esperado (por el motivo que sea,
                  sin depender de adivinar el ancho exacto del contenedor), la
                  tarjeta CRECE para contenerlo en vez de desbordarse hacia
                  afuera. No pude verificarlo en un navegador real — pedir
                  confirmación visual al cliente. */}
              <CardContent className="grid flex-1 grid-cols-1 items-center gap-3 @[20rem]:grid-cols-[minmax(9rem,1.15fr)_minmax(8.5rem,0.85fr)]">
                <GraficaDonaSentimiento
                  segmentos={datos.desglose}
                  className="h-full min-h-[220px]"
                />
                <LeyendaTonalidad segmentos={datos.desglose} />
              </CardContent>
            </Card>

            <Card className="flex h-[380px] min-h-0 flex-col bg-bg-base p-4 shadow-widget xl:col-span-6">
              <CardHeader className="mb-1">
                <TituloConAyuda
                  id="tendencia-tonalidades"
                  título={t("tonesTrend")}
                  ayuda={t("tonesTrendHelp")}
                />
                <p className="mt-1 text-xs text-text-muted">
                  {tMentions("trendHelp")}
                </p>
              </CardHeader>
              <ul className="mb-1 flex shrink-0 flex-wrap gap-x-3 gap-y-1 text-[10px] text-text-muted">
                {SEGMENTOS_TONALIDAD.map((item) => (
                  <li key={item.categoría} className="flex items-center gap-1">
                    <span
                      className={cn("size-1.5 rounded-full", item.clase)}
                      aria-hidden
                    />
                    {tCommon(CLAVE_ETIQUETA_TONALIDAD[item.categoría])}
                  </li>
                ))}
              </ul>
              <CardContent className="min-h-0 flex-1">
                <GraficaTendenciaTonalidades
                  puntos={datos.tendenciaTonalidad}
                  className="h-full"
                />
              </CardContent>
            </Card>
          </div>

          <Card className="flex h-[320px] min-h-0 flex-col bg-bg-base p-4 shadow-widget">
            <CardHeader className="mb-1">
              <TituloConAyuda
                id="tonalidad-fuente"
                título={t("toneBySource")}
                ayuda={t("toneBySourceHelp")}
              />
              <p className="mt-1 text-xs text-text-muted">
                {t("relativeShare")}
              </p>
            </CardHeader>
            <ul className="mb-1 flex shrink-0 flex-wrap gap-x-3 gap-y-1 text-[10px] text-text-muted">
              {SEGMENTOS_TONALIDAD.map((item) => (
                <li key={item.categoría} className="flex items-center gap-1">
                  <span
                    className={cn("size-1.5 rounded-full", item.clase)}
                    aria-hidden
                  />
                  {tCommon(CLAVE_ETIQUETA_TONALIDAD[item.categoría])}
                </li>
              ))}
            </ul>
            <CardContent className="min-h-0 flex-1">
              <GraficaTonalidadFuente
                fuentes={datos.tonalidadPorFuente}
                className="h-full"
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <TarjetaSerieSentimiento
              id="serie-positivo"
              título={t("positiveTitle")}
              ayuda={t("positiveHelp")}
              puntos={datos.seriePositivo}
              color={PALETA_ACTIVA.positivo.plano}
            />
            <TarjetaSerieSentimiento
              id="serie-negativo"
              título={t("negativeTitle")}
              ayuda={t("negativeHelp")}
              puntos={datos.serieNegativo}
              color={PALETA_ACTIVA.negativo.plano}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ListaMencionesSentimiento
              título={tMentions("positive")}
              descripción={t("positiveListDesc")}
              menciones={datos.mencionesPositivas}
              hrefVerMas={crearHrefDetalle("positivo")}
              className="h-[420px]"
            />
            <ListaMencionesSentimiento
              título={tMentions("negative")}
              descripción={t("negativeListDesc")}
              menciones={datos.mencionesNegativas}
              hrefVerMas={crearHrefDetalle("negativo")}
              className="h-[420px]"
            />
          </div>

          <ResumenIaSentimiento
            datos={datos}
            nombreProyecto={
              proyectos.find((proyecto) => proyecto.id === idUnicoOAgregado)
                ?.nombre ?? null
            }
          />
        </div>
      )}
    </div>
  );
}
