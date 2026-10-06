"use client";

import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useDeferredValue, useMemo, useState } from "react";
import {
  Breadcrumbs,
  Card,
  Input,
  MultiSelect,
  type OpcionMultiSelect,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@/components/ui";
import { useMencionesDetalle } from "@/lib/hooks/use-menciones-detalle";
import type { CategoríaSentimiento, TipoFuenteMención } from "@/types";
import { ColumnaMencionesDetalle } from "./columna-menciones-detalle";

const VALOR_TODOS = "todos";
const REDES: OpcionMultiSelect[] = [
  { value: "x", label: "X" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
];
type MencionesDetalleVistaProps = {
  proyectos: { id: string; nombre: string }[];
  proyectoInicialId: string | null;
  sentimientoInicial: CategoríaSentimiento | null;
};

function SkeletonColumnas({ fuentes }: { fuentes: TipoFuenteMención[] }) {
  const t = useTranslations("mentions");
  return (
    <output
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
      aria-label={t("loading")}
    >
      {fuentes.map((fuente) => (
        <div key={fuente} className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Skeleton className="size-7 rounded-lg" />
            <Skeleton className="h-4 w-28 rounded" />
          </div>
          {["uno", "dos", "tres"].map((id) => (
            <Skeleton key={id} className="h-48 rounded-lg" />
          ))}
        </div>
      ))}
    </output>
  );
}

export function MencionesDetalleVista({
  proyectos,
  proyectoInicialId,
  sentimientoInicial,
}: MencionesDetalleVistaProps) {
  const t = useTranslations("mentions");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [proyectoId, setProyectoId] = useState(proyectoInicialId);
  const [búsqueda, setBúsqueda] = useState("");
  const búsquedaDiferida = useDeferredValue(búsqueda);
  const [redes, setRedes] = useState<string[]>(["x", "facebook", "instagram"]);
  const [medios, setMedios] = useState<string[]>(["noticias"]);
  const mediosOpciones = useMemo<OpcionMultiSelect[]>(
    () => [
      { value: "noticias", label: t("digitalNews") },
      { value: "blogs", label: t("blogsOpinion") },
    ],
    [t],
  );
  const nombreFuente = useMemo(
    () =>
      new Map(
        [...REDES, ...mediosOpciones].map((fuente) => [
          fuente.value as TipoFuenteMención,
          fuente.label,
        ]),
      ),
    [mediosOpciones],
  );
  const fuentes = useMemo(
    () => [...redes, ...medios] as TipoFuenteMención[],
    [redes, medios],
  );
  const {
    columnas,
    cargadas,
    total,
    totalPorFuente,
    cargandoInicial,
    error,
    cargarMás,
  } = useMencionesDetalle({
    proyectoId,
    búsqueda: búsquedaDiferida,
    fuentes,
    sentimiento: sentimientoInicial,
  });

  function cambiarProyecto(valor: string) {
    const siguienteId = valor === VALOR_TODOS ? null : valor;
    setProyectoId(siguienteId);
    const parámetros = new URLSearchParams();
    if (siguienteId) parámetros.set("proyecto", siguienteId);
    if (sentimientoInicial) {
      parámetros.set("sentimiento", sentimientoInicial);
    }
    const consulta = parámetros.toString();
    router.replace(
      consulta ? `/menciones/detalle?${consulta}` : "/menciones/detalle",
      {
        scroll: false,
      },
    );
  }

  const mencionesPorFuente = useMemo(
    () =>
      fuentes.map((fuente) => ({
        fuente,
        nombre: nombreFuente.get(fuente) ?? fuente,
        menciones: columnas[fuente]?.menciones ?? [],
        total: totalPorFuente[fuente] ?? 0,
        hayMás: columnas[fuente]?.hayMás ?? false,
        cargandoMás: columnas[fuente]?.cargandoMás ?? false,
      })),
    [fuentes, columnas, totalPorFuente, nombreFuente],
  );
  const columnasVisibles = búsquedaDiferida.trim()
    ? mencionesPorFuente.filter((columna) => columna.menciones.length > 0)
    : mencionesPorFuente;
  const título =
    sentimientoInicial === "positivo"
      ? t("detailTitlePositive")
      : sentimientoInicial === "negativo"
        ? t("detailTitleNegative")
        : t("detailTitle");
  const descripción =
    sentimientoInicial === "positivo"
      ? t("detailDescPositive")
      : sentimientoInicial === "negativo"
        ? t("detailDescNegative")
        : t("detailDesc");

  return (
    <div className="flex flex-col gap-5">
      <header>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{título}</h1>
            <p className="mt-1 text-sm text-text-muted">{descripción}</p>
          </div>

          <div className="w-full sm:w-72">
            <label
              htmlFor="proyecto-detalle-menciones"
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-text-muted"
            >
              {tCommon("monitoredProject")}
            </label>
            <Select
              value={proyectoId ?? VALOR_TODOS}
              onValueChange={cambiarProyecto}
            >
              <SelectTrigger id="proyecto-detalle-menciones" className="h-11">
                <SelectValue placeholder={tCommon("allProjects")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={VALOR_TODOS}>{tCommon("allProjects")}</SelectItem>
                {proyectos.map((proyecto) => (
                  <SelectItem key={proyecto.id} value={proyecto.id}>
                    {proyecto.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Breadcrumbs
          items={[
            { etiqueta: t("title"), href: "/menciones" },
            { etiqueta: título },
          ]}
          className="mt-3"
        />
      </header>

      <Card className="bg-bg-base p-4 shadow-widget">
        <div className="grid gap-3 lg:grid-cols-[minmax(16rem,1.5fr)_minmax(13rem,1fr)_minmax(13rem,1fr)]">
          <div>
            <label
              htmlFor="buscar-menciones"
              className="mb-1.5 block text-xs font-semibold text-text-secondary"
            >
              {t("searchByKeyword")}
            </label>
            <div className="relative">
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
                aria-hidden
              />
              <Input
                id="buscar-menciones"
                type="search"
                value={búsqueda}
                onChange={(evento) => setBúsqueda(evento.target.value)}
                placeholder={t("searchPlaceholder")}
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-semibold text-text-secondary">
              {t("socialNetworks")}
            </span>
            <MultiSelect
              opciones={REDES}
              value={redes}
              onChange={setRedes}
              placeholder={t("selectNetworks")}
              mostrarSeleccionarTodos
            />
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-semibold text-text-secondary">
              {t("newsMedia")}
            </span>
            <MultiSelect
              opciones={mediosOpciones}
              value={medios}
              onChange={setMedios}
              placeholder={t("selectMedia")}
              mostrarSeleccionarTodos
            />
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-text-primary">
            {t("bySource")}
          </h2>
          <p className="text-xs text-text-muted">{t("bySourceHelp")}</p>
        </div>
        {!cargandoInicial && fuentes.length > 0 && (
          <span className="text-xs font-medium text-text-muted tabular-nums">
            {tCommon("countOfTotal", { count: cargadas, total })}
          </span>
        )}
      </div>

      {fuentes.length === 0 ? (
        <Card className="bg-bg-base py-12 text-center">
          <p className="text-sm font-semibold text-text-primary">
            {t("selectSource")}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {t("selectSourceHint")}
          </p>
        </Card>
      ) : cargandoInicial ? (
        <SkeletonColumnas fuentes={fuentes} />
      ) : error && total === 0 ? (
        <Card className="border-error/30 bg-error/5 text-sm text-error">
          {error}
        </Card>
      ) : total === 0 ? (
        <Card className="bg-bg-base py-12 text-center">
          <p className="text-sm font-semibold text-text-primary">
            {t("empty")}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {t("emptyHintSources")}
          </p>
        </Card>
      ) : (
        <div className="grid w-full max-w-full snap-x snap-proximity grid-flow-col auto-cols-[18rem] items-start gap-4 overflow-x-scroll overscroll-x-contain pb-3 lg:auto-cols-[20rem] xl:auto-cols-[22rem]">
          {columnasVisibles.map((columna) => (
            <ColumnaMencionesDetalle
              key={columna.fuente}
              tipo={columna.fuente}
              nombre={columna.nombre}
              menciones={columna.menciones}
              total={columna.total}
              hayMás={columna.hayMás}
              cargandoMás={columna.cargandoMás}
              onCargarMás={() => cargarMás(columna.fuente)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
