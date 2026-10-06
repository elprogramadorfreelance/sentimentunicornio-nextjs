"use client";

import { ChartColumnIcon, PlusIcon, SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DisclaimerDataHistorica } from "@/components/layout";
import { useTema } from "@/components/tema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AvisoMotoresIaInicio } from "@/components/ui/aviso-motores-ia-inicio";
import { ShinyText } from "@/components/ui/shiny-text";
import {
  apiAnalizarConversacion,
  apiListarProyectos,
  apiObtenerProyecto,
  apiPanelGeneral,
} from "@/lib/api";
import type { MetricasProyectoPanel, Proyecto, ResumenProyectos } from "@/types";
import { AvisoFrecuenciaActualizacion } from "./aviso-frecuencia-actualizacion";
import { CalendarioProyectos } from "./calendario-proyectos";
import { FormularioNuevoProyecto } from "./formulario-nuevo-proyecto";
import { ModalActivarProyecto } from "./modal-activar-proyecto";
import { ModalDesactivarProyecto } from "./modal-desactivar-proyecto";
import { ModalEliminarProyecto } from "./modal-eliminar-proyecto";
import { ResumenIaProyectos } from "./resumen-ia-proyectos";
import { StatResumen } from "./stat-resumen";
import { TarjetaProyecto } from "./tarjeta-proyecto";

type VistaProyectosProps = {
  proyectosIniciales: Proyecto[];
  resumenInicial: ResumenProyectos;
  nombreUsuario: string;
  // Pedido explícito del dueño (2026-10-02): este cuadro crea un proyecto
  // real de inmediato (mismo mecanismo que el wizard completo, sin pasar por
  // ninguna de sus validaciones de país/estado/categorías) — se bloquea para
  // cuentas Demo en vez de solo endurecerlo más, mismo criterio ya usado en
  // Búsqueda/Alertas/Facturación/Infografía/Benchmarking.
  esPlanDemo?: boolean;
};

