"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DisclaimerDataHistorica, EstadoSinProyectos } from "@/components/layout";
import { ModalMencionesNarrativa } from "@/components/narrativas";
import { ModalEvidenciaAlerta } from "./modal-evidencia-alerta";
import { Badge, Card, Skeleton } from "@/components/ui";
import type { AlertaDetalle } from "@/lib/alertas-backend";
import { apiAlertas } from "@/lib/api";
import { useProyectosActivos } from "@/lib/hooks/use-proyectos-activos";
import { cn } from "@/lib/utils";

const VARIANTE_BADGE = {
  critica: "error",
  advertencia: "warning",
  info: "default",
} as const;

// Las 6 reglas automáticas del sistema (ver DEFAULT_RULES en alert-engine.js)
// guardaban todas 'auto' como alert_type hasta 2026-10-02 — ahora cada una
// guarda su rule_type real (necesario para que getAlertEvidence sepa
// despachar la evidencia correcta), así que la etiqueta debe reconocer
// cualquiera de las 6 como "automática", no solo el valor legado 'auto'.
const TIPOS_SISTEMA = new Set([
  "auto", "negative_spike", "sentiment_drop", "critical_keywords",
  "sensitive_source", "narrative_growth", "high_risk_amplifier",
]);
function etiquetaTipo(tipo: string, t: ReturnType<typeof useTranslations<"alerts">>): string {
  if (tipo === "ai") return t("typeAi");
  if (TIPOS_SISTEMA.has(tipo)) return t("typeAuto");
  return t("typeCustom");
}

