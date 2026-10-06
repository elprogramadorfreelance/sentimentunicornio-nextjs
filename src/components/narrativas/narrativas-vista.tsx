"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { DisclaimerDataHistorica, EstadoSinProyectos } from "@/components/layout";
import { Card } from "@/components/ui";
import { apiHashtagsProyecto, apiHashtagsTodos, apiMenciones } from "@/lib/api";
import type { HashtagReal } from "@/lib/api";
import { useProyectosActivos } from "@/lib/hooks/use-proyectos-activos";

import { PaisesCoberturaWidget } from "@/components/dashboard-general";
import { GraficaNubeTerminos } from "@/components/charts/grafica-nube-terminos";
import { calcularPaisesConMenciones } from "@/lib/mapa-paises-cliente";
import { calcularPalabrasClaveReales, mencionesConPalabra } from "@/lib/palabras-clave-cliente";
import { calcularRegionesPresencia } from "@/lib/regiones-presencia";
import { construirResumenNarrativasReal } from "@/lib/resumen-narrativas-cliente";
import type { FuenteMenciones, MenciónEditorial } from "@/types";
import { ModalMencionesHashtag } from "./modal-menciones-hashtag";
import { ModalMencionesPalabra } from "./modal-menciones-palabra";
import { ResumenIaNarrativas } from "./resumen-ia-narrativas";

/**
 * Misma estructura que la referencia de Bruno (nube de hashtags, nube de
 * frases clave, mapa y fuentes con más alcance, resumen de IA) con datos
 * reales. Bruno no muestra ahí una lista de narrativas nombradas por
 * separado — esa lista real (tabla `narratives`) vive en el resumen de IA de
 * cada proyecto, no en esta página.
 */
