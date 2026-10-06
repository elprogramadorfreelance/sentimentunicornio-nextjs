"use client";

import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  agregarDías,
  aIsoFecha,
  type CeldaCalendario,
  díaSemanaLunes,
  esMismaFecha,
  estáEnRango,
  generarCeldasMes,
  generarCeldasRango,
  inicioDelDía,
  normalizarRango,
} from "@/lib/calendar";
import { useIsMobile } from "@/lib/hooks/use-mobile";
import { META_TIPO_EVENTO, obtenerEventosAgendaMock } from "@/lib/mock/agenda";
import { cn } from "@/lib/utils";
import type { EventoAgenda, RangoFechas, TipoEventoAgenda } from "@/types";

type CalendarioWidgetProps = {
  eventos?: EventoAgenda[];
  className?: string;
  onRangoChange?: (rango: RangoFechas) => void;
  // Rango recordado de otra página (ver rango-calendario-seleccionado.ts) —
  // si viene, se usa en vez del rango "próximos 7 días" por defecto.
  rangoInicial?: RangoFechas | null;
  // Cuentas plan "basic" (Demo): pedido explícito del dueño (2026-10-01) —
  // los días más viejos que esto no solo se recortan de la selección (como
  // en CalendarioMenciones), se bloquean visualmente desde el calendario
  // mismo, con un tooltip explicando por qué.
  máximoDías?: number | null;
};

type RangoLocal = { inicio: Date; fin: Date };

// Bug real (2026-10-02): este default miraba hacia ADELANTE (hoy..hoy+6) —
// un resabio de cuando este componente nació como calendario de agenda
// (eventos futuros). El único lugar real que lo usa hoy es el panel de
// /proyectos (ver dashboard-general-vista.tsx — nadie más lo importa),
// mostrando menciones YA ocurridas, nunca futuras — con el default viejo,
// la mayoría de esos días quedaban marcados `esFuturo` (gris, deshabilitado)
// pero IGUAL pintados como rango "seleccionado" (píldora azul), la misma
// familia de bug confuso que el de abajo, solo que hacia el otro lado.
function rangoPorDefecto(hoy: Date): RangoLocal {
  return { inicio: agregarDías(hoy, -6), fin: inicioDelDía(hoy) };
}

function aRangoLocal(rango: RangoFechas): RangoLocal {
  return {
    inicio: inicioDelDía(new Date(`${rango.inicio}T00:00:00`)),
    fin: inicioDelDía(new Date(`${rango.fin}T00:00:00`)),
  };
}

