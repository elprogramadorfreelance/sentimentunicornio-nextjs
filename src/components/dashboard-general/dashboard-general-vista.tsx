"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertasActivasWidget,
  CalendarioWidget,
  DesinformacionWidget,
  MencionesTotalesWidget,
  PalabrasClaveWidget,
  TendenciasWidget,
  TraficoFuentesWidget,
} from "@/components/dashboard";
import { AvisoLimitePlan, DisclaimerDataHistorica, EstadoSinProyectos } from "@/components/layout";
import {
  AvisoActualizacion,
  BannerEstadoAnalisis,
  FormularioNuevoProyecto,
  ResumenIaProyectos,
  ResumenIaReal,
} from "@/components/proyectos";
import { apiAnalisisReal, apiListarProyectos, apiMenciones, apiPanelGeneral } from "@/lib/api";
import { useProyectosActivos } from "@/lib/hooks/use-proyectos-activos";
import { mencionesConPalabra } from "@/lib/palabras-clave-cliente";
import { guardarRangoRecordado, leerRangoRecordado } from "@/lib/rango-calendario-seleccionado";
import { ModalMencionesPalabra } from "@/components/narrativas";
import type {
  AnálisisReal,
  MenciónEditorial,
  Proyecto,
  RangoFechas,
  ResumenProyectos,
  RespuestaPanelGeneral,
} from "@/types";
import { AlcanceFuenteWidget } from "./alcance-fuente-widget";
import { AlcanceTotalWidget } from "./alcance-total-widget";
import { DashboardGeneralSkeleton } from "./dashboard-general-skeleton";
import { ImagenesVideosWidget } from "./imagenes-videos-widget";
import { NssPorTemaWidget } from "./nss-por-tema-widget";
import { PaisesCoberturaWidget } from "./paises-cobertura-widget";
import { PromedioMencionesWidget } from "./promedio-menciones-widget";
import { RendimientoMencionesWidget } from "./rendimiento-menciones-widget";
import { ResumenGeneralWidget } from "./resumen-general-widget";
import { TendenciaAlcanceWidget } from "./tendencia-alcance-widget";
import { TendenciaMencionesAlcanceWidget } from "./tendencia-menciones-alcance-widget";
import { TonalidadFuenteWidget } from "./tonalidad-fuente-widget";
import { TopEmisoresWidget } from "./top-emisores-widget";

/**
 * Antes solo miraba la cantidad absoluta clasificada (< 10). Eso deja pasar
 * casos donde la muestra es chica EN PROPORCIÓN al total real aunque el
 * número absoluto ya cruce 10 — ej. 40 de 328 menciones (12%): 40 se ve como
 * "suficiente" pero es una fracción curada por la IA (lo más "noticiable",
 * casi siempre lo más polémico), no una muestra representativa. Menos del
 * 30% de cobertura real también cuenta como muestra pequeña.
 */
function muestraSentimientoPequeña(sentimiento: { clasificadas: number; total: number }): boolean {
  if (sentimiento.clasificadas < 10) return true;
  if (sentimiento.total === 0) return false;
  return sentimiento.clasificadas / sentimiento.total < 0.3;
}

type DashboardGeneralVistaProps = {
  proyectos: Proyecto[];
  resumen: ResumenProyectos;
};

