"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  agregarDías,
  díaSemanaLunes,
  generarCeldasRango,
  inicioDelDía,
} from "@/lib/calendar";
import { META_TIPO_EVENTO, obtenerEventosAgendaMock } from "@/lib/mock/agenda";
import { cn } from "@/lib/utils";
import type { EventoAgenda, TipoEventoAgenda } from "@/types";

type CalendarioProyectosProps = {
  eventos?: EventoAgenda[];
  className?: string;
  /** Días a mostrar incluyendo hoy. Por defecto 7 (hoy + 6 próximos). */
  dias?: number;
};

/**
 * Franja de agenda de solo lectura: día actual + próximos.
 * Sin selección de rango ni navegación de mes.
 */
export function CalendarioProyectos({
  eventos: eventosProp,
  className,
  dias = 7,
}: CalendarioProyectosProps) {
  const t = useTranslations("dates");
  const meses = useMemo(
    () => [
      t("monthJanuary"),
      t("monthFebruary"),
      t("monthMarch"),
      t("monthApril"),
      t("monthMay"),
      t("monthJune"),
      t("monthJuly"),
      t("monthAugust"),
      t("monthSeptember"),
      t("monthOctober"),
      t("monthNovember"),
      t("monthDecember"),
    ],
    [t],
  );
  const diasSemanaEtiquetas = useMemo(
    () => [
      t("weekdayMon"),
      t("weekdayTue"),
      t("weekdayWed"),
      t("weekdayThu"),
      t("weekdayFri"),
      t("weekdaySat"),
      t("weekdaySun"),
    ],
    [t],
  );
  const hoy = useMemo(() => inicioDelDía(new Date()), []);
  const fin = useMemo(
    () => agregarDías(hoy, Math.max(1, dias) - 1),
    [hoy, dias],
  );

  const eventos = useMemo(
    () => eventosProp ?? obtenerEventosAgendaMock(hoy),
    [eventosProp, hoy],
  );

  const celdas = useMemo(() => generarCeldasRango(hoy, fin, hoy), [hoy, fin]);

  const eventosPorFecha = useMemo(() => {
    const mapa = new Map<string, EventoAgenda[]>();
    for (const ev of eventos) {
      const lista = mapa.get(ev.fecha) ?? [];
      lista.push(ev);
      mapa.set(ev.fecha, lista);
    }
    return mapa;
  }, [eventos]);

  return (
    <section
      className={cn(
        "flex h-full min-h-[7.5rem] flex-col justify-between gap-2 overflow-hidden rounded-xl border border-border-default bg-bg-base px-3 py-3.5 sm:px-4",
        className,
      )}
      aria-labelledby="calendario-proyectos-titulo"
    >
      <h3
        id="calendario-proyectos-titulo"
        className="shrink-0 text-center text-sm font-bold tracking-tight text-text-primary"
      >
        {meses[hoy.getMonth()]}
        <span className="ml-1.5 text-xs font-medium text-text-muted">
          {hoy.getFullYear()}
        </span>
      </h3>

      <div
        className="grid min-h-0 flex-1 content-center items-center gap-x-0.5"
        style={{
          gridTemplateColumns: `repeat(${celdas.length}, minmax(0, 1fr))`,
        }}
      >
        {celdas.map((celda) => {
          const eventosDía = eventosPorFecha.get(celda.iso) ?? [];
          const tiposDía = [
            ...new Set(eventosDía.map((e) => e.tipo)),
          ] as TipoEventoAgenda[];
          const etiquetaDía = t(celda.esHoy ? "dayAriaToday" : "dayAria", {
            day: celda.numero,
            month: meses[celda.fecha.getMonth()],
            year: celda.fecha.getFullYear(),
          });

          return (
            <div
              key={celda.iso}
              className="flex flex-col items-center justify-center gap-1 py-0.5"
              title={etiquetaDía}
            >
              <span className="text-[9px] font-bold tracking-wide text-navy">
                {diasSemanaEtiquetas[díaSemanaLunes(celda.fecha)]}
              </span>
              <div
                className={cn(
                  "relative flex size-8 items-center justify-center rounded-full text-xs font-medium",
                  celda.esHoy
                    ? "bg-primary text-primary-fg"
                    : "text-text-primary",
                )}
              >
                <span className="sr-only">{etiquetaDía}</span>
                <span className="leading-none" aria-hidden>
                  {celda.numero}
                </span>
                {tiposDía.length > 0 && (
                  <span className="pointer-events-none absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-0.5">
                    {tiposDía.slice(0, 2).map((tipo) => (
                      <span
                        key={tipo}
                        className={cn(
                          "size-1 shrink-0 rounded-full",
                          celda.esHoy
                            ? "bg-primary-fg/90"
                            : META_TIPO_EVENTO[tipo].punto,
                        )}
                        aria-hidden
                      />
                    ))}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