export function VistaProyectos({
  proyectosIniciales,
  resumenInicial,
  nombreUsuario,
  esPlanDemo = false,
}: VistaProyectosProps) {
  const t = useTranslations("projects");
  const tDashboard = useTranslations("dashboard");
  const tNav = useTranslations("nav");
  const { resuelto } = useTema();
  const [proyectos, setProyectos] = useState(proyectosIniciales);
  const [resumen, setResumen] = useState(resumenInicial);
  const [consultaMonitoreo, setConsultaMonitoreo] = useState("");
  const [analizando, setAnalizando] = useState(false);
  const [modalFormAbierto, setModalFormAbierto] = useState(false);
  const [proyectoEdicion, setProyectoEdicion] = useState<Proyecto | null>(null);
  const [proyectoEliminar, setProyectoEliminar] = useState<Proyecto | null>(
    null,
  );
  const [proyectoDesactivar, setProyectoDesactivar] = useState<Proyecto | null>(
    null,
  );
  const [proyectoActivar, setProyectoActivar] = useState<Proyecto | null>(null);
  const [metricasPorProyecto, setMetricasPorProyecto] = useState<
    Record<string, MetricasProyectoPanel>
  >({});

  const refrescar = useCallback(async () => {
    try {
      const data = await apiListarProyectos();
      setProyectos(data.proyectos);
      setResumen(data.resumen);
    } catch {
      // Mantener estado local si el listado falla
    }
    try {
      // Sentimiento real y alerta de crisis real por tarjeta — antes salían
      // de un generador hash (sentimientoPorcentaje/alertaCrisis fijos por
      // id), por eso un proyecto recién creado sin una sola mención ya
      // aparecía con "83% sentimiento" y "Crecimiento de fake news".
      const panel = await apiPanelGeneral(null);
      setMetricasPorProyecto(panel.metricasPorProyecto);
    } catch {
      // Sin métricas reales disponibles: las tarjetas caen a su default (0/ninguna).
    }
  }, []);

  useEffect(() => {
    void refrescar();
  }, [refrescar]);

  function abrirCrear() {
    setProyectoEdicion(null);
    setModalFormAbierto(true);
  }

  async function abrirEditar(proyecto: Proyecto) {
    // Precarga el detalle completo (palabras clave, redes, fuentes) — la
    // fila de la lista solo trae el resumen, y editar con eso de vuelta
    // borraría lo que ya estaba guardado.
    setProyectoEdicion(proyecto);
    setModalFormAbierto(true);
    try {
      const { proyecto: completo } = await apiObtenerProyecto(proyecto.id);
      setProyectoEdicion(completo);
    } catch {
      // Si falla, se queda con los datos resumidos ya cargados.
    }
  }

  async function analizarConversacion(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const consulta = consultaMonitoreo.trim();
    if (!consulta || analizando) return;
    if (esPlanDemo) {
      toast.error(t("analyzeConversationLocked"));
      return;
    }

    setAnalizando(true);
    const idToast = toast.loading(t("analyzingTitle"), {
      description: t("analyzingDesc", { query: consulta }),
    });

    try {
      const { proyecto } = await apiAnalizarConversacion({ tema: consulta });
      toast.success(t("analysisCompleted"), {
        id: idToast,
        description: t("analysisCompletedDesc", { name: proyecto.nombre }),
      });
      setConsultaMonitoreo("");
      await refrescar();
    } catch (error) {
      toast.error(t("analysisFailed"), {
        id: idToast,
        description:
          error instanceof Error ? error.message : t("analysisFailedDescFallback"),
      });
    } finally {
      setAnalizando(false);
    }
  }

  function alCambiarModalForm(abierto: boolean) {
    setModalFormAbierto(abierto);
    if (!abierto) setProyectoEdicion(null);
  }

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
    toast.success(t("created"), {
      description: t("createdAsyncDesc", { name: proyecto.nombre }),
    });
    void refrescar();
    // El análisis automático tarda unos segundos en terminar del lado del
    // servidor — se refresca otra vez para no dejar la tarjeta en "Sin datos"
    // más tiempo del necesario si el usuario se queda viendo la lista.
    setTimeout(() => void refrescar(), 15_000);
    setTimeout(() => void refrescar(), 32_000);
  }

  function alActualizar(proyecto: Proyecto) {
    setProyectos((prev) =>
      prev.map((p) => (p.id === proyecto.id ? proyecto : p)),
    );
    toast.success(t("updated"), {
      description: t("updatedDesc", { name: proyecto.nombre }),
    });
    void refrescar();
  }

  function alCambiarEstado(proyecto: Proyecto) {
    setProyectos((prev) =>
      prev.map((p) => (p.id === proyecto.id ? proyecto : p)),
    );
    setResumen((prev) => ({
      ...prev,
      activos: Math.max(
        0,
        prev.activos + (proyecto.estado === "activo" ? 1 : -1),
      ),
    }));
    if (proyecto.estado === "inactivo") {
      toast.success(t("deactivated"), {
        description: t("deactivatedDesc", { name: proyecto.nombre }),
      });
      setProyectoDesactivar(null);
    } else {
      toast.success(t("activated"), {
        description: t("activatedDesc", { name: proyecto.nombre }),
      });
      setProyectoActivar(null);
    }
    void refrescar();
  }

  function alEliminar(id: string) {
    const eliminado = proyectos.find((p) => p.id === id);
    setProyectos((prev) => prev.filter((p) => p.id !== id));
    setResumen((prev) => ({
      ...prev,
      usados: Math.max(0, prev.usados - 1),
      activos:
        eliminado?.estado === "activo"
          ? Math.max(0, prev.activos - 1)
          : prev.activos,
    }));
    toast.success(t("deleted"), {
      description: eliminado
        ? t("deletedDesc", { name: eliminado.nombre })
        : t("deletedDescFallback"),
    });
    setProyectoEliminar(null);
    void refrescar();
  }

  return (
    <div className="flex flex-col gap-6">
      <AvisoMotoresIaInicio />
      <DisclaimerDataHistorica />
      <div>
        <h1 className="text-left text-2xl font-bold tracking-tight lg:text-3xl">
          <ShinyText
            text={tNav("welcomeUser", { name: nombreUsuario })}
            color={resuelto === "dark" ? "#1bb8e1" : "#0056a4"}
            shineColor="#ffffff"
            speed={3}
            delay={0.6}
            spread={110}
            direction="left"
            className="font-bold"
          />
        </h1>
        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-text-muted">
          {tDashboard("listSubtitle")}
          <span className="inline-flex items-center gap-1 text-xs text-text-muted/80">
            · {tDashboard("updateFrequencyPill")}
            <AvisoFrecuenciaActualizacion />
          </span>
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {resumen.limite > 0 && resumen.usados >= resumen.limite ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="shrink-0 lg:order-first">
                <Button size="default" className="h-10 w-full" disabled>
                  <PlusIcon className="size-4" />
                  {t("newProject")}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{tDashboard("newProjectLimitReached")}</TooltipContent>
          </Tooltip>
        ) : (
          <Button
            size="default"
            className="h-10 shrink-0 lg:order-first"
            onClick={abrirCrear}
          >
            <PlusIcon className="size-4" />
            {t("newProject")}
          </Button>
        )}

        <form
          className="flex min-w-0 flex-1 lg:mx-auto lg:max-w-2xl"
          onSubmit={analizarConversacion}
        >
          <div className="relative min-w-0 flex-1">
            <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
              aria-hidden
            />
            <Input
              type="search"
              value={consultaMonitoreo}
              onChange={(evento) => setConsultaMonitoreo(evento.target.value)}
              placeholder={t("monitorPlaceholder")}
              aria-label={t("monitorAria")}
              disabled={analizando}
              className="h-10 rounded-r-none border-r-0 pl-9 focus-visible:relative focus-visible:z-10"
            />
          </div>
          <Button
            type="submit"
            className="h-10 shrink-0 rounded-l-none px-4"
            disabled={!consultaMonitoreo.trim() || analizando}
          >
            <ChartColumnIcon className="size-4" />
            <span className="hidden sm:inline">
              {analizando ? t("analyzing") : t("analyzeConversation")}
            </span>
            <span className="sm:hidden">{analizando ? t("analyzing") : t("analyze")}</span>
          </Button>
        </form>

        <div className="hidden w-[137px] shrink-0 lg:block" aria-hidden />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-stretch">
        <StatResumen
          etiqueta={t("filterActive")}
          valor={resumen.activos}
          descripcion={t("statsActive")}
        />
        <StatResumen
          etiqueta={t("statsAvailable", {
            used: resumen.usados,
            limit: resumen.limite,
          })}
          valor={`${resumen.usados}/${resumen.limite}`}
          descripcion={t("statsUsed")}
          progreso={{ actual: resumen.usados, total: resumen.limite }}
        />
        <ResumenIaProyectos
          proyectos={proyectos}
          resumen={resumen}
          metricasPorProyecto={metricasPorProyecto}
        />
        <CalendarioProyectos />
      </div>

      <div>
        <div className="mb-3">
          <h2 className="text-base font-bold text-text-primary">
            {t("listTitle")}
          </h2>
          <p className="text-xs text-text-muted">{t("listHelp")}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {proyectos.map((proyecto) => {
            const m = metricasPorProyecto[proyecto.id];
            return (
              <TarjetaProyecto
                key={proyecto.id}
                proyecto={proyecto}
                metricas={
                  m
                    ? { sentimientoPorcentaje: m.favorabilidad, alertaCrisis: m.alertaCrisis }
                    : undefined
                }
                sinDatos={!m || m.clasificadas === 0}
                onEditar={abrirEditar}
                onDesactivar={setProyectoDesactivar}
                onActivar={setProyectoActivar}
                onEliminar={setProyectoEliminar}
              />
            );
          })}
        </div>
      </div>

      <FormularioNuevoProyecto
        abierto={modalFormAbierto}
        onAbiertoChange={alCambiarModalForm}
        proyectoEdicion={proyectoEdicion}
        onCreado={alCrear}
        onActualizado={alActualizar}
      />

      <ModalDesactivarProyecto
        proyecto={proyectoDesactivar}
        abierto={!!proyectoDesactivar}
        onAbiertoChange={(abierto) => {
          if (!abierto) setProyectoDesactivar(null);
        }}
        onDesactivado={alCambiarEstado}
      />

      <ModalActivarProyecto
        proyecto={proyectoActivar}
        abierto={!!proyectoActivar}
        onAbiertoChange={(abierto) => {
          if (!abierto) setProyectoActivar(null);
        }}
        onActivado={alCambiarEstado}
      />

      <ModalEliminarProyecto
        proyecto={proyectoEliminar}
        abierto={!!proyectoEliminar}
        onAbiertoChange={(abierto) => {
          if (!abierto) setProyectoEliminar(null);
        }}
        onEliminado={alEliminar}
      />
    </div>
  );
}