export function NarrativasVista() {
  const t = useTranslations("narratives");
  const tCommon = useTranslations("common");
  // Selector multi-proyecto del sidebar: "todos" usa el camino rápido
  // (sin filtrar); 2+ seleccionados filtra el subconjunto real.
  const { proyectos, esTodos, idsEfectivos, sinSeleccion } = useProyectosActivos();
  const [menciones, setMenciones] = useState<MenciónEditorial[]>([]);
  const [fuentes, setFuentes] = useState<FuenteMenciones[]>([]);
  const [palabraSeleccionada, setPalabraSeleccionada] = useState<string | null>(null);
  const [hashtagSeleccionado, setHashtagSeleccionado] = useState<string | null>(null);
  const [hashtags, setHashtags] = useState<HashtagReal[]>([]);

  const claveProyectos = idsEfectivos.join(",");

  useEffect(() => {
    if (sinSeleccion) {
      setMenciones([]);
      setFuentes([]);
      setHashtags([]);
      return;
    }
    let cancelado = false;
    // Menciones reales del mismo subconjunto — alimentan las palabras clave y
    // fuentes reales de abajo, no una llamada extra a la IA. "Todos" usa el
    // camino rápido sin filtrar (proyectoId=null).
    apiMenciones(esTodos ? null : idsEfectivos)
      .then((respuesta) => {
        if (!cancelado) {
          setMenciones(respuesta.menciones);
          setFuentes(respuesta.fuentes);
        }
      })
      .catch(() => {
        if (!cancelado) {
          setMenciones([]);
          setFuentes([]);
        }
      });
    // Hashtags reales: con "todos" seleccionado, una sola llamada agregada en
    // el backend (antes eran N llamadas, una por proyecto activo — la causa
    // real de que la página se sintiera lenta al cargar). Para un
    // subconjunto real (2+ pero no todos) no hay endpoint agregado por ids
    // en el backend, así que ahí sí se junta uno por proyecto.
    (esTodos
      ? apiHashtagsTodos().then((lista) => lista)
      : Promise.all(idsEfectivos.map(apiHashtagsProyecto)).then((listas) => {
          const conteo = new Map<string, number>();
          for (const lista of listas) {
            for (const h of lista) conteo.set(h.hashtag, (conteo.get(h.hashtag) ?? 0) + h.total);
          }
          return Array.from(conteo.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 40)
            .map(([hashtag, total]) => ({ hashtag, total }));
        })
    )
      .then((lista) => {
        if (!cancelado) setHashtags(lista);
      })
      .catch(() => {
        if (!cancelado) setHashtags([]);
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveProyectos, esTodos, sinSeleccion]);

  const palabrasClave = useMemo(() => calcularPalabrasClaveReales(menciones), [menciones]);
  const países = useMemo(
    () =>
      calcularPaisesConMenciones(
        menciones,
        proyectos.map((p) => ({ id: p.id, countryCode: p.paises[0] ?? "MX" })),
      ),
    [menciones, proyectos],
  );
  // Mismo mapa real de estados de México (con zoom/centrado dinámico y
  // reparto por población) que ya usan Dashboard e Infografía — pedido
  // explícito del cliente (2026-10-01): "tiene que verse idéntico en
  // cualquier parte donde se replica". PaisesCoberturaWidget decide solo si
  // puede mostrar el mapa (todas las regiones son estados MX reales) o cae
  // a su lista de barras — mismo criterio en las 3 pantallas.
  const regiones = useMemo(
    () =>
      calcularRegionesPresencia(
        menciones,
        new Map(proyectos.map((p) => [p.id, p.ubicacion])),
      ),
    [menciones, proyectos],
  );
  const mencionesPalabraSeleccionada = useMemo(
    () => (palabraSeleccionada ? mencionesConPalabra(menciones, palabraSeleccionada) : []),
    [menciones, palabraSeleccionada],
  );

  const alcanceEtiqueta = esTodos
    ? t("allProjectsLabel")
    : idsEfectivos.length === 1
      ? (proyectos.find((p) => p.id === idsEfectivos[0])?.nombre ?? t("singleProjectFallback"))
      : t("projectsSelectedCount", { count: idsEfectivos.length });
  const resumenReal = useMemo(
    () => construirResumenNarrativasReal(menciones, hashtags, palabrasClave, países, fuentes, alcanceEtiqueta),
    [menciones, hashtags, palabrasClave, países, fuentes, alcanceEtiqueta],
  );

  return (
    <div className="flex flex-col gap-6">
      <DisclaimerDataHistorica />
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("title")}</h1>
          <p className="mt-1 text-sm text-text-muted">{t("subtitleReal")}</p>
        </div>
      </header>

      {sinSeleccion ? (
        <EstadoSinProyectos
          titulo={tCommon("selectAtLeastOneProject")}
          descripcion={tCommon("selectAtLeastOneHint")}
        />
      ) : (
        <>
      {resumenReal && (
        <ResumenIaNarrativas
          resumen={resumenReal}
          hashtags={hashtags}
          palabrasClave={palabrasClave}
          fuentes={fuentes}
          países={países}
          alcanceEtiqueta={alcanceEtiqueta}
        />
      )}

      {(hashtags.length > 0 || palabrasClave.length > 0 || fuentes.length > 0 || regiones.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {hashtags.length > 0 && (
            <Card className="flex min-h-[20rem] flex-col bg-bg-base p-4">
              <h2 className="text-sm font-semibold text-text-primary">{t("hashtags")}</h2>
              <p className="mt-0.5 text-xs text-text-muted">{t("hashtagsCloudHelp")}</p>
              <div className="mt-2 min-h-0 flex-1">
                <GraficaNubeTerminos
                  términos={hashtags.map((h) => ({
                    id: h.hashtag,
                    texto: h.hashtag.startsWith("#") ? h.hashtag : `#${h.hashtag}`,
                    menciones: h.total,
                  }))}
                  etiqueta={t("hashtags")}
                  etiquetaAcción={t("seeMentionsOf")}
                  onSeleccionar={(término) => setHashtagSeleccionado(término.texto)}
                />
              </div>
            </Card>
          )}

          {palabrasClave.length > 0 && (
            <Card className="flex min-h-[20rem] flex-col bg-bg-base p-4">
              <h2 className="text-sm font-semibold text-text-primary">{t("keywordsCloud")}</h2>
              <p className="mt-0.5 text-xs text-text-muted">{t("keywordsCloudHelp")}</p>
              <div className="mt-2 min-h-0 flex-1">
                <GraficaNubeTerminos
                  términos={palabrasClave.map((pc) => ({
                    id: pc.palabra,
                    texto: pc.palabra,
                    menciones: pc.total,
                  }))}
                  etiqueta={t("keywordsCloud")}
                  etiquetaAcción={t("seeMentionsWith")}
                  onSeleccionar={(término) => setPalabraSeleccionada(término.texto)}
                />
              </div>
            </Card>
          )}

          {fuentes.length > 0 && (
            <Card className="bg-bg-base p-4">
              <h2 className="text-sm font-semibold text-text-primary">{t("topSourcesReal")}</h2>
              <p className="mt-0.5 text-xs text-text-muted">{t("topSourcesRealHelp")}</p>
              <ul className="mt-3 space-y-2">
                {fuentes.slice(0, 6).map((fuente) => (
                  <li key={fuente.id} className="flex items-center gap-2 text-xs">
                    <span className="min-w-0 flex-1 truncate text-text-secondary">
                      {fuente.nombre}
                    </span>
                    <span className="font-semibold tabular-nums text-text-primary">
                      {fuente.total}
                    </span>
                    <span className="w-10 shrink-0 text-right text-[10px] text-text-muted tabular-nums">
                      {fuente.porcentaje}%
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {regiones.length > 0 && (
            <PaisesCoberturaWidget
              regiones={regiones}
              className="min-h-[20rem] lg:col-span-2"
            />
          )}
        </div>
      )}

      <ModalMencionesPalabra
        palabra={palabraSeleccionada}
        menciones={mencionesPalabraSeleccionada}
        onOpenChange={(abierto) => {
          if (!abierto) setPalabraSeleccionada(null);
        }}
      />

      <ModalMencionesHashtag
        hashtag={hashtagSeleccionado}
        proyectoIds={idsEfectivos}
        onOpenChange={(abierto) => {
          if (!abierto) setHashtagSeleccionado(null);
        }}
      />
        </>
      )}
    </div>
  );
}