function DashboardGeneralContenido({
  proyectos,
  proyectosFiltrados,
  resumen,
  datosPanel,
  proyectoActivo,
  análisis,
  onNuevoProyecto,
  rangoCalendario,
  onRangoCalendario,
  onAnalisisCompletado,
}: DashboardGeneralVistaProps & {
  proyectosFiltrados: Proyecto[];
  datosPanel: RespuestaPanelGeneral;
  proyectoActivo: Proyecto | null;
  análisis: AnálisisReal | null;
  onNuevoProyecto: () => void;
  rangoCalendario: RangoFechas | null;
  onRangoCalendario: (rango: RangoFechas | null) => void;
  onAnalisisCompletado: () => void;
}) {
  const t = useTranslations("dashboard");
  const proyectosIa = useMemo(
    () => (proyectoActivo ? [proyectoActivo] : proyectosFiltrados),
    [proyectoActivo, proyectosFiltrados],
  );

  const resumenIa = useMemo(() => {
    if (!proyectoActivo) return resumen;
    return {
      ...resumen,
      activos: proyectoActivo.estado === "activo" ? 1 : 0,
      analisisRealizados: proyectoActivo.analisis,
      alertasActivas: datosPanel.alertas.length,
      usados: 1,
    };
  }, [proyectoActivo, resumen, datosPanel.alertas.length]);

  // "Principales temas de conversación": antes cada tema enlazaba a la URL
  // de UNA sola mención (la más reciente con ese título exacto) — ej. un
  // canal de YouTube ajeno al tema. Un tema es justamente lo que MÁS se
  // repite, así que al hacer clic se trae (bajo demanda, no en la carga
  // normal del panel) el listado real de menciones y se muestran todas con
  // ese título, mismo patrón ya probado en Narrativas.
  const [temaSeleccionado, setTemaSeleccionado] = useState<string | null>(null);
  const [mencionesParaTema, setMencionesParaTema] = useState<MenciónEditorial[]>([]);
  const [cargandoTema, setCargandoTema] = useState(false);

  // Las menciones del tema vienen del mismo cálculo que lo rankea (ver
  // calcularTendenciasEmergentes), así que el modal nunca queda vacío y no se
  // vuelve a buscar por texto.
  function abrirTema(nombre: string) {
    const tema = datosPanel?.tendencias.find((t) => t.nombre === nombre);
    setTemaSeleccionado(nombre);
    setMencionesParaTema(tema?.menciones ?? []);
    setCargandoTema(false);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {proyectoActivo && (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <BannerEstadoAnalisis
            proyectoId={proyectoActivo.id}
            onCompletado={onAnalisisCompletado}
            className="min-w-0 flex-1"
          />
          <AvisoActualizacion proyectoId={proyectoActivo.id} />
        </div>
      )}
      <div className="dashboard-general-bento">
      <div data-area="resumen" className="min-h-0">
        <ResumenGeneralWidget
          className="h-full"
          proyectosActivos={resumenIa.activos}
          proyectoActivoNombre={proyectoActivo?.nombre ?? null}
          onNuevoProyecto={onNuevoProyecto}
          límiteProyectosAlcanzado={resumen.limite > 0 && resumen.usados >= resumen.limite}
        />
      </div>
      <div data-area="kpis" className="dashboard-general-kpis min-h-0">
        <MencionesTotalesWidget
          className="h-full"
          variante="compacta"
          total={datosPanel.menciones.total}
          cambio={datosPanel.menciones.cambio}
          cambioAbsoluto={datosPanel.menciones.cambioAbsoluto}
          dias={datosPanel.menciones.dias}
        />
        <AlcanceTotalWidget
          className="h-full"
          variante="compacta"
          total={datosPanel.alcanceTotal.total}
          cambio={datosPanel.alcanceTotal.cambio}
          cambioAbsoluto={datosPanel.alcanceTotal.cambioAbsoluto}
          dias={datosPanel.alcanceTotal.dias}
        />
        <DesinformacionWidget
          className="h-full"
          variante="compacta"
          porcentaje={datosPanel.sentimiento.favorabilidad}
          actualizacion={
            datosPanel.sentimiento.total > 0
              ? t("basedOnClassified", {
                  classified: datosPanel.sentimiento.clasificadas,
                  total: datosPanel.sentimiento.total,
                })
              : t("noMentionsToCalculate")
          }
          muestraPequeña={muestraSentimientoPequeña(datosPanel.sentimiento)}
          sinDatos={datosPanel.sentimiento.total === 0}
        />
        <PromedioMencionesWidget
          className="h-full"
          variante="compacta"
          total={datosPanel.menciones.total}
          cambio={datosPanel.menciones.cambio}
          cambioAbsoluto={datosPanel.menciones.cambioAbsoluto}
          dias={datosPanel.menciones.dias}
        />
      </div>
      <div data-area="alertas" className="min-h-0 overflow-hidden">
        <AlertasActivasWidget className="h-full" alertas={datosPanel.alertas} />
      </div>
      <div data-area="ia" className="min-h-0 overflow-hidden">
        {proyectoActivo ? (
          <ResumenIaReal análisis={análisis} className="h-full" />
        ) : (
          <ResumenIaProyectos
            className="h-full"
            proyectos={proyectosIa}
            resumen={resumenIa}
            metricasPorProyecto={datosPanel.metricasPorProyecto}
            alertas={datosPanel.alertas}
            detallado
          />
        )}
      </div>
      <div data-area="calendar" className="min-h-0 overflow-hidden">
        <CalendarioWidget
          className="h-full"
          eventos={[]}
          rangoInicial={rangoCalendario}
          onRangoChange={onRangoCalendario}
          máximoDías={datosPanel?.límiteHistórico?.activo ? datosPanel.límiteHistórico.días : null}
        />
      </div>
      <div data-area="paises" className="min-h-0">
        <PaisesCoberturaWidget className="h-full" regiones={datosPanel.regiones} />
      </div>
      <div data-area="emisores" className="min-h-0 overflow-hidden">
        <TopEmisoresWidget className="h-full" emisores={datosPanel.topEmisores} />
      </div>
      <div data-area="alcance-fuente" className="min-h-0 overflow-hidden">
        <AlcanceFuenteWidget className="h-full" fuentes={datosPanel.alcancePorFuente} />
      </div>
      <div data-area="tendencia-combo" className="min-h-0">
        <TendenciaMencionesAlcanceWidget
          className="h-full"
          puntos={datosPanel.tendenciaMencionesAlcance}
        />
      </div>
      <div data-area="nss-tema" className="min-h-0">
        <NssPorTemaWidget className="h-full" temas={datosPanel.nssPorTema} />
      </div>
      <div data-area="tendencias" className="min-h-0 overflow-hidden">
        <TendenciasWidget
          className="h-full"
          tendencias={datosPanel.tendencias}
          onTemaClick={abrirTema}
        />
      </div>
      <div data-area="keywords" className="min-h-0 overflow-hidden">
        <PalabrasClaveWidget className="h-full" palabras={datosPanel.palabrasClave} />
      </div>
      <div data-area="tendencia-alcance" className="min-h-0">
        <TendenciaAlcanceWidget
          className="h-full"
          puntos={datosPanel.tendenciaAlcance}
        />
      </div>
      <div data-area="tonalidad" className="min-h-0">
        <TonalidadFuenteWidget className="h-full" fuentes={datosPanel.tonalidad} />
      </div>
      <div data-area="trafico" className="min-h-0 overflow-hidden">
        <TraficoFuentesWidget className="h-full" fuentes={datosPanel.trafico} />
      </div>
      <div data-area="rendimiento" className="min-h-0">
        <RendimientoMencionesWidget
          className="h-full"
          proyectos={proyectos}
          puntos={datosPanel.rendimiento}
        />
      </div>
      <div data-area="imagenes" className="min-h-0 overflow-hidden">
        <ImagenesVideosWidget
          className="h-full"
          media={datosPanel.video}
          total={datosPanel.videoTotal}
        />
      </div>
      </div>

      <ModalMencionesPalabra
        palabra={temaSeleccionado ? limpiarEtiquetaTema(temaSeleccionado) : null}
        menciones={mencionesParaTema}
        cargando={cargandoTema}
        onOpenChange={(abierto) => {
          if (!abierto) setTemaSeleccionado(null);
        }}
      />
    </div>
  );
}

