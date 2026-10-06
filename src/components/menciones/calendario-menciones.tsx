"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import {
  agregarDías,
  aIsoFecha,
  type CeldaCalendario,
  esMismaFecha,
  estáEnRango,
  generarCeldasMes,
  inicioDelDía,
  normalizarRango,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";
import type { RangoFechas } from "@/types";

type CalendarioMencionesProps = {
  className?: string;
  onRangoChange?: (rango: RangoFechas) => void;
  // Rango recordado de otra página (ver rango-calendario-seleccionado.ts) —
  // si viene, se usa en vez del rango "últimos 7 días" por defecto.
  rangoInicial?: RangoFechas | null;
  // Cuentas plan "basic" (Demo): el backend ya acota los datos a N días
  // (aplicarLímiteHistóricoPlan), pero antes el calendario dejaba
  // seleccionar un rango más amplio igual — mostraba "30 días" elegidos
  // mientras los datos reales volvían acotados a 7, confuso. Con esto el
  // propio calendario no deja elegir más de `máximoDías`.
  máximoDías?: number | null;
};

type RangoLocal = {
  inicio: Date;
  fin: Date;
};

function aRangoLocal(rango: RangoFechas): RangoLocal {
  return {
    inicio: inicioDelDía(new Date(`${rango.inicio}T00:00:00`)),
    fin: inicioDelDía(new Date(`${rango.fin}T00:00:00`)),
  };
}

