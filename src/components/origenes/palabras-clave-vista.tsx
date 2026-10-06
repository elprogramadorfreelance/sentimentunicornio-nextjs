"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { GraficaNubeTerminos } from "@/components/charts/grafica-nube-terminos";
import { DisclaimerDataHistorica, EstadoSinProyectos } from "@/components/layout";
import { ModalMencionesPalabra } from "@/components/narrativas";
import { Card, Skeleton } from "@/components/ui";
import { apiMenciones } from "@/lib/api";
import { useProyectosActivos } from "@/lib/hooks/use-proyectos-activos";
import { calcularPalabrasClaveReales, mencionesConPalabra } from "@/lib/palabras-clave-cliente";
import type { MenciónEditorial } from "@/types";

/**
 * Mismo patrón real ya probado en Narrativas (nube de palabras por
 * frecuencia real en las menciones, sin catálogo inventado) — antes esta
 * página era un "Próximamente" vacío, pero el link de Palabras clave del
 * dashboard ya apuntaba aquí esperando contenido real.
 */
export function PalabrasClaveVista() {
  const t = useTranslations("origins");
  const tNarratives = useTranslations("narratives");
  const tCommon = useTranslations("common");
  const { esTodos, idsEfectivos, sinSeleccion } = useProyectosActivos();
  const [menciones, setMenciones] = useState<MenciónEditorial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [palabraSeleccionada, setPalabraSeleccionada] = useState<string | null>(null);

  const claveProyectos = idsEfectivos.join(",");

  useEffect(() => {
    if (sinSeleccion) {
      setMenciones([]);
      setCargando(false);
      return;
    }
    let cancelado = false;
    setCargando(true);
    apiMenciones(esTodos ? null : idsEfectivos)
      .then((respuesta) => {
        if (!cancelado) setMenciones(respuesta.menciones);
      })
      .catch(() => {
        if (!cancelado) setMenciones([]);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esTodos, claveProyectos, sinSeleccion]);

  const palabrasClave = useMemo(() => calcularPalabrasClaveReales(menciones), [menciones]);
  const mencionesPalabraSeleccionada = useMemo(
    () => (palabraSeleccionada ? mencionesConPalabra(menciones, palabraSeleccionada) : []),
    [menciones, palabraSeleccionada],
  );

  return (
    <div className="flex flex-col gap-4">
      <DisclaimerDataHistorica />
      <header>
        <h1 className="text-2xl font-bold text-text-primary">{t("keywordsTitle")}</h1>
        <p className="mt-1 text-sm text-text-muted">{t("keywordsDescription")}</p>
      </header>

      {sinSeleccion ? (
        <EstadoSinProyectos
          titulo={tCommon("selectAtLeastOneProject")}
          descripcion={tCommon("selectAtLeastOneHint")}
        />
      ) : cargando ? (
        <Skeleton className="h-96 rounded-lg" />
      ) : palabrasClave.length === 0 ? (
        <Card className="bg-bg-base p-6 text-center text-sm text-text-muted">
          {tNarratives("modalNoMentionsWord")}
        </Card>
      ) : (
        <Card className="flex min-h-[24rem] flex-col bg-bg-base p-4">
          <h2 className="text-sm font-semibold text-text-primary">{tNarratives("keywordsCloud")}</h2>
          <p className="mt-0.5 text-xs text-text-muted">{tNarratives("keywordsCloudHelp")}</p>
          <div className="mt-2 min-h-0 flex-1">
            <GraficaNubeTerminos
              términos={palabrasClave.map((pc) => ({
                id: pc.palabra,
                texto: pc.palabra,
                menciones: pc.total,
              }))}
              etiqueta={tNarratives("keywordsCloud")}
              etiquetaAcción={tNarratives("seeMentionsWith")}
              onSeleccionar={(término) => setPalabraSeleccionada(término.texto)}
            />
          </div>
        </Card>
      )}

      <ModalMencionesPalabra
        palabra={palabraSeleccionada}
        menciones={mencionesPalabraSeleccionada}
        onOpenChange={(abierto) => {
          if (!abierto) setPalabraSeleccionada(null);
        }}
      />
    </div>
  );
}
