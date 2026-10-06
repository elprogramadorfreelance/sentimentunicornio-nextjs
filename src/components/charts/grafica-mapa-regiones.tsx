"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatearNumero } from "@/i18n/formato";
import {
  GEO_MAPA_NARRATIVAS,
  IDS_OMITIR_MAPA_MUNDO,
} from "@/lib/mapa-narrativas";
import { formatearCifraCompacta } from "@/lib/mock/narrativas";
import { PALETA_ACTIVA, type RampaMapa } from "@/lib/paletas-graficas";
import { cn } from "@/lib/utils";
import type { AlcanceMapaNarrativas, RegiónCuotaVoz } from "@/types";

type Posición = [number, number];

type GeometríaRegión =
  | { type: "Polygon"; coordinates: Posición[][] }
  | { type: "MultiPolygon"; coordinates: Posición[][][] };

type FeatureRegión = {
  type: "Feature";
  id?: string;
  properties?: { id?: string; name?: string };
  geometry: GeometríaRegión;
};

type ColecciónRegiones = {
  type: "FeatureCollection";
  features: FeatureRegión[];
};

type RegiónTrazada = {
  id: string;
  d: string;
  nombreBase: string;
};

type HoverRegión = {
  x: number;
  y: number;
  anchoContenedor: number;
  nombre: string;
  menciones: number | null;
};

type GraficaMapaRegionesProps = {
  regiones: RegiónCuotaVoz[];
  alcance?: AlcanceMapaNarrativas;
  rampa?: RampaMapa;
  className?: string;
};

const RAMPA_BASE: RampaMapa = PALETA_ACTIVA.rampa;

const PADDING_RELATIVO = 0.05;
const LAT_MERCATOR_MAX = 72;

const CLAVE_ARIA_MAPA: Record<
  AlcanceMapaNarrativas,
  "mapAriaMx" | "mapAriaEs" | "mapAriaWorld"
> = {
  mexico: "mapAriaMx",
  espana: "mapAriaEs",
  mundo: "mapAriaWorld",
};

const CLAVE_TÍTULO_MAPA: Record<
  AlcanceMapaNarrativas,
  "mapTitleMx" | "mapTitleEs" | "mapTitleWorld"
> = {
  mexico: "mapTitleMx",
  espana: "mapTitleEs",
  mundo: "mapTitleWorld",
};

function proyectarMercator([lon, lat]: Posición): Posición {
  const latAcotada = Math.max(
    -LAT_MERCATOR_MAX,
    Math.min(LAT_MERCATOR_MAX, lat),
  );
  const lambda = (lon * Math.PI) / 180;
  const phi = (latAcotada * Math.PI) / 180;
  return [lambda, -Math.log(Math.tan(Math.PI / 4 + phi / 2))];
}

/** Acerca Canarias al suroeste de la península para no aplastar el mapa. */
function insetCanarias([lon, lat]: Posición): Posición {
  if (lat < 32 && lon < -12) {
    return [lon + 8, lat + 5];
  }
  return [lon, lat];
}

function trazarColección(
  colección: ColecciónRegiones,
  {
    omitirIds,
    transformarPunto,
  }: {
    omitirIds: Set<string>;
    transformarPunto?: (punto: Posición) => Posición;
  },
): {
  regiones: RegiónTrazada[];
  viewBox: string;
} {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  const regiones = colección.features.flatMap((feature) => {
    const id = feature.id ?? feature.properties?.id ?? "";
    if (!id || omitirIds.has(id)) return [];

    const polígonos =
      feature.geometry.type === "Polygon"
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates;

    const d = polígonos
      .map((anillos) =>
        anillos
          .map((anillo) =>
            anillo
              .map((punto, índice) => {
                const proyectado = proyectarMercator(
                  transformarPunto ? transformarPunto(punto) : punto,
                );
                const [x, y] = proyectado;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
                return `${índice === 0 ? "M" : "L"}${x.toFixed(5)},${y.toFixed(5)}`;
              })
              .join(""),
          )
          .join(""),
      )
      .join("");

    return [
      {
        id,
        d: `${d}Z`,
        nombreBase: feature.properties?.name ?? "",
      },
    ];
  });

  const ancho = maxX - minX;
  const alto = maxY - minY;
  const padX = ancho * PADDING_RELATIVO;
  const padY = alto * PADDING_RELATIVO;

  return {
    regiones,
    viewBox: `${minX - padX} ${minY - padY} ${ancho + padX * 2} ${alto + padY * 2}`,
  };
}