export function CalendarioMenciones({
  className,
  onRangoChange,
  rangoInicial,
  máximoDías = null,
}: CalendarioMencionesProps) {
  const t = useTranslations("dates");
  const mesesTraducidos = useMemo(
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const diasSemanaTraducidos = useMemo(
    () => [
      t("weekdayMon"),
      t("weekdayTue"),
      t("weekdayWed"),
      t("weekdayThu"),
      t("weekdayFri"),
      t("weekdaySat"),
      t("weekdaySun"),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const hoy = useMemo(() => inicioDelDía(new Date()), []);
  // Bug real (2026-10-02): este calendario SÍ recortaba la selección si
  // elegías un rango más amplio que `máximoDías` (abajo en seleccionarDía),
  // pero nunca bloqueaba visualmente los días viejos — a diferencia de
  // CalendarioWidget (el del dashboard), que ya mostraba los días fuera del
  // tope en gris con candado. Mismo criterio aquí ahora.
  const fechaMínima = useMemo(
    () => (máximoDías != null ? agregarDías(hoy, -(máximoDías - 1)) : undefined),
    [hoy, máximoDías],
  );
  const [vista, setVista] = useState(() => {
    const base = rangoInicial ? aRangoLocal(rangoInicial).fin : hoy;
    return { año: base.getFullYear(), mes: base.getMonth() };
  });
  // Período de análisis de menciones ya ocurridas — la banda por default
  // mira hacia atrás (últimos 7 días), nunca hacia el futuro.
  const [rango, setRango] = useState<RangoLocal>(() =>
    rangoInicial ? aRangoLocal(rangoInicial) : { inicio: agregarDías(hoy, -6), fin: hoy },
  );
  const [ancla, setAncla] = useState<Date | null>(null);

  // rangoInicial llega vacío en el primer render (el padre lo adopta de
  // localStorage recién después de montar) — cuando por fin llega, refleja
  // ese rango en el calendario en vez de dejarlo pegado en el default.
  useEffect(() => {
    if (!rangoInicial) return;
    const local = aRangoLocal(rangoInicial);
    setRango(local);
    setVista({ año: local.fin.getFullYear(), mes: local.fin.getMonth() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangoInicial?.inicio, rangoInicial?.fin]);

  const celdas = useMemo(
    () => generarCeldasMes(vista.año, vista.mes, hoy, fechaMínima),
    [vista.año, vista.mes, hoy, fechaMínima],
  );
  const rangoVisible = ancla ? { inicio: ancla, fin: ancla } : rango;

  function cambiarMes(delta: number) {
    setVista((actual) => {
      const siguiente = new Date(actual.año, actual.mes + delta, 1);
      return {
        año: siguiente.getFullYear(),
        mes: siguiente.getMonth(),
      };
    });
  }

  function seleccionarDía(celda: CeldaCalendario) {
    // No hay menciones del futuro que filtrar — no tiene sentido dejar
    // seleccionar fechas por venir (mismo criterio que CalendarioWidget).
    if (celda.esFuturo || celda.esMuyAntiguo) return;

    const día = inicioDelDía(celda.fecha);

    if (!ancla) {
      setAncla(día);
      return;
    }

    let siguiente = normalizarRango(ancla, día);
    if (máximoDías != null) {
      const spanMs = siguiente.fin.getTime() - siguiente.inicio.getTime();
      const máximoMs = (máximoDías - 1) * 24 * 60 * 60 * 1000;
      if (spanMs > máximoMs) {
        // El ancla es el punto donde el usuario empezó a elegir — se acota
        // desde ahí hacia el otro extremo, nunca "se mueve" el ancla.
        siguiente =
          día.getTime() >= ancla.getTime()
            ? { inicio: ancla, fin: agregarDías(ancla, máximoDías - 1) }
            : { inicio: agregarDías(ancla, -(máximoDías - 1)), fin: ancla };
      }
    }
    setRango(siguiente);
    setAncla(null);
    onRangoChange?.({
      inicio: aIsoFecha(siguiente.inicio),
      fin: aIsoFecha(siguiente.fin),
    });
  }

  const etiquetaRango = `${rango.inicio.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  })} — ${rango.fin.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  })}`;
  const díasSeleccionados =
    Math.round(
      (rango.fin.getTime() - rango.inicio.getTime()) / (24 * 60 * 60 * 1000),
    ) + 1;

  return (
    <section
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border-default/30 bg-bg-base p-4 shadow-widget",
        className,
      )}
      aria-label={t("analysisPeriod")}
    >
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            {t("analysisPeriod")}
          </p>
          <h3 className="mt-0.5 text-xl font-bold tracking-tight text-text-primary">
            {mesesTraducidos[vista.mes]}
            <span className="ml-1.5 text-sm font-medium text-text-muted">
              {vista.año}
            </span>
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => cambiarMes(-1)}
            className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={t("prevMonth")}
          >
            <ChevronLeftIcon className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => cambiarMes(1)}
            className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={t("nextMonth")}
          >
            <ChevronRightIcon className="size-4" />
          </button>
        </div>
      </header>

      <div className="mt-3 grid grid-cols-7">
        {diasSemanaTraducidos.map((día) => (
          <span
            key={día}
            className="py-1 text-center text-[10px] font-bold uppercase tracking-wide text-navy"
          >
            {día.slice(0, 2)}
          </span>
        ))}
      </div>

      <div className="mt-1 grid min-h-0 flex-1 grid-cols-7 grid-rows-6 gap-y-1">
        {celdas.map((celda, índice) => {
          const enRango = estáEnRango(
            celda.fecha,
            rangoVisible.inicio,
            rangoVisible.fin,
          );
          const esInicio = esMismaFecha(celda.fecha, rangoVisible.inicio);
          const esFin = esMismaFecha(celda.fecha, rangoVisible.fin);
          const esInicioFila = índice % 7 === 0 || esInicio;
          const esFinFila = índice % 7 === 6 || esFin;

          return (
            <div
              key={celda.iso}
              className="relative flex min-w-0 items-center justify-center"
            >
              {enRango && (
                <span
                  className={cn(
                    "absolute inset-x-0 top-1/2 h-8 -translate-y-1/2 bg-primary/10",
                    esInicioFila && "left-1 rounded-l-full",
                    esFinFila && "right-1 rounded-r-full",
                  )}
                  aria-hidden
                />
              )}
              <button
                type="button"
                disabled={celda.esFuturo || celda.esMuyAntiguo}
                onClick={() => seleccionarDía(celda)}
                title={celda.esMuyAntiguo ? t("lockedTooltip", { days: máximoDías ?? 0 }) : undefined}
                className={cn(
                  "relative z-[1] flex size-8 items-center justify-center rounded-full text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  celda.esFuturo || celda.esMuyAntiguo
                    ? "cursor-not-allowed text-text-muted/30"
                    : "cursor-pointer",
                  !celda.esFuturo && !celda.esMuyAntiguo && !celda.esDelMes && "text-text-muted/40",
                  !celda.esFuturo &&
                    !celda.esMuyAntiguo &&
                    celda.esDelMes &&
                    !enRango &&
                    "text-text-primary hover:bg-bg-muted",
                  !celda.esFuturo && !celda.esMuyAntiguo && enRango && "font-semibold text-primary",
                  !celda.esFuturo &&
                    !celda.esMuyAntiguo &&
                    (esInicio || esFin) &&
                    "bg-primary text-primary-fg hover:bg-primary-hover hover:text-primary-fg",
                  !celda.esFuturo &&
                    !celda.esMuyAntiguo &&
                    celda.esHoy &&
                    !esInicio &&
                    !esFin &&
                    "ring-1 ring-inset ring-primary",
                )}
                aria-label={
                  celda.esHoy
                    ? t("dayAriaToday", {
                        day: celda.numero,
                        month: mesesTraducidos[celda.fecha.getMonth()],
                        year: celda.fecha.getFullYear(),
                      })
                    : celda.esFuturo
                      ? t("dayAriaFuture", {
                          day: celda.numero,
                          month: mesesTraducidos[celda.fecha.getMonth()],
                          year: celda.fecha.getFullYear(),
                        })
                      : celda.esMuyAntiguo
                        ? t("dayAriaLocked", {
                            day: celda.numero,
                            month: mesesTraducidos[celda.fecha.getMonth()],
                            year: celda.fecha.getFullYear(),
                          })
                        : t("dayAria", {
                            day: celda.numero,
                            month: mesesTraducidos[celda.fecha.getMonth()],
                            year: celda.fecha.getFullYear(),
                          })
                }
                aria-pressed={enRango}
              >
                {celda.numero}
              </button>
            </div>
          );
        })}
      </div>

      <footer className="mt-2 flex items-center justify-between border-t border-border-default/50 pt-2">
        <span className="text-[11px] font-medium text-text-secondary">
          {etiquetaRango}
        </span>
        <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
          {t("daysCount", { count: díasSeleccionados })}
        </span>
      </footer>
    </section>
  );
}
