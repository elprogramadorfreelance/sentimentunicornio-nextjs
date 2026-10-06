"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { DisclaimerDataHistorica, EstadoSinProyectos } from "@/components/layout";
import { Badge, Card, Skeleton } from "@/components/ui";
import { apiAmplificadores } from "@/lib/api";
import type { Amplificador, CategoríaAmplificador } from "@/lib/amplificadores-backend";
import { useProyectosActivos } from "@/lib/hooks/use-proyectos-activos";
import { cn } from "@/lib/utils";

const VALOR_TODAS_CATEGORÍAS = "todas";

const VARIANTE_BADGE: Record<CategoríaAmplificador, "error" | "positivo" | "neutral"> = {
  crítico: "error",
  aliado: "positivo",
  neutral: "neutral",
};

function BarraScore({ valor, tono }: { valor: number; tono: "riesgo" | "influencia" }) {
  const pct = Math.max(0, Math.min(100, valor));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-muted">
      <div
        className={cn("h-full rounded-full", tono === "riesgo" ? "bg-error" : "bg-primary")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function TarjetaAmplificador({ amplificador }: { amplificador: Amplificador }) {
  const t = useTranslations("amplifiers");
  const tCommon = useTranslations("common");
  const ETIQUETA_CATEGORÍA: Record<CategoríaAmplificador, string> = {
    crítico: t("categoryCritical"),
    aliado: t("categoryAlly"),
    neutral: tCommon("neutral"),
  };
  const contenido = (
    <Card className="flex h-full flex-col gap-3 bg-bg-base p-4 shadow-widget">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">{amplificador.nombre}</p>
          <p className="text-[11px] text-text-muted">{amplificador.proyecto}</p>
        </div>
        <Badge variante={VARIANTE_BADGE[amplificador.categoría]}>
          {ETIQUETA_CATEGORÍA[amplificador.categoría]}
        </Badge>
      </div>

      <p className="text-xs text-text-secondary">{amplificador.rol}</p>

      <div className="space-y-2">
        <div>
          <div className="mb-1 flex items-center justify-between text-[10px] text-text-muted">
            <span>{t("influence")}</span>
            <span className="font-semibold tabular-nums text-text-primary">
              {amplificador.influencia}
            </span>
          </div>
          <BarraScore valor={amplificador.influencia} tono="influencia" />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-[10px] text-text-muted">
            <span>{t("risk")}</span>
            <span className="font-semibold tabular-nums text-text-primary">
              {amplificador.riesgo}
            </span>
          </div>
          <BarraScore valor={amplificador.riesgo} tono="riesgo" />
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-border-default/40 pt-2 text-[10px] text-text-muted">
        <span>{amplificador.plataforma}</span>
        <span className="tabular-nums">{t("appearances", { count: amplificador.apariciones })}</span>
      </div>
    </Card>
  );

  return amplificador.url ? (
    <a href={amplificador.url} target="_blank" rel="noopener noreferrer" className="block h-full">
      {contenido}
    </a>
  ) : (
    contenido
  );
}

export function AmplificadoresVista() {
  const t = useTranslations("amplifiers");
  const tCommon = useTranslations("common");
  // Selector multi-proyecto del sidebar: "todos" o 2+ seleccionados trae los
  // amplificadores de todos esos proyectos (subconjunto real, filtrado en el route).
  const { idsEfectivos, sinSeleccion } = useProyectosActivos();
  const [categoría, setCategoría] = useState<CategoríaAmplificador | typeof VALOR_TODAS_CATEGORÍAS>(
    VALOR_TODAS_CATEGORÍAS,
  );
  const [amplificadores, setAmplificadores] = useState<Amplificador[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const claveProyectos = idsEfectivos.join(",");

  useEffect(() => {
    if (sinSeleccion) {
      setAmplificadores([]);
      setError(null);
      return;
    }
    let cancelado = false;
    setAmplificadores(null);
    setError(null);
    apiAmplificadores(idsEfectivos)
      .then((respuesta) => {
        if (!cancelado) setAmplificadores(respuesta.amplificadores);
      })
      .catch((err: unknown) => {
        if (!cancelado) {
          setError(err instanceof Error ? err.message : t("loadError"));
        }
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveProyectos, sinSeleccion]);

  const filtrados = useMemo(() => {
    if (!amplificadores) return [];
    if (categoría === VALOR_TODAS_CATEGORÍAS) return amplificadores;
    return amplificadores.filter((a) => a.categoría === categoría);
  }, [amplificadores, categoría]);

  const conteos = useMemo(() => {
    const base = { crítico: 0, aliado: 0, neutral: 0 };
    for (const a of amplificadores ?? []) base[a.categoría] += 1;
    return base;
  }, [amplificadores]);

  return (
    <div className="flex flex-col gap-6">
      <DisclaimerDataHistorica />
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("title")}</h1>
          <p className="mt-1 text-sm text-text-muted">{t("subtitle")}</p>
        </div>
      </header>

      {sinSeleccion ? (
        <EstadoSinProyectos
          titulo={tCommon("selectAtLeastOneProject")}
          descripcion={tCommon("selectAtLeastOneHint")}
        />
      ) : (
        <>
      <div className="flex flex-wrap gap-2">
        {(
          [
            [VALOR_TODAS_CATEGORÍAS, t("filterAll", { count: amplificadores?.length ?? 0 })],
            ["crítico", t("filterCritical", { count: conteos.crítico })],
            ["aliado", t("filterAllies", { count: conteos.aliado })],
            ["neutral", t("filterNeutral", { count: conteos.neutral })],
          ] as const
        ).map(([valor, etiqueta]) => (
          <button
            key={valor}
            type="button"
            onClick={() => setCategoría(valor)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              categoría === valor
                ? "border-primary bg-primary/10 text-primary"
                : "border-border-default text-text-muted hover:text-text-primary",
            )}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {error ? (
        <Card className="border-error/30 bg-error/5 text-sm text-error">{error}</Card>
      ) : !amplificadores ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {["a", "b", "c", "d", "e", "f"].map((id) => (
            <Skeleton key={id} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <Card className="bg-bg-base py-12 text-center text-sm text-text-muted">
          {t("emptyCategory")}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtrados.map((amplificador) => (
            <TarjetaAmplificador key={amplificador.id} amplificador={amplificador} />
          ))}
        </div>
      )}
        </>
      )}
    </div>
  );
}
