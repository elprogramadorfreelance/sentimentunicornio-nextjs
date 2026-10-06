"use client";

import { InfoIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  Label,
  MultiSelect,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui";
import { apiBenchmarking } from "@/lib/api";
import type { RespuestaBenchmarking } from "@/types";
import { GraficaBarrasApiladasProyecto } from "./grafica-barras-apiladas-proyecto";
import { GraficaDonaComparativa } from "./grafica-dona-comparativa";
import { GraficaLineaComparativa } from "./grafica-linea-comparativa";
import { ResumenIaBenchmarking } from "./resumen-ia-benchmarking";
import { TablaComparativaBenchmarking } from "./tabla-comparativa-benchmarking";
import { PALETA_ACTIVA } from "@/lib/paletas-graficas";

const PARAM_PROYECTOS = "proyectos";

type BenchmarkingVistaProps = {
  proyectos: { id: string; nombre: string }[];
  proyectosIniciales: string[];
  // Cuentas plan "basic" (Demo) solo pueden comparar contra 1 competidor —
  // congruente con el límite de 1 proyecto nuevo del resto de la app.
  // undefined/null = sin límite (planes pro/enterprise).
  máximoProyectos?: number | null;
};

function TituloConAyuda({ id, título, ayuda }: { id: string; título: string; ayuda: string }) {
  return (
    <div id={id} className="flex min-w-0 items-center gap-1.5">
      <CardTitle className="min-w-0 font-semibold text-text-primary">{título}</CardTitle>
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

/**
 * Comparación real entre 2+ proyectos — misma estructura que la referencia de
 * Bruno (tabla comparativa, resumen IA, 4 tendencias, 2 donas, 2 barras
 * apiladas), calculada de las menciones reales de cada proyecto. Se omiten
 * "Presence Score" y "AVE" de la referencia: son métricas de PR que
 * requieren una fórmula propia o tarifas publicitarias reales que no
 * tenemos — se prefirió no inventar un puntaje o un valor en pesos sin base
 * real (decisión explícita, no un recorte silencioso).
 */
export function BenchmarkingVista({ proyectos, proyectosIniciales, máximoProyectos = null }: BenchmarkingVistaProps) {
  const t = useTranslations("benchmarking");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [proyectoIds, setProyectoIds] = useState(proyectosIniciales);
  const [datos, setDatos] = useState<RespuestaBenchmarking | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (proyectoIds.length < 2) {
      setDatos(null);
      setError(null);
      return;
    }
    let cancelado = false;
    setCargando(true);
    setError(null);
    apiBenchmarking(proyectoIds)
      .then((respuesta) => {
        if (!cancelado) setDatos(respuesta);
      })
      .catch((err: unknown) => {
        if (!cancelado) {
          setError(err instanceof Error ? err.message : t("loadError"));
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [proyectoIds]);

  function cambiarProyectos(idsNuevos: string[]) {
    // Cuentas con tope (Demo): si ya se alcanzó el máximo y se intenta
    // agregar uno más, se ignora el intento en vez de dejar seleccionar de
    // más y fallar en silencio más adelante.
    const ids =
      máximoProyectos != null && idsNuevos.length > máximoProyectos
        ? proyectoIds
        : idsNuevos;
    setProyectoIds(ids);
    const params = new URLSearchParams();
    if (ids.length > 0) params.set(PARAM_PROYECTOS, ids.join(","));
    const query = params.get(PARAM_PROYECTOS) ? `?${params.toString()}` : "";
    router.replace(`/monitoreo/benchmarking${query}`, { scroll: false });
  }

  const opciones = proyectos.map((proyecto) => ({ value: proyecto.id, label: proyecto.nombre }));

  const seriesProyectos = useMemo(
    () => datos?.proyectos.map((p) => ({ id: p.proyectoId, nombre: p.nombre, color: p.color })) ?? [],
    [datos],
  );

  const filasTonalidad = useMemo(
    () =>
      datos?.tonalidad.map((item) => ({
        proyecto: item.nombre,
        valores: {
          neutral: item.neutral,
          positivo: item.positivo,
          negativo: item.negativo,
          sinCalificar: item.sinCalificar,
        },
      })) ?? [],
    [datos],
  );

  const filasCategorías = useMemo(
    () =>
      datos?.categorías.map((item) => ({
        proyecto: item.nombre,
        valores: {
          x: item.x,
          facebook: item.facebook,
          instagram: item.instagram,
          tiktok: item.tiktok,
          noticias: item.noticias,
          youtube: item.youtube,
          blogs: item.blogs,
        },
      })) ?? [],
    [datos],
  );

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("title")}</h1>
          <p className="mt-1 text-sm text-text-muted">{t("subtitleLong")}</p>
        </div>

        <div className="w-full sm:w-80">
          <Label className="mb-1.5 block text-[10px] font-semibold tracking-wider text-text-muted uppercase">
            {tCommon("projects")}
          </Label>
          <MultiSelect
            opciones={opciones}
            value={proyectoIds}
            onChange={cambiarProyectos}
            placeholder={t("selectProjects")}
          />
          {máximoProyectos != null && (
            <p className="mt-1 text-[10px] text-text-muted">
              {t("competitorLimitNotice", { max: máximoProyectos })}
            </p>
          )}
        </div>
      </header>

      {proyectoIds.length < 2 ? (
        <Card className="border-dashed bg-bg-base px-6 py-12 text-center shadow-widget">
          <p className="text-sm font-medium text-text-primary">{t("selectAtLeastTwo")}</p>
          <p className="mt-1 text-sm text-text-muted">{t("selectHint")}</p>
        </Card>
      ) : cargando && !datos ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-48 rounded-lg lg:col-span-2" />
          <Skeleton className="h-64 rounded-lg lg:col-span-2" />
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      ) : error ? (
        <Card className="border-error/30 bg-error/5 p-4 text-sm text-error">{error}</Card>
      ) : datos ? (
        <>
          <ResumenIaBenchmarking datos={datos} />

          <TablaComparativaBenchmarking proyectos={datos.proyectos} />

          <div className="grid min-w-0 gap-4 lg:grid-cols-2">
            <Card className="flex min-h-[22rem] min-w-0 flex-col overflow-hidden bg-bg-base p-4 shadow-widget">
              <CardHeader className="mb-2">
                <TituloConAyuda
                  id="tendencia-menciones"
                  título={t("mentionsTrend")}
                  ayuda={t("mentionsTrendHelp")}
                />
              </CardHeader>
              <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
                <GraficaLineaComparativa
                  puntos={datos.tendenciaMenciones}
                  proyectos={seriesProyectos}
                  ariaLabel={t("mentionsTrendAria")}
                />
              </div>
            </Card>

            <Card className="flex min-h-[22rem] min-w-0 flex-col overflow-hidden bg-bg-base p-4 shadow-widget">
              <CardHeader className="mb-2">
                <TituloConAyuda
                  id="tendencia-alcance"
                  título={t("reachTrend")}
                  ayuda={t("reachTrendHelp")}
                />
              </CardHeader>
              <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
                <GraficaLineaComparativa
                  puntos={datos.tendenciaAlcance}
                  proyectos={seriesProyectos}
                  ariaLabel={t("reachTrendAria")}
                />
              </div>
            </Card>

            <Card className="flex min-h-[22rem] min-w-0 flex-col overflow-hidden bg-bg-base p-4 shadow-widget">
              <CardHeader className="mb-2">
                <TituloConAyuda
                  id="tendencia-sentimiento-positivo"
                  título={t("positiveSentimentTrend")}
                  ayuda={t("positiveSentimentTrendHelp")}
                />
              </CardHeader>
              <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
                <GraficaLineaComparativa
                  puntos={datos.tendenciaSentimientoPositivo}
                  proyectos={seriesProyectos}
                  formato="porcentaje"
                  ariaLabel={t("positiveSentimentTrendAria")}
                />
              </div>
            </Card>

            <Card className="flex min-h-[22rem] min-w-0 flex-col overflow-hidden bg-bg-base p-4 shadow-widget">
              <CardHeader className="mb-2">
                <TituloConAyuda
                  id="tendencia-sentimiento-negativo"
                  título={t("negativeSentimentTrend")}
                  ayuda={t("negativeSentimentTrendHelp")}
                />
              </CardHeader>
              <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
                <GraficaLineaComparativa
                  puntos={datos.tendenciaSentimientoNegativo}
                  proyectos={seriesProyectos}
                  formato="porcentaje"
                  ariaLabel={t("negativeSentimentTrendAria")}
                />
              </div>
            </Card>

            <Card className="flex min-h-[22rem] min-w-0 flex-col bg-bg-base p-4 shadow-widget">
              <CardHeader className="mb-2">
                <TituloConAyuda
                  id="share-voz-alcance"
                  título={t("shareOfVoiceReach")}
                  ayuda={t("shareOfVoiceReachHelp")}
                />
              </CardHeader>
              <div className="min-h-0 min-w-0 flex-1">
                <GraficaDonaComparativa
                  segmentos={datos.proyectos.map((p) => ({
                    id: p.proyectoId,
                    nombre: p.nombre,
                    valor: p.alcanceRedesSociales + p.alcanceFueraRedes,
                    color: p.color,
                  }))}
                  etiquetaCentro={tCommon("reach")}
                  ariaLabel={t("shareOfVoiceReachAria")}
                />
              </div>
            </Card>

            <Card className="flex min-h-[22rem] min-w-0 flex-col bg-bg-base p-4 shadow-widget">
              <CardHeader className="mb-2">
                <TituloConAyuda
                  id="share-voz-menciones"
                  título={t("shareOfVoiceMentions")}
                  ayuda={t("shareOfVoiceMentionsHelp")}
                />
              </CardHeader>
              <div className="min-h-0 min-w-0 flex-1">
                <GraficaDonaComparativa
                  segmentos={datos.proyectos.map((p) => ({
                    id: p.proyectoId,
                    nombre: p.nombre,
                    valor: p.mencionesTotales,
                    color: p.color,
                  }))}
                  etiquetaCentro={tCommon("mentions")}
                  ariaLabel={t("shareOfVoiceMentionsAria")}
                />
              </div>
            </Card>

            <Card className="flex min-h-[22rem] min-w-0 flex-col bg-bg-base p-4 shadow-widget">
              <CardHeader className="mb-2">
                <TituloConAyuda
                  id="desglose-sentimiento"
                  título={t("sentimentBreakdown")}
                  ayuda={t("sentimentBreakdownHelp")}
                />
              </CardHeader>
              {/* Sin overflow-hidden aquí: Nivo dibuja el tooltip como hijo normal
                  del contenedor (no en un portal), así que recortar el overflow
                  cortaba el tooltip de las filas de arriba, que necesitan salirse
                  hacia arriba del contenedor para no taparse con la barra. */}
              <div className="min-h-0 min-w-0 flex-1">
                <GraficaBarrasApiladasProyecto
                  filas={filasTonalidad}
                  claves={[
                    { clave: "neutral", color: PALETA_ACTIVA.neutro.plano, etiqueta: tCommon("neutralShort") },
                    { clave: "positivo", color: PALETA_ACTIVA.positivo.plano, etiqueta: tCommon("positive") },
                    { clave: "negativo", color: PALETA_ACTIVA.negativo.plano, etiqueta: tCommon("negative") },
                    { clave: "sinCalificar", color: "var(--color-sky)", etiqueta: tCommon("unrated") },
                  ]}
                  ariaLabel={t("sentimentBreakdownAria")}
                />
              </div>
            </Card>

            <Card className="flex min-h-[22rem] min-w-0 flex-col overflow-hidden bg-bg-base p-4 shadow-widget">
              <CardHeader className="mb-2">
                <TituloConAyuda
                  id="compartir-categorias"
                  título={t("categoriesShare")}
                  ayuda={t("categoriesShareHelp")}
                />
              </CardHeader>
              <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
                <GraficaBarrasApiladasProyecto
                  filas={filasCategorías}
                  claves={[
                    { clave: "x", color: PALETA_ACTIVA.categorica[0].plano, etiqueta: "X" },
                    { clave: "facebook", color: PALETA_ACTIVA.categorica[1].plano, etiqueta: "Facebook" },
                    { clave: "instagram", color: PALETA_ACTIVA.categorica[2].plano, etiqueta: "Instagram" },
                    { clave: "tiktok", color: PALETA_ACTIVA.categorica[3].plano, etiqueta: "TikTok" },
                    { clave: "noticias", color: PALETA_ACTIVA.categorica[4].plano, etiqueta: t("categoryNews") },
                    { clave: "youtube", color: PALETA_ACTIVA.categorica[5].plano, etiqueta: "YouTube" },
                    { clave: "blogs", color: PALETA_ACTIVA.categorica[0].plano, etiqueta: t("categoryBlogs") },
                  ]}
                  ariaLabel={t("categoriesShareAria")}
                />
              </div>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