/** Panel general en /proyectos: agregado o filtrado por el selector multi-proyecto del sidebar. */
// El nombre del tema trae restos del titular original ("🔴#AHORA| “No puede…”")
// — se quitan signos sueltos de los extremos para que el título del modal se lea.
function limpiarEtiquetaTema(texto: string): string {
  return texto
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .replace(/[^\p{L}\p{N}]+$/u, "")
    .trim();
}

export function DashboardGeneralVista({
  proyectos: proyectosIniciales,
  resumen: resumenInicial,
}: DashboardGeneralVistaProps) {
  const t = useTranslations("dashboard");
  const tProjects = useTranslations("projects");
  const tCommon = useTranslations("common");
  const [proyectos, setProyectos] = useState(proyectosIniciales);
  const [resumen, setResumen] = useState(resumenInicial);
  const [datosPanel, setDatosPanel] = useState<RespuestaPanelGeneral | null>(null);
  const [análisis, setAnálisis] = useState<AnálisisReal | null>(null);
  const [modalFormAbierto, setModalFormAbierto] = useState(false);
  const [rangoCalendario, setRangoCalendario] = useState<RangoFechas | null>(null);
  // Se incrementa cuando el banner de "todavía recolectando información"
  // detecta que el análisis en curso terminó — fuerza a recargar el panel y
  // el resumen de IA sin que el usuario tenga que refrescar la página él mismo.
  const [refreshTick, setRefreshTick] = useState(0);

  const { esTodos, idsEfectivos, sinSeleccion } = useProyectosActivos();

  const proyectosFiltrados = useMemo(() => {
    if (esTodos) return proyectos;
    return proyectos.filter((p) => idsEfectivos.includes(p.id));
  }, [esTodos, idsEfectivos, proyectos]);

  const proyectoActivo =
    !esTodos && proyectosFiltrados.length === 1 ? proyectosFiltrados[0] : null;

  function cambiarRangoCalendario(rango: RangoFechas | null) {
    setRangoCalendario(rango);
    guardarRangoRecordado(rango);
  }

  // Hereda el último rango de fechas elegido en cualquier página (Dashboard o
  // Menciones) — solo una vez al montar, ya que el rango es puro estado de
  // cliente (no vive en la URL como antes vivía el proyecto). Si el usuario
  // ya eligió un rango en esta misma sesión de la página, no lo pisa.
  useEffect(() => {
    const recordado = leerRangoRecordado();
    if (recordado) setRangoCalendario(recordado);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (sinSeleccion) return;
    let cancelado = false;
    apiPanelGeneral(esTodos ? null : idsEfectivos, rangoCalendario)
      .then((datos) => {
        if (!cancelado) setDatosPanel(datos);
      })
      .catch(() => {
        if (!cancelado) {
          setDatosPanel({
            proyectoId: proyectoActivo?.id ?? null,
            menciones: { total: 0, cambio: 0, dias: [0, 0, 0, 0, 0, 0, 0] },
            sentimiento: { positivo: 0, negativo: 0, neutro: 0, favorabilidad: 50, clasificadas: 0, total: 0 },
            alertas: [],
            trafico: [],
            tonalidad: [],
            alcanceTotal: { total: 0, cambio: 0, cambioAbsoluto: 0, dias: [0, 0, 0, 0, 0, 0, 0] },
            alcancePorFuente: [],
            regiones: [],
            tendencias: [],
            palabrasClave: [],
            video: [],
            videoTotal: 0,
            tendenciaAlcance: [],
            tendenciaMencionesAlcance: [],
            rendimiento: [],
            metricasPorProyecto: {},
            nssPorTema: [],
            topEmisores: [],
          });
          toast.error(t("loadError"), {
            description: t("loadErrorDesc"),
          });
        }
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esTodos, idsEfectivos, rangoCalendario, refreshTick, sinSeleccion]);

  // Bug real (2026-10-02): `rangoCalendario` se hereda de localStorage
  // (leerRangoRecordado, arriba) sin importar qué tan amplio sea ni la
  // cuenta de origen — una cuenta Demo (plan "basic", tope real de
  // `límiteHistórico.días`) podía heredar un rango de 30 días elegido antes
  // en otra página/cuenta, y aunque el backend SÍ recorta los datos
  // (aplicarLímiteHistóricoPlan), el calendario seguía pintando ese rango
  // completo como "seleccionado" — se veía el mes entero en azul en vez de
  // solo los últimos N días. El backend ya manda el tope real en cada
  // respuesta del panel; si el rango heredado no cabe ahí, se descarta y
  // el calendario cae de vuelta a su default real (últimos N días).
  useEffect(() => {
    const límite = datosPanel?.límiteHistórico;
    if (!límite?.activo || !rangoCalendario) return;
    const inicioMs = new Date(`${rangoCalendario.inicio}T00:00:00`).getTime();
    const finMs = new Date(`${rangoCalendario.fin}T00:00:00`).getTime();
    const díasElegidos = Math.round((finMs - inicioMs) / 86_400_000) + 1;
    if (díasElegidos > límite.días) {
      setRangoCalendario(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datosPanel?.límiteHistórico]);

  useEffect(() => {
    if (!proyectoActivo) {
      setAnálisis(null);
      return;
    }
    let cancelado = false;
    apiAnalisisReal(proyectoActivo.id).then((datos) => {
      if (!cancelado) setAnálisis(datos);
    });
    return () => {
      cancelado = true;
    };
  }, [proyectoActivo, refreshTick]);

  const refrescar = useCallback(async () => {
    try {
      const data = await apiListarProyectos();
      setProyectos(data.proyectos);
      setResumen(data.resumen);
    } catch {
      // Mantener estado local si el listado falla
    }
  }, []);

  function alCrear(proyecto: Proyecto) {
    setProyectos((prev) => [
      proyecto,
      ...prev.filter((p) => p.id !== proyecto.id),
    ]);
    setResumen((prev) => ({
      ...prev,
      usados: prev.usados + 1,
      activos: prev.activos + 1,
    }));
    toast.success(tProjects("created"), {
      description: tProjects("createdDesc", { name: proyecto.nombre }),
    });
    void refrescar();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DisclaimerDataHistorica />
      {datosPanel?.límiteHistórico?.activo && (
        <AvisoLimitePlan días={datosPanel.límiteHistórico.días} className="mb-3" />
      )}
      {sinSeleccion ? (
        <div className="flex flex-col gap-4">
          <ResumenGeneralWidget
            proyectosActivos={resumen.activos}
            proyectoActivoNombre={null}
            onNuevoProyecto={() => setModalFormAbierto(true)}
            límiteProyectosAlcanzado={resumen.limite > 0 && resumen.usados >= resumen.limite}
          />
          <EstadoSinProyectos
            titulo={tCommon("selectAtLeastOneProject")}
            descripcion={tCommon("selectAtLeastOneHint")}
          />
        </div>
      ) : datosPanel ? (
        <DashboardGeneralContenido
          proyectos={proyectos}
          proyectosFiltrados={proyectosFiltrados}
          resumen={resumen}
          datosPanel={datosPanel}
          proyectoActivo={proyectoActivo}
          análisis={análisis}
          onNuevoProyecto={() => setModalFormAbierto(true)}
          rangoCalendario={rangoCalendario}
          onRangoCalendario={cambiarRangoCalendario}
          onAnalisisCompletado={() => setRefreshTick((t) => t + 1)}
        />
      ) : (
        <DashboardGeneralSkeleton />
      )}

      <FormularioNuevoProyecto
        abierto={modalFormAbierto}
        onAbiertoChange={setModalFormAbierto}
        proyectoEdicion={null}
        onCreado={alCrear}
      />
    </div>
  );
}
