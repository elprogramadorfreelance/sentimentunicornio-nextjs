"use client";

import { ArrowUpIcon, ClockIcon, ExternalLinkIcon, FileTextIcon, FolderPlusIcon, NewspaperIcon, RefreshCwIcon, ScanSearchIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { ComponentType, FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge, Button, Card, Label, MultiSelect, Progress, Skeleton } from "@/components/ui";
import { localeBcp47 } from "@/i18n/config";
import { apiAnalizarBusqueda, apiCrearReglaAlerta, apiListarProyectos } from "@/lib/api";
import { useBusqueda } from "@/lib/hooks/use-busqueda";
import type { ReporteBusquedaReal } from "@/lib/exportar-reporte-busqueda";
import { ModalReglaAlerta } from "@/components/reglas-alerta";
import type { CategoríaSentimiento, MenciónEditorial, Proyecto, TipoFuenteMención } from "@/types";
import { AccionesBusqueda } from "./acciones-busqueda";
import { ModalAnalisisBusqueda } from "./modal-analisis-busqueda";

const BADGE_SENTIMIENTO: Record<CategoríaSentimiento, "positivo" | "neutral" | "negativo"> = {
  positivo: "positivo",
  neutral: "neutral",
  negativo: "negativo",
};

function IconoFuente({ tipo }: { tipo: TipoFuenteMención }) {
  const Icono = tipo === "noticias" ? NewspaperIcon : FileTextIcon;
  return <Icono className="size-4" />;
}

function EstadoVacíoBusqueda({
  icono: Icono,
  título,
  descripción,
  acción,
}: {
  icono: ComponentType<{ className?: string }>;
  título: string;
  descripción: string;
  acción?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border-default px-4 py-8 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-bg-subtle text-text-muted" aria-hidden>
        <Icono className="size-5" />
      </span>
      <p className="text-sm font-semibold text-text-primary">{título}</p>
      <p className="max-w-sm text-xs leading-relaxed text-text-muted">{descripción}</p>
      {acción}
    </div>
  );
}

function ResultadoBusquedaFila({ resultado }: { resultado: MenciónEditorial }) {
  const tBenchmarking = useTranslations("benchmarking");
  const locale = useLocale();
  const etiquetaFuente: Record<TipoFuenteMención, string> = {
    x: "X",
    facebook: "Facebook",
    instagram: "Instagram",
    youtube: "YouTube",
    tiktok: "TikTok",
    noticias: tBenchmarking("categoryNews"),
    blogs: tBenchmarking("categoryBlogs"),
  };
  return (
    <li className="py-4 first:pt-0">
      <Link
        href={resultado.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:gap-4"
      >
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-subtle text-text-secondary" aria-hidden>
          <IconoFuente tipo={resultado.tipoFuente} />
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {resultado.sentimientoClasificado !== false && (
              <Badge variante={BADGE_SENTIMIENTO[resultado.sentimiento]} className="rounded-md px-1.5 py-0 text-[10px]">
                {resultado.sentimiento}
              </Badge>
            )}
            <span className="text-xs font-medium text-text-secondary">
              {resultado.fuente} · {etiquetaFuente[resultado.tipoFuente]}
            </span>
          </div>
          <p className="mt-1.5 text-sm font-semibold leading-snug text-text-primary group-hover:text-primary">{resultado.título}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-text-muted">{resultado.extracto}</p>
          <p className="mt-2 truncate text-[11px] text-text-muted">{new URL(resultado.url).hostname.replace("www.", "")}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5 text-right">
          <time dateTime={resultado.publicadaEn} className="text-[11px] text-text-muted tabular-nums">
            {new Date(resultado.publicadaEn).toLocaleDateString(localeBcp47(locale), { day: "2-digit", month: "short", year: "numeric" })}
          </time>
          <ExternalLinkIcon className="size-3.5 text-text-muted group-hover:text-primary" />
        </div>
      </Link>
    </li>
  );
}

function FilaEsqueleto() {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3 border-t border-border-default/60 py-4 sm:gap-4" aria-hidden>
      <Skeleton className="size-9 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
      </div>
      <Skeleton className="h-3 w-14" />
    </div>
  );
}

export function BusquedaVista() {
  const t = useTranslations("searchPage");
  const tCommon = useTranslations("common");
  const tProjects = useTranslations("projects");
  const tAlerts = useTranslations("alerts");
  const [valor, setValor] = useState("");
  const [proyectoIds, setProyectoIds] = useState<string[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [cargandoProyectos, setCargandoProyectos] = useState(true);
  const [errorProyectos, setErrorProyectos] = useState<string | null>(null);
  const [modalAlertaAbierto, setModalAlertaAbierto] = useState(false);
  const [guardandoAlerta, setGuardandoAlerta] = useState(false);
  const [reporte, setReporte] = useState<ReporteBusquedaReal | null>(null);
  const [modalAnalisisAbierto, setModalAnalisisAbierto] = useState(false);
  const [analizando, setAnalizando] = useState(false);
  const { estado, progreso, datos, resultados, total, hayMás, cargandoMás, error, historial, buscar, cargarMás, limpiar, reintentar } =
    useBusqueda();

  const scrollRef = useRef<HTMLElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const cargarProyectos = useCallback(async () => {
    setCargandoProyectos(true);
    setErrorProyectos(null);
    try {
      const data = await apiListarProyectos();
      setProyectos(data.proyectos.filter((p) => p.estado === "activo"));
    } catch (errorDesconocido) {
      setErrorProyectos(errorDesconocido instanceof Error ? errorDesconocido.message : t("loadProjectsFallback"));
    } finally {
      setCargandoProyectos(false);
    }
  }, []);

  useEffect(() => {
    void cargarProyectos();
  }, [cargarProyectos]);

  const proyectosSeleccionados = useMemo(() => proyectos.filter((p) => proyectoIds.includes(p.id)), [proyectoIds, proyectos]);

  useEffect(() => {
    if (estado !== "listo") return;
    const raíz = scrollRef.current;
    const sentinela = sentinelRef.current;
    if (!raíz || !sentinela) return;
    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) void cargarMás();
      },
      { root: raíz, rootMargin: "0px 0px 160px 0px" },
    );
    observador.observe(sentinela);
    return () => observador.disconnect();
  }, [estado, cargarMás]);

  function alEnviar(evento: FormEvent) {
    evento.preventDefault();
    setReporte(null);
    void buscar(valor, proyectoIds);
  }

  function usarSugerencia(sugerencia: string) {
    setValor(sugerencia);
    setReporte(null);
    void buscar(sugerencia, proyectoIds);
  }

  async function analizarConversación() {
    if (!datos) return;
    setAnalizando(true);
    try {
      const análisis = await apiAnalizarBusqueda(datos.consulta);
      setReporte({
        consulta: datos.consulta,
        generadoEn: new Date().toISOString(),
        totalResultados: total,
        totalFuentes: datos.totalFuentes,
        nivelRiesgo: análisis.risk_level || "Bajo",
        sentimiento: {
          positivo: análisis.sentiment?.positive ?? 0,
          negativo: análisis.sentiment?.negative ?? 0,
          neutral: análisis.sentiment?.neutral ?? 0,
        },
        resumenEjecutivo: análisis.executive_summary?.trim() || "",
        narrativas: (análisis.narratives || []).map((n) => ({
          nombre: n.name || "(Sin nombre)",
          menciones: n.mentions || "",
          sentimiento: n.sentiment || "Neutral",
          riesgo: n.risk || "",
          tendencia: n.trend || "",
        })),
        recomendaciones: (análisis.recommendations || []).filter(Boolean),
        hashtags: (análisis.hashtags || []).filter(Boolean),
        resultados,
      });
      setModalAnalisisAbierto(true);
    } catch (errorDesconocido) {
      toast.error(t("analyzeError"), {
        description: errorDesconocido instanceof Error ? errorDesconocido.message : tCommon("tryAgain"),
      });
    } finally {
      setAnalizando(false);
    }
  }

  async function crearAlerta(datosRegla: { tipo: "keyword" | "narrativa"; valor: string; fechaInicio: string; fechaFin: string }) {
    const proyectoDestino = proyectosSeleccionados[0];
    if (!proyectoDestino) return;
    setGuardandoAlerta(true);
    try {
      await apiCrearReglaAlerta({ proyectoId: proyectoDestino.id, ...datosRegla });
      toast.success(tAlerts("configured"), {
        description: t("alertConfiguredDescOurs", { project: proyectoDestino.nombre }),
      });
      setModalAlertaAbierto(false);
    } catch (errorDesconocido) {
      toast.error(t("alertCreateError"), {
        description: errorDesconocido instanceof Error ? errorDesconocido.message : tCommon("tryAgain"),
      });
    } finally {
      setGuardandoAlerta(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-text-primary">{t("title")}</h1>
        <p className="mt-1 text-sm text-text-muted">{t("subtitleOurs")}</p>
      </header>

      <Card className="bg-bg-base p-4 shadow-widget sm:p-5">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
          <div className="grid min-w-0 content-start gap-2">
            <Label>{t("associateProjectOptional")}</Label>
            <MultiSelect
              opciones={proyectos.map((p) => ({ value: p.id, label: p.nombre }))}
              value={proyectoIds}
              onChange={setProyectoIds}
              placeholder={cargandoProyectos ? tProjects("loading") : t("noneSelected")}
              mostrarSeleccionarTodos
              className="min-h-12"
            />
          </div>

          <form onSubmit={alEnviar} className="grid content-start gap-2">
            <Label htmlFor="consulta-busqueda">{t("searchTopicLabel")}</Label>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-text-muted" aria-hidden />
              <input
                id="consulta-busqueda"
                type="text"
                value={valor}
                onChange={(e) => {
                  setValor(e.target.value);
                  setReporte(null);
                }}
                placeholder={t("searchPlaceholderOurs")}
                autoComplete="off"
                className="h-12 w-full rounded-lg border border-border-default bg-bg-base pr-14 pl-11 text-sm text-text-primary transition-colors placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
              <button
                type="submit"
                disabled={!valor.trim() || estado === "buscando"}
                aria-label={tCommon("search")}
                className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg bg-primary text-primary-fg transition-colors duration-300 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowUpIcon className="size-4" />
              </button>
            </div>
          </form>
        </div>

        {historial.length > 0 && estado !== "buscando" && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wide text-text-muted uppercase">{t("recent")}</span>
            {historial.map((item) => (
              <button
                key={`historial-${item}`}
                type="button"
                onClick={() => usarSugerencia(item)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border-default bg-bg-subtle px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
              >
                <ClockIcon className="size-3.5 text-text-muted" />
                {item}
              </button>
            ))}
          </div>
        )}

        {errorProyectos && (
          <p className="mt-3 text-xs text-error">{errorProyectos}</p>
        )}

        <AccionesBusqueda
          puedeAnalizar={estado === "listo" && resultados.length > 0}
          puedeCrearAlertas={estado === "listo" && proyectosSeleccionados.length > 0}
          generando={analizando}
          onAnalizar={() => void analizarConversación()}
          onCrearAlerta={() => setModalAlertaAbierto(true)}
        />
      </Card>

      {estado === "buscando" && (
        <Card className="bg-bg-base p-6 shadow-widget">
          <p className="text-sm font-medium text-text-primary">{t("searchingRealtime")}</p>
          <p className="mt-1 text-xs text-text-muted">{t("searchingRealtimeHint")}</p>
          <Progress value={progreso} className="mt-4" />
          <p className="mt-2 text-right text-[11px] font-medium text-text-muted tabular-nums">{Math.round(progreso)}%</p>
        </Card>
      )}

      {estado === "error" && (
        <Card className="flex flex-col items-start gap-3 border-error/30 bg-error/5">
          <p className="text-sm text-error">{error ?? t("searchErrorOurs")}</p>
          <Button type="button" variant="outline" size="sm" onClick={reintentar}>
            <RefreshCwIcon className="size-4" />
            {tCommon("retry")}
          </Button>
        </Card>
      )}

      {estado === "vacío" && (
        <EstadoVacíoBusqueda
          icono={SearchIcon}
          título={t("emptySearchOurs")}
          descripción={t("emptySearchOursHint")}
        />
      )}

      {estado === "listo" && datos && (
        <Card className="overflow-hidden bg-bg-base p-0 shadow-widget">
          <div className="flex flex-col gap-1 border-b border-border-default/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h2 className="text-base font-semibold text-text-primary">{t("resultsRealtime")}</h2>
              <p className="mt-0.5 text-xs text-text-muted">{t("resultsQuery", { query: datos.consulta })}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Badge variante="default">{t("sourcesCount", { count: datos.totalFuentes })}</Badge>
              <span aria-live="polite" aria-atomic="true">
                {t("resultsCount", { count: resultados.length, total })}
              </span>
            </div>
          </div>

          {resultados.length === 0 ? (
            <div className="p-4 sm:p-5">
              <EstadoVacíoBusqueda
                icono={ScanSearchIcon}
                título={t("noResults", { query: datos.consulta })}
                descripción={t("noResultsHintOurs")}
              />
            </div>
          ) : (
            <section
              ref={scrollRef}
              aria-label={t("results")}
              aria-busy={cargandoMás}
              // biome-ignore lint/a11y/noNoninteractiveTabindex: la región desplazable debe ser alcanzable con teclado
              tabIndex={0}
              className="h-[24rem] overflow-y-auto overscroll-contain px-4 pt-4 pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent sm:h-[26rem] sm:px-5"
            >
              <ul className="divide-y divide-border-default/60">
                {resultados.map((resultado) => (
                  <ResultadoBusquedaFila key={resultado.id} resultado={resultado} />
                ))}
              </ul>
              {cargandoMás && (
                <>
                  <FilaEsqueleto />
                  <FilaEsqueleto />
                </>
              )}
              {!hayMás && (
                <p className="border-t border-border-default/60 py-4 text-center text-xs text-text-muted">
                  {t("endOfResults", { total })}
                </p>
              )}
              <div ref={sentinelRef} className="h-px" aria-hidden />
            </section>
          )}
        </Card>
      )}

      {proyectos.length === 0 && !cargandoProyectos && (
        <EstadoVacíoBusqueda
          icono={FolderPlusIcon}
          título={t("noProjects")}
          descripción={t("noProjectsHintOurs")}
          acción={
            <Button asChild size="sm" className="mt-2">
              <Link href="/dashboard">{t("createProject")}</Link>
            </Button>
          }
        />
      )}

      <ModalAnalisisBusqueda abierto={modalAnalisisAbierto} onAbiertoChange={setModalAnalisisAbierto} reporte={reporte} />

      <ModalReglaAlerta
        abierto={modalAlertaAbierto}
        onAbiertoChange={setModalAlertaAbierto}
        guardando={guardandoAlerta}
        onGuardar={crearAlerta}
        valorInicial={valor}
      />
    </div>
  );
}