export function AlertasVista() {
  const t = useTranslations("alerts");
  const tCommon = useTranslations("common");
  const ETIQUETA_NIVEL = {
    critica: t("levelCritical"),
    advertencia: t("levelWarning"),
    info: t("levelInfo"),
  } as const;
  // Selector multi-proyecto del sidebar: "todos" o 2+ seleccionados trae las
  // alertas de todos esos proyectos (subconjunto real, filtrado en el route).
  const { idsEfectivos, sinSeleccion } = useProyectosActivos();
  const [alertas, setAlertas] = useState<AlertaDetalle[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [narrativaAbierta, setNarrativaAbierta] = useState<{ id: string; nombre: string } | null>(null);
  const [evidenciaAbierta, setEvidenciaAbierta] = useState<{ id: string; título: string } | null>(null);
  const claveProyectos = idsEfectivos.join(",");
  // Deep-link real desde el panel de notificaciones (antes el click no
  // llevaba a ningún lado porque las notificaciones eran 100% mock, sin un
  // id real detrás que resaltar).
  const searchParams = useSearchParams();
  const idAResaltar = searchParams.get("resaltar");

  useEffect(() => {
    if (sinSeleccion) {
      setAlertas([]);
      setError(null);
      return;
    }
    let cancelado = false;
    setAlertas(null);
    setError(null);
    apiAlertas(idsEfectivos)
      .then((respuesta) => {
        if (!cancelado) setAlertas(respuesta.alertas);
      })
      .catch((err: unknown) => {
        if (!cancelado) {
          setError(err instanceof Error ? err.message : t("feedLoadError"));
        }
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveProyectos, sinSeleccion]);

  // Una vez que cargan las alertas reales, si venimos de una notificación
  // (?resaltar=id) hace scroll hasta esa tarjeta específica.
  useEffect(() => {
    if (!idAResaltar || !alertas) return;
    const el = document.getElementById(`alerta-${idAResaltar}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [idAResaltar, alertas]);

  const abiertas = alertas?.filter((a) => a.estado === "abierta") ?? [];
  const resueltas = alertas?.filter((a) => a.estado === "resuelta") ?? [];

  // Reintentado 2026-10-02 (la primera vez se revirtió: el 50-77% de las
  // narrativas no tenían evidencia real citada, así que el modal salía
  // vacío casi siempre). Esta vez el BACKEND ya filtra — getAlertsByProject/
  // getAllAlertsForUser (db.js) solo devuelven alertas de narrativa que SÍ
  // tienen evidencia real citada (mismo criterio exacto que usa este modal),
  // así que cualquier alerta de narrativa que llega aquí está garantizado
  // que tiene contenido real que mostrar.
  // "evidencia" (2026-10-02, pedido de Darinka): el resto de tipos
  // (sentiment_drop/negative_spike/critical_keywords/sensitive_source/
  // high_risk_amplifier) abren el modal genérico — getAlertEvidence (db.js)
  // puede devolver un resultado vacío honesto si no hay match, a diferencia
  // de narrativas no hay un filtro previo que lo garantice siempre.
  const irAEnlace = (alerta: AlertaDetalle) => {
    if (!alerta.enlace) return;
    if (alerta.enlace.destino === "narrativas") {
      setNarrativaAbierta({ id: alerta.enlace.id, nombre: alerta.título });
      return;
    }
    setEvidenciaAbierta({ id: alerta.enlace.id, título: alerta.título });
  };

  return (
    <div className="flex flex-col gap-6">
      <DisclaimerDataHistorica />
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("title")}</h1>
          <p className="mt-1 text-sm text-text-muted">{t("feedSubtitle")}</p>
        </div>
      </header>

      {sinSeleccion ? (
        <EstadoSinProyectos
          titulo={tCommon("selectAtLeastOneProject")}
          descripcion={t("selectProjectHintFeed")}
        />
      ) : error ? (
        <Card className="border-error/30 bg-error/5 text-sm text-error">{error}</Card>
      ) : !alertas ? (
        <div className="space-y-3">
          {["a", "b", "c", "d"].map((id) => (
            <Skeleton key={id} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-sm font-bold text-text-primary">
              {t("openCount", { count: abiertas.length })}
            </h2>
            {abiertas.length === 0 ? (
              <Card className="bg-bg-base py-8 text-center text-sm text-text-muted">
                {t("noOpenAlerts")}
              </Card>
            ) : (
              <ul className="space-y-2">
                {abiertas.map((alerta) => (
                  <li key={alerta.id} id={`alerta-${alerta.id}`}>
                    <Card
                      className={cn(
                        "flex items-start justify-between gap-3 border-l-4 bg-bg-base p-3 transition-shadow",
                        alerta.nivel === "critica" && "border-l-error",
                        alerta.nivel === "advertencia" && "border-l-warning",
                        alerta.nivel === "info" && "border-l-sky",
                        idAResaltar === alerta.id && "ring-2 ring-accent ring-offset-2 ring-offset-bg-base",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <Badge variante={VARIANTE_BADGE[alerta.nivel]}>
                            {ETIQUETA_NIVEL[alerta.nivel]}
                          </Badge>
                          <span className="text-xs font-medium text-text-secondary">
                            {alerta.proyecto}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            · {etiquetaTipo(alerta.tipo, t)}
                          </span>
                        </div>
                        <p className="text-sm text-text-primary">{alerta.mensaje}</p>
                        {alerta.enlace && (
                          <button
                            type="button"
                            onClick={() => irAEnlace(alerta)}
                            className="mt-1.5 text-xs font-medium text-accent hover:underline"
                          >
                            {alerta.enlace.destino === "narrativas"
                              ? t("viewNarrative")
                              : t("viewEvidence")}
                          </button>
                        )}
                      </div>
                      <span className="shrink-0 text-[10px] text-text-muted">
                        {new Date(alerta.creadaEn).toLocaleDateString("es-MX", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {resueltas.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-bold text-text-muted">
                {t("resolvedCount", { count: resueltas.length })}
              </h2>
              <ul className="space-y-2 opacity-60">
                {resueltas.map((alerta) => (
                  <li key={alerta.id}>
                    <Card className="flex items-start justify-between gap-3 bg-bg-base p-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-text-secondary">{alerta.mensaje}</p>
                        <span className="text-[10px] text-text-muted">{alerta.proyecto}</span>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <ModalMencionesNarrativa
        narrativaId={narrativaAbierta?.id ?? null}
        narrativaNombre={narrativaAbierta?.nombre ?? null}
        onOpenChange={(abierto) => {
          if (!abierto) setNarrativaAbierta(null);
        }}
      />
      <ModalEvidenciaAlerta
        alertaId={evidenciaAbierta?.id ?? null}
        alertaTítulo={evidenciaAbierta?.título ?? null}
        onOpenChange={(abierto) => {
          if (!abierto) setEvidenciaAbierta(null);
        }}
      />
    </div>
  );
}
