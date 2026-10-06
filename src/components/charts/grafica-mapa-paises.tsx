"use client";

import type { ChoroplethBoundFeature } from "@nivo/geo";
import { ResponsiveChoropleth } from "@nivo/geo";
import { geoMercator } from "d3-geo";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { PALETA_ACTIVA } from "@/lib/paletas-graficas";

export type PaisMapa = {
  codigoIso3: string;
  pais: string;
  menciones: number;
};

type DatoPais = {
  id: string;
  value: number;
  menciones: number;
  pais: string;
};

type GeoJsonFeature = Record<string, unknown>;

type GraficaMapaPaisesProps = {
  paises: PaisMapa[];
  features: GeoJsonFeature[];
  className?: string;
  /** "naturalEarth1" (default) está calibrado de forma fija para el GeoJSON
   * mundial completo (`world-countries.json`) — un scale/translation fijos
   * le funcionan porque el mundo entero cabe razonablemente en casi
   * cualquier proporción de contenedor. "mercator" es el modo para un solo
   * país/región (hoy México): en vez de un scale fijo, el componente mide
   * el contenedor real con ResizeObserver y usa `fitExtent` de d3-geo para
   * calcular el zoom/centrado exactos en cada render — así el mapa siempre
   * llena el espacio disponible sin importar el tamaño real del widget en
   * cada viewport (un scale fijo calibrado para un tamaño de referencia
   * desentonaba del tamaño real, bug real reportado por el cliente,
   * 2026-10-01: el mapa se veía chico y mal ubicado). naturalEarth1 además
   * es una proyección de compromiso pensada para el globo completo:
   * acercada sobre un solo país se ve inclinada/deformada porque no es
   * conforme lejos de su centro de diseño — mercator sí preserva la forma
   * real al hacer zoom. */
  projectionType?: "naturalEarth1" | "mercator";
  /** Solo aplica a projectionType="naturalEarth1" — mercator siempre calcula
   * su propio scale/translation dinámicamente, estos se ignoran para ese caso. */
  projectionScale?: number;
  projectionTranslation?: [number, number];
  projectionRotation?: [number, number, number];
};

function TooltipPais({
  feature,
  etiquetaMenciones,
}: {
  feature: ChoroplethBoundFeature;
  etiquetaMenciones: string;
}) {
  const dato = feature.data as DatoPais | null;
  if (!dato) return null;

  return (
    <div className="rounded-md border border-border-default bg-bg-base px-2.5 py-1.5 text-xs shadow-md">
      <p className="font-semibold text-text-primary">{dato.pais}</p>
      <p className="text-text-secondary">
        {etiquetaMenciones}:{" "}
        <span className="font-medium text-text-primary">
          {dato.menciones.toLocaleString("es-MX")}
        </span>
      </p>
    </div>
  );
}

/**
 * Choropleth con @nivo/geo. El valor que colorea el mapa es log10(menciones)
 * —no las menciones reales— porque México (274K) frente al resto (400–11.5K)
 * dejaría casi todo el mapa en el mismo tono con una escala lineal. El
 * tooltip sí muestra las menciones reales.
 */
const MARGEN_AJUSTE_DINÁMICO = 8;

export function GraficaMapaPaises({
  paises,
  features,
  className,
  projectionType = "naturalEarth1",
  projectionScale = 90,
  projectionTranslation = [0.5, 0.55],
  projectionRotation = [0, 0, 0],
}: GraficaMapaPaisesProps) {
  const t = useTranslations("charts");
  const tCommon = useTranslations("common");

  const contenedorRef = useRef<HTMLDivElement>(null);
  const [tamaño, setTamaño] = useState<{ ancho: number; alto: number } | null>(null);

  useEffect(() => {
    const el = contenedorRef.current;
    if (!el) return;
    const observador = new ResizeObserver((entradas) => {
      const entrada = entradas[0];
      if (!entrada) return;
      const { width, height } = entrada.contentRect;
      if (width > 0 && height > 0) setTamaño({ ancho: width, alto: height });
    });
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  // Solo para "mercator" (hoy, el mapa de México): calcula scale/translation
  // reales con fitExtent contra el tamaño MEDIDO del contenedor, en vez de
  // usar un número fijo calibrado para un tamaño de referencia que no
  // coincide con el tamaño real del widget (bug reportado 2026-10-01).
  const ajusteDinámico = useMemo(() => {
    if (projectionType !== "mercator" || !tamaño || features.length === 0) return null;
    const colección = { type: "FeatureCollection", features };
    const proyección = geoMercator()
      .rotate(projectionRotation)
      .fitExtent(
        [
          [MARGEN_AJUSTE_DINÁMICO, MARGEN_AJUSTE_DINÁMICO],
          [tamaño.ancho - MARGEN_AJUSTE_DINÁMICO, tamaño.alto - MARGEN_AJUSTE_DINÁMICO],
        ],
        colección,
      );
    const [tx, ty] = proyección.translate();
    return {
      scale: proyección.scale(),
      translation: [tx / tamaño.ancho, ty / tamaño.alto] as [number, number],
    };
  }, [projectionType, tamaño, features, projectionRotation]);

  if (paises.length === 0 || features.length === 0) return null;

  const data: DatoPais[] = paises.map((p) => ({
    id: p.codigoIso3,
    value: Math.log10(p.menciones + 1),
    menciones: p.menciones,
    pais: p.pais,
  }));
  const maxValor = Math.max(...data.map((d) => d.value), 1);

  const escalaFinal = ajusteDinámico?.scale ?? projectionScale;
  const traslaciónFinal = ajusteDinámico?.translation ?? projectionTranslation;

  return (
    <div
      ref={contenedorRef}
      className={cn("h-full w-full", className)}
      role="img"
      aria-label={t("countriesAria")}
    >
      <ResponsiveChoropleth
        features={features}
        data={data}
        domain={[0, maxValor]}
        colors={[PALETA_ACTIVA.rampa.minimo, PALETA_ACTIVA.rampa.maximo]}
        unknownColor={PALETA_ACTIVA.rampa.sinDatos}
        label="properties.name"
        value="value"
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        projectionType={projectionType}
        projectionScale={escalaFinal}
        projectionTranslation={traslaciónFinal}
        projectionRotation={projectionRotation}
        borderWidth={0.5}
        borderColor="var(--color-bg-base)"
        isInteractive
        tooltip={(props) => (
          <TooltipPais {...props} etiquetaMenciones={tCommon("mentions")} />
        )}
      />
    </div>
  );
}