export function CalendarioWidget({
  eventos: eventosProp,
  className,
  onRangoChange,
  rangoInicial,
  máximoDías = null,
}: CalendarioWidgetProps) {
  const t = useTranslations("dates");
  const tCommon = useTranslations("common");
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
  const dias = useMemo(
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
  const isMobile = useIsMobile();
  function etiquetaTipo(tipo: TipoEventoAgenda) {
    if (tipo === "campaña") return t("eventCampaign");
    if (tipo === "cita") return t("eventMeeting");
    return t("eventEvent");
  }

  const hoy = useMemo(() => inicioDelDía(new Date()), []);
  const eventos = useMemo(
    () => eventosProp ?? obtenerEventosAgendaMock(hoy),
    [eventosProp, hoy],
  );

  const [vista, setVista] = useState(() => {
    const base = rangoInicial ? aRangoLocal(rangoInicial).fin : hoy;
    return { año: base.getFullYear(), mes: base.getMonth() };
  });
  const [rango, setRango] = useState<RangoLocal>(() =>
    rangoInicial ? aRangoLocal(rangoInicial) : rangoPorDefecto(hoy),
  );
  const [ancla, setAncla] = useState<Date | null>(null);
  const [hover, setHover] = useState<Date | null>(null);
  const [pickerAbierto, setPickerAbierto] = useState(false);
  const [pickerAño, setPickerAño] = useState(hoy.getFullYear());

  const pickerId = useId();
  const pickerRef = useRef<HTMLDivElement>(null);

  const fechaMínima = useMemo(
    () => (máximoDías != null ? agregarDías(hoy, -(máximoDías - 1)) : undefined),
    [hoy, máximoDías],
  );

  // Mobile: solo los 7 días del rango; el mes completo vive en /agenda
  const celdas = useMemo(
    () =>
      isMobile
        ? generarCeldasRango(rango.inicio, rango.fin, hoy, fechaMínima)
        : generarCeldasMes(vista.año, vista.mes, hoy, fechaMínima),
    [isMobile, rango.inicio, rango.fin, vista.año, vista.mes, hoy, fechaMínima],
  );

  const encabezadosSemana = useMemo(
    () =>
      isMobile
        ? celdas.map((c) => ({
            key: c.iso,
            label: dias[díaSemanaLunes(c.fecha)],
          }))
        : dias.map((d) => ({ key: d, label: d })),
    [isMobile, celdas, dias],
  );

  const eventosPorFecha = useMemo(() => {
    const mapa = new Map<string, EventoAgenda[]>();
    for (const ev of eventos) {
      const lista = mapa.get(ev.fecha) ?? [];
      lista.push(ev);
      mapa.set(ev.fecha, lista);
    }
    return mapa;
  }, [eventos]);


  const rangoActivo: RangoLocal = useMemo(() => {
    if (ancla && hover) return normalizarRango(ancla, hover);
    if (ancla) return { inicio: ancla, fin: ancla };
    return rango;
  }, [ancla, hover, rango]);

  const esPreview = ancla !== null;

  // rangoInicial llega vacío en el primer render (el padre lo adopta de
  // localStorage recién después de montar) — cuando por fin llega, refleja
  // ese rango en el calendario en vez de dejarlo pegado en el default.
  //
  // Bug real (2026-10-02): el `return` temprano de abajo (cuando
  // `rangoInicial` es null) ignoraba por completo la transición CONTRARIA —
  // de un rango ya puesto a null — así que cuando el padre detecta una
  // cuenta Demo y descarta un rango heredado demasiado amplio (ver
  // dashboard-general-vista.tsx) poniendo `rangoCalendario` en null, este
  // calendario se quedaba pegado mostrando el rango ancho viejo como
  // "seleccionado" aunque los datos reales ya volvían acotados — el mes
  // entero se veía azul sin motivo real. Ahora null también resetea el
  // calendario a su propio default real, no solo lo ignora.
  useEffect(() => {
    const local = rangoInicial ? aRangoLocal(rangoInicial) : rangoPorDefecto(hoy);
    setRango(local);
    setVista({ año: local.fin.getFullYear(), mes: local.fin.getMonth() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangoInicial?.inicio, rangoInicial?.fin]);

  useEffect(() => {
    if (!pickerAbierto) return;
    function alClickFuera(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerAbierto(false);
      }
    }
    function alEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setPickerAbierto(false);
    }
    document.addEventListener("mousedown", alClickFuera);
    document.addEventListener("keydown", alEscape);
    return () => {
      document.removeEventListener("mousedown", alClickFuera);
      document.removeEventListener("keydown", alEscape);
    };
  }, [pickerAbierto]);

  function emitirRango(nuevo: RangoLocal) {
    setRango(nuevo);
    onRangoChange?.({
      inicio: aIsoFecha(nuevo.inicio),
      fin: aIsoFecha(nuevo.fin),
    });
  }

  function irMes(delta: number) {
    setVista((v) => {
      const d = new Date(v.año, v.mes + delta, 1);
      return { año: d.getFullYear(), mes: d.getMonth() };
    });
  }

  function seleccionarMes(mes: number) {
    setVista({ año: pickerAño, mes });
    setPickerAbierto(false);
  }

  function alClickDía(celda: CeldaCalendario) {
    // En mobile el rango es fijo; el mes completo está en Ver más
    if (isMobile) return;
    // No hay menciones del futuro que filtrar — no tiene sentido dejar
    // seleccionar fechas por venir.
    if (celda.esFuturo || celda.esMuyAntiguo) return;

    const día = inicioDelDía(celda.fecha);

    if (!ancla) {
      setAncla(día);
      setHover(día);
      return;
    }

    const confirmado = normalizarRango(ancla, día);
    emitirRango(confirmado);
    setAncla(null);
    setHover(null);

    // Si el fin cae en otro mes visible, mantener vista; si el click fue en mes adyacente, saltar
    if (!celda.esDelMes) {
      setVista({ año: día.getFullYear(), mes: día.getMonth() });
    }
  }

  const filas: CeldaCalendario[][] = [];
  for (let i = 0; i < celdas.length; i += 7) {
    filas.push(celdas.slice(i, i + 7));
  }

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border-default/30 bg-bg-base p-2.5 shadow-widget sm:p-3",
        className,
      )}
    >
      {/* Header */}
      <div className="relative mb-1.5 flex shrink-0 items-baseline justify-between gap-2">
        <div ref={pickerRef} className="relative min-w-0">
          {isMobile ? (
            <div className="flex items-start gap-1 px-0.5 py-0.5">
              <span className="text-xl font-bold tracking-tight text-text-primary lg:text-2xl">
                {meses[rango.inicio.getMonth()]}
              </span>
              <span className="text-sm font-medium text-text-muted">
                {rango.inicio.getFullYear()}
              </span>
            </div>
          ) : (
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={pickerAbierto}
              aria-controls={pickerId}
              onClick={() => {
                setPickerAño(vista.año);
                setPickerAbierto((o) => !o);
              }}
              className="group flex cursor-pointer items-start gap-1 rounded-lg px-0.5 py-0.5 text-left transition-colors hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="text-xl font-bold tracking-tight text-text-primary lg:text-2xl">
                {meses[vista.mes]}
              </span>
              <span className="text-sm font-medium text-text-muted">
                {vista.año}
              </span>
            </button>
          )}

          {!isMobile && pickerAbierto && (
            <div
              id={pickerId}
              role="dialog"
              aria-label={t("selectMonthYear")}
              className="absolute left-0 top-full z-20 mt-2 w-64 rounded-xl border border-border-default bg-bg-base p-3 shadow-lg"
            >
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  aria-label={t("prevYear")}
                  onClick={() => setPickerAño((y) => y - 1)}
                  className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-muted hover:text-text-primary"
                >
                  <ChevronLeftIcon className="size-4" />
                </button>
                <span className="text-sm font-semibold text-text-primary">
                  {pickerAño}
                </span>
                <button
                  type="button"
                  aria-label={t("nextYear")}
                  onClick={() => setPickerAño((y) => y + 1)}
                  className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-muted hover:text-text-primary"
                >
                  <ChevronRightIcon className="size-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {meses.map((nombre, idx) => {
                  const activo = idx === vista.mes && pickerAño === vista.año;
                  return (
                    <button
                      key={nombre}
                      type="button"
                      onClick={() => seleccionarMes(idx)}
                      className={cn(
                        "cursor-pointer rounded-lg p-2 text-xs font-medium transition-colors",
                        activo
                          ? "bg-primary text-primary-fg"
                          : "text-text-secondary hover:bg-bg-muted hover:text-text-primary",
                      )}
                    >
                      {nombre.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {!isMobile && (
          <div className="flex shrink-0 items-center">
            <button
              type="button"
              aria-label={t("prevMonth")}
              onClick={() => irMes(-1)}
              className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <ChevronLeftIcon className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label={t("nextMonth")}
              onClick={() => irMes(1)}
              className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <ChevronRightIcon className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Días de la semana */}
      <div className="mb-1 grid shrink-0 grid-cols-7">
        {encabezadosSemana.map(({ key, label }) => (
          <div
            key={key}
            className="py-1 text-center text-[10px] font-bold tracking-wide text-navy lg:text-xs"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Filas a su alto natural, ancladas arriba: en el Panel general el
       * contenedor del calendario mide 388px fijos (para cuadrar con las
       * tarjetas vecinas del grid) mientras que un mes de 5 filas necesita
       * mucho menos — con justify-center ese sobrante se veía como un hueco
       * gigante ENCIMA de las fechas. Con justify-start el sobrante queda
       * abajo, que es como se ve cualquier calendario real. */}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col justify-start",
          filas.length > 5 ? "gap-0.5" : "gap-1 lg:gap-1.5",
        )}
      >
        {filas.map((fila) => (
          <div key={fila[0].iso} className="grid shrink-0 grid-cols-7">
            {fila.map((celda, idx) => {
              const enRango = estáEnRango(
                celda.fecha,
                rangoActivo.inicio,
                rangoActivo.fin,
              );
              const esInicio = esMismaFecha(celda.fecha, rangoActivo.inicio);
              const esFin = esMismaFecha(celda.fecha, rangoActivo.fin);
              const esInicioFila = idx === 0 || esInicio;
              const esFinFila = idx === 6 || esFin;
              const eventosDía = eventosPorFecha.get(celda.iso) ?? [];
              const tiposDía = [
                ...new Set(eventosDía.map((e) => e.tipo)),
              ] as TipoEventoAgenda[];

              return (
                <div
                  key={celda.iso}
                  className="relative flex items-center justify-center"
                >
                  {enRango && (
                    <span
                      aria-hidden
                      className={cn(
                        // Altura fija centrada: evita barra gorda en mobile (1 fila) y fina en desktop (muchas filas)
                        "absolute top-1/2 left-0 right-0 -translate-y-1/2",
                        filas.length > 5 ? "h-7 lg:h-8" : "h-9 lg:h-10",
                        esPreview ? "bg-primary/20" : "bg-primary",
                        esInicioFila && "left-0.5 rounded-l-full",
                        esFinFila && "right-0.5 rounded-r-full",
                      )}
                    />
                  )}
                  <button
                    type="button"
                    disabled={celda.esFuturo || celda.esMuyAntiguo}
                    onClick={() => alClickDía(celda)}
                    onMouseEnter={() => {
                      if (ancla && !celda.esFuturo && !celda.esMuyAntiguo) setHover(inicioDelDía(celda.fecha));
                    }}
                    onMouseLeave={() => {
                      if (ancla) setHover(ancla);
                    }}
                    onFocus={() => {
                      if (ancla && !celda.esFuturo && !celda.esMuyAntiguo) setHover(inicioDelDía(celda.fecha));
                    }}
                    title={celda.esMuyAntiguo ? t("lockedTooltip", { days: máximoDías ?? 0 }) : undefined}
                    aria-label={`${t(
                      celda.esFuturo
                        ? "dayAriaFuture"
                        : celda.esMuyAntiguo
                          ? "dayAriaLocked"
                          : celda.esHoy
                            ? "dayAriaToday"
                            : "dayAria",
                      {
                        day: celda.numero,
                        month: meses[celda.fecha.getMonth()],
                        year: celda.fecha.getFullYear(),
                      },
                    )}${enRango ? `, ${t("selected")}` : ""}`}
                    aria-pressed={enRango}
                    className={cn(
                      "relative z-[1] flex items-center justify-center rounded-full text-xs font-medium transition-colors lg:text-sm",
                      filas.length > 5 ? "size-7 lg:size-8" : "size-9 lg:size-10",
                      celda.esFuturo || celda.esMuyAntiguo
                        ? "cursor-not-allowed text-text-muted/30"
                        : isMobile
                          ? "cursor-default"
                          : "cursor-pointer",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
                      !celda.esFuturo &&
                        !celda.esMuyAntiguo &&
                        !celda.esDelMes &&
                        !enRango &&
                        "text-text-muted/50",
                      !celda.esFuturo &&
                        !celda.esMuyAntiguo &&
                        celda.esDelMes &&
                        !enRango &&
                        "text-text-primary hover:bg-bg-muted",
                      // Día de otro mes dentro del rango: se queda dentro de
                      // la píldora (el rango sigue viéndose continuo) pero
                      // atenuado, para no verse idéntico a un día real de
                      // este mes — antes un 31 de agosto se veía tan
                      // "activo" como un 2 de septiembre.
                      !celda.esFuturo &&
                        !celda.esMuyAntiguo &&
                        enRango &&
                        !celda.esDelMes &&
                        (esPreview ? "text-primary/50" : "text-primary-fg/55"),
                      !celda.esFuturo &&
                        !celda.esMuyAntiguo &&
                        enRango &&
                        celda.esDelMes &&
                        !esPreview &&
                        "text-primary-fg hover:text-primary-fg",
                      !celda.esFuturo &&
                        !celda.esMuyAntiguo &&
                        enRango &&
                        celda.esDelMes &&
                        esPreview &&
                        "text-primary",
                    )}
                    tabIndex={isMobile || celda.esFuturo || celda.esMuyAntiguo ? -1 : undefined}
                  >
                    <span className="leading-none">{celda.numero}</span>
                    {(celda.esHoy || tiposDía.length > 0) && (
                      <span className="pointer-events-none absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-0.5">
                        {celda.esHoy && (
                          <span
                            className={cn(
                              "size-1 shrink-0 rounded-full lg:size-1.5",
                              enRango && !esPreview
                                ? "bg-primary-fg"
                                : "bg-primary",
                            )}
                            title={t("today")}
                            aria-hidden
                          />
                        )}
                        {tiposDía.slice(0, celda.esHoy ? 1 : 2).map((tipo) => (
                          <span
                            key={tipo}
                            className={cn(
                              "size-1 shrink-0 rounded-full lg:size-1.5",
                              META_TIPO_EVENTO[tipo].punto,
                            )}
                            title={etiquetaTipo(tipo)}
                            aria-hidden
                          />
                        ))}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Leyenda + ver más */}
      <div className="mt-1.5 flex shrink-0 flex-col gap-1 border-t border-border-default/60 pt-1.5">

        <Link
          href="/agenda"
          className="group inline-flex w-fit items-center gap-1 text-[11px] font-medium text-text-muted transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          {tCommon("seeMore")}
          <ArrowRightIcon className="size-3 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
