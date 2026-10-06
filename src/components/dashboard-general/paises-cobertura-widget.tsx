"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { GraficaBarraAlcanceFuente } from "@/components/charts/grafica-barra-alcance-fuente";
import { GraficaMapaPaises } from "@/components/charts/grafica-mapa-paises";
import {
  formatearAlcanceCompacto,
  obtenerRegionesPresenciaMock,
  type RegionPresencia,
} from "@/lib/mock/dashboard-general";
import { pesoPoblaciónEstado, resolverCódigoEstado, RUTA_GEOJSON_MEXICO } from "@/lib/mapa-estados-mexico";
import { CardTitleBar } from "@/components/ui";
import { cn } from "@/lib/utils";
import { PALETA_ACTIVA } from "@/lib/paletas-graficas";
import { repartirEnteroPorPeso } from "@/lib/porcentajes";

type PaisesCoberturaWidgetProps = {
  className?: string;
  regiones?: RegionPresencia[];
};

/**
 * Lista real por default — si TODAS las regiones son estados mexicanos
 * reconocibles (caso real de los clientes actuales, cobertura nacional),
 * se muestra un mapa real de México en vez de la lista (pedido explícito
 * del cliente, antes era solo una lista tipo barra). Si alguna región no
 * se reconoce como estado real (otro país, o texto libre), se mantiene la
 * lista — nunca se fuerza un mapa con datos que no calzan.
 */
export function PaisesCoberturaWidget({
  className,
  regiones: regionesProp,
}: PaisesCoberturaWidgetProps) {
  const t = useTranslations("dashboard");
  const regiones = regionesProp ?? obtenerRegionesPresenciaMock();
  const max = Math.max(...regiones.map((region) => region.menciones), 1);
  const total = regiones.reduce((suma, region) => suma + region.menciones, 0);

  const [geoFeatures, setGeoFeatures] = useState<Record<string, unknown>[]>([]);
  useEffect(() => {
    let cancelado = false;
    fetch(RUTA_GEOJSON_MEXICO)
      .then((res) => res.json())
      .then((geojson: { features?: Record<string, unknown>[] }) => {
        if (!cancelado) setGeoFeatures(geojson.features ?? []);
      })
      .catch(() => {
        if (!cancelado) setGeoFeatures([]);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  // `region` puede traer varios estados juntos ("Quintana Roo, Sonora,
  // Sinaloa...") cuando el proyecto declara cobertura nacional — no hay
  // dato real de cuántas menciones tocó cada estado por separado (ver
  // calcularRegionesPresencia). La LISTA de abajo muestra el total real tal
  // cual, sin partir. Para el MAPA, pedido explícito del cliente
  // (2026-10-01): que los estados no se vean todos con el mismo número —
  // se reparte el total real entre ellos por peso de población (dato real,
  // Censo INEGI 2020 — ver pesoPoblaciónEstado), así la suma de los estados
  // SIEMPRE da el total real del proyecto, con un reparto más plausible que
  // dividir parejo entre todos.
  const estadosParaMapa = regiones.flatMap((r) => {
    const estados = r.region
      .split(",")
      .map((parte) => parte.trim())
      .filter(Boolean);
    const códigos = estados.map((estado) => resolverCódigoEstado(estado));
    const pesos = códigos.map((código) => (código ? pesoPoblaciónEstado(código) : 1));
    const repartido = repartirEnteroPorPeso(pesos, r.menciones);
    return estados.map((estado, i) => ({
      estado,
      código: códigos[i],
      menciones: repartido[i],
    }));
  });
  const esMapaMéxico =
    estadosParaMapa.length > 0 &&
    estadosParaMapa.every((e) => e.código !== null) &&
    geoFeatures.length > 0;

  return (
    <section
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border-default/30 bg-bg-base p-2.5 shadow-widget sm:p-3",
        className,
      )}
      aria-label={t("topRegions")}
    >
      <CardTitleBar bleed="sm">{t("topRegions")}</CardTitleBar>

      {esMapaMéxico ? (
        <div className="mt-2 flex min-h-0 flex-1 flex-col gap-2">
          <div className="min-h-0 flex-1">
            <GraficaMapaPaises
              paises={estadosParaMapa.map((e) => ({
                codigoIso3: e.código as string,
                pais: e.estado,
                menciones: e.menciones,
              }))}
              features={geoFeatures}
              className="h-full"
              // "mercator": el componente mide su propio contenedor y
              // calcula el zoom/centrado con fitExtent en cada render — no
              // hace falta scale/translation fijos (ver comentario en
              // GraficaMapaPaisesProps). Solo la rotación (centrar la
              // longitud de México, ~-102.18°) sigue siendo necesaria.
              projectionType="mercator"
              projectionRotation={[102.18, 0, 0]}
            />
          </div>
          <ul className="flex shrink-0 flex-wrap gap-x-3 gap-y-1 text-[10px] text-text-muted">
            {regiones.slice(0, 5).map((region) => (
              <li
                key={region.region}
                className="flex max-w-full items-center gap-1"
                title={region.region}
              >
                <span className="shrink-0 font-semibold text-text-primary">
                  {formatearAlcanceCompacto(region.menciones)}
                </span>
                <span className="truncate">{region.region}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ul className="mt-2 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-0.5">
          {regiones.map((region, index) => {
            const porcentaje = total ? (region.menciones / total) * 100 : 0;
            return (
              <li key={region.region} className="shrink-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-4 shrink-0 text-right tabular-nums text-text-muted">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-text-secondary">
                    {region.region}
                  </span>
                  <span className="w-14 shrink-0 text-right font-semibold tabular-nums text-text-primary">
                    {formatearAlcanceCompacto(region.menciones)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 pl-6">
                  <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-bg-muted">
                    <GraficaBarraAlcanceFuente
                      fuente={region.region}
                      alcance={region.menciones}
                      max={max}
                      color={PALETA_ACTIVA.categorica[1].plano}
                    />
                  </div>
                  <span className="w-9 shrink-0 text-right text-[10px] text-text-muted tabular-nums">
                    {porcentaje.toFixed(1)}%
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