export function GraficaMapaRegiones({
  regiones,
  alcance = "mexico",
  rampa = RAMPA_BASE,
  className,
}: GraficaMapaRegionesProps) {
  const t = useTranslations("narratives");
  const tCharts = useTranslations("charts");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const contenedorRef = useRef<HTMLDivElement>(null);
  const [trazado, setTrazado] = useState<{
    regiones: RegiónTrazada[];
    viewBox: string;
  } | null>(null);
  const [error, setError] = useState(false);
  const [hover, setHover] = useState<HoverRegión | null>(null);

  const geoUrl = GEO_MAPA_NARRATIVAS[alcance];
  const ariaMapa = t(CLAVE_ARIA_MAPA[alcance]);
  const títuloMapa = t(CLAVE_TÍTULO_MAPA[alcance]);

  useEffect(() => {
    let cancelado = false;
    setTrazado(null);
    setError(false);
    setHover(null);

    fetch(geoUrl)
      .then((respuesta) => {
        if (!respuesta.ok) throw new Error("mapa");
        return respuesta.json() as Promise<ColecciónRegiones>;
      })
      .then((geo) => {
        if (cancelado) return;
        setTrazado(
          trazarColección(geo, {
            omitirIds:
              alcance === "mundo" ? new Set(IDS_OMITIR_MAPA_MUNDO) : new Set(),
            transformarPunto: alcance === "espana" ? insetCanarias : undefined,
          }),
        );
      })
      .catch(() => {
        if (!cancelado) setError(true);
      });

    return () => {
      cancelado = true;
    };
  }, [alcance, geoUrl]);

  const regionesTrazadas = useMemo(() => {
    if (!trazado) return [];
    const mencionesPorId = new Map(
      regiones.map((región) => [región.id, región]),
    );
    const maxLog = Math.max(
      ...regiones.map((región) => Math.log10(región.menciones + 1)),
      1,
    );
    return trazado.regiones.map((región) => {
      const dato = mencionesPorId.get(región.id);
      const t = dato ? Math.log10(dato.menciones + 1) / maxLog : 0;
      return {
        ...región,
        nombre: dato?.nombre ?? región.nombreBase ?? región.id,
        menciones: dato?.menciones ?? null,
        fill: dato
          ? `color-mix(in oklab, ${rampa.maximo} ${Math.round(15 + t * 85)}%, ${rampa.minimo})`
          : rampa.sinDatos,
      };
    });
  }, [trazado, regiones, rampa]);

  if (error || !trazado) {
    return <div className={cn("h-full w-full", className)} />;
  }

  const maxMenciones = Math.max(...regiones.map((r) => r.menciones), 1);
  const minMenciones = Math.min(...regiones.map((r) => r.menciones), 0);

  function mostrarTooltip(
    evento: React.MouseEvent<SVGPathElement>,
    región: { nombre: string; menciones: number | null },
  ) {
    const contenedor = contenedorRef.current;
    if (!contenedor) return;
    const rect = contenedor.getBoundingClientRect();
    setHover({
      x: evento.clientX - rect.left,
      y: evento.clientY - rect.top,
      anchoContenedor: rect.width,
      nombre: región.nombre,
      menciones: región.menciones,
    });
  }

  function mostrarTooltipFijo(
    evento: React.FocusEvent<SVGPathElement>,
    región: { nombre: string; menciones: number | null },
  ) {
    const contenedor = contenedorRef.current;
    if (!contenedor) return;
    const rect = contenedor.getBoundingClientRect();
    const rectPath = evento.currentTarget.getBoundingClientRect();
    setHover({
      x: rectPath.left - rect.left + rectPath.width / 2,
      y: rectPath.top - rect.top,
      anchoContenedor: rect.width,
      nombre: región.nombre,
      menciones: región.menciones,
    });
  }

  return (
    <div
      className={cn(
        "chart-frame flex h-full min-h-0 w-full flex-col",
        className,
      )}
    >
      <div
        ref={contenedorRef}
        className="relative min-h-0 min-w-0 flex-1 overflow-hidden"
      >
        <svg
          viewBox={trazado.viewBox}
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full max-w-full"
          role="img"
          aria-label={ariaMapa}
        >
          <title>{títuloMapa}</title>
          {regionesTrazadas.map((región) => {
            const activo = hover?.nombre === región.nombre;
            const etiqueta =
              región.menciones !== null
                ? tCharts("regionMentions", {
                    name: región.nombre,
                    count: formatearNumero(región.menciones, locale),
                  })
                : tCharts("regionNoData", { name: región.nombre });
            return (
              // El path no ejecuta acción: el tooltip es complementario y la
              // información ya se anuncia vía aria-label al enfocar con teclado
              // biome-ignore lint/a11y/noStaticElementInteractions: visualización de datos sin acción asociada
              <path
                key={región.id}
                d={región.d}
                fill={región.fill}
                stroke={
                  activo ? PALETA_ACTIVA.rampa.maximo : "var(--color-bg-base)"
                }
                strokeWidth={activo ? 2 : 1}
                vectorEffect="non-scaling-stroke"
                tabIndex={0}
                aria-label={etiqueta}
                className="outline-none transition-[filter] duration-150 focus-visible:stroke-accent"
                onMouseMove={(evento) => mostrarTooltip(evento, región)}
                onMouseLeave={() => setHover(null)}
                onFocus={(evento) => mostrarTooltipFijo(evento, región)}
                onBlur={() => setHover(null)}
              />
            );
          })}
        </svg>

        {hover ? (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+8px)] rounded-md border border-border-default bg-bg-base px-2.5 py-1.5 text-xs shadow-md"
            style={{
              left: Math.min(
                Math.max(hover.x, 72),
                Math.max(hover.anchoContenedor - 72, 72),
              ),
              top: hover.y,
            }}
          >
            <p className="font-semibold whitespace-nowrap text-text-primary">
              {hover.nombre}
            </p>
            <p className="whitespace-nowrap text-text-secondary">
              {tCommon("mentions")}:{" "}
              <span className="font-medium text-text-primary">
                {hover.menciones !== null
                  ? formatearNumero(hover.menciones, locale)
                  : tCharts("noDataRegion")}
              </span>
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-1 flex items-center gap-2 px-1">
        <span className="text-[10px] tabular-nums text-text-muted">
          {formatearCifraCompacta(minMenciones)}
        </span>
        <div
          aria-hidden
          className="h-1.5 min-w-0 flex-1 rounded-full"
          style={{
            backgroundImage: `linear-gradient(to right, ${rampa.minimo}, ${rampa.maximo})`,
          }}
        />
        <span className="text-[10px] tabular-nums text-text-muted">
          {formatearCifraCompacta(maxMenciones)}
        </span>
      </div>
    </div>
  );
}
