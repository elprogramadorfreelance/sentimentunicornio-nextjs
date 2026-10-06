"use client";

import { CalendarDaysIcon, ChevronDownIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { localeBcp47 } from "@/i18n/config";
import {
  aRangoIso,
  desdeRangoIso,
  esMismaFecha,
  inicioDelDía,
  PRESETS_PERIODO,
  type PresetPeriodo,
  presetDesdeRango,
  rangoDesdePreset,
  rangoPeriodoPorDefecto,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";
import type { RangoFechas } from "@/types";

const CLAVE_PRESET: Record<
  PresetPeriodo,
  | "today"
  | "yesterday"
  | "last7Days"
  | "last14Days"
  | "last30Days"
  | "last3Months"
  | "lastYear"
> = {
  hoy: "today",
  ayer: "yesterday",
  ultimos_7: "last7Days",
  ultimos_14: "last14Days",
  ultimos_30: "last30Days",
  hace_3_meses: "last3Months",
  ano_pasado: "lastYear",
};

type CalendarioPeriodoProps = {
  className?: string;
  rango?: RangoFechas;
  onRangoChange?: (rango: RangoFechas) => void;
};

function formatearDíaCorto(fecha: Date, locale: string): string {
  return fecha.toLocaleDateString(localeBcp47(locale), {
    day: "numeric",
    month: "short",
  });
}

export function CalendarioPeriodo({
  className,
  rango: rangoControlado,
  onRangoChange,
}: CalendarioPeriodoProps) {
  const t = useTranslations("dates");
  const locale = useLocale();
  const hoy = useMemo(() => inicioDelDía(new Date()), []);
  const defecto = useMemo(() => rangoPeriodoPorDefecto(), []);
  const [rangoInterno, setRangoInterno] = useState<RangoFechas>(() =>
    aRangoIso(defecto),
  );
  const [abierto, setAbierto] = useState(false);
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const esperandoFin = useRef(false);

  const rango = rangoControlado ?? rangoInterno;
  const local = desdeRangoIso(rango.inicio, rango.fin);
  const presetActivo = presetDesdeRango(local, hoy);
  const selected: DateRange = { from: local.inicio, to: local.fin };

  const etiqueta = presetActivo
    ? t(CLAVE_PRESET[presetActivo])
    : esMismaFecha(local.inicio, local.fin)
      ? formatearDíaCorto(local.inicio, locale)
      : `${formatearDíaCorto(local.inicio, locale)} — ${formatearDíaCorto(local.fin, locale)}`;

  function publicar(siguiente: { inicio: Date; fin: Date }) {
    const iso = aRangoIso(siguiente);
    if (!rangoControlado) setRangoInterno(iso);
    onRangoChange?.(iso);
  }

  function alCambiarAbierto(siguiente: boolean) {
    setAbierto(siguiente);
    if (siguiente) {
      setMostrarCalendario(!presetActivo);
      esperandoFin.current = false;
    } else {
      setMostrarCalendario(false);
      esperandoFin.current = false;
    }
  }

  function alPreset(preset: PresetPeriodo) {
    publicar(rangoDesdePreset(preset, hoy));
    setMostrarCalendario(false);
    esperandoFin.current = false;
    setAbierto(false);
  }

  function alPersonalizada() {
    setMostrarCalendario(true);
    esperandoFin.current = false;
  }

  function alSeleccionar(siguiente: DateRange | undefined) {
    if (!siguiente?.from) {
      esperandoFin.current = false;
      return;
    }

    const from = inicioDelDía(siguiente.from);
    if (siguiente.to && inicioDelDía(siguiente.to).getTime() < from.getTime()) {
      return;
    }

    if (!esperandoFin.current) {
      esperandoFin.current = true;
      publicar({ inicio: from, fin: from });
      return;
    }

    const to = inicioDelDía(siguiente.to ?? siguiente.from);
    publicar({ inicio: from, fin: to });
    esperandoFin.current = false;
    setAbierto(false);
    setMostrarCalendario(false);
  }

  return (
    <Popover open={abierto} onOpenChange={alCambiarAbierto}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={t("selectPeriodAria")}
          className={cn(
            "h-10 min-w-0 w-full justify-between gap-2 px-3 text-left font-medium sm:w-auto sm:min-w-[14rem]",
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <CalendarDaysIcon className="size-4 shrink-0 text-text-muted" />
            <span className="min-w-0 truncate">{etiqueta}</span>
          </span>
          <ChevronDownIcon className="size-4 shrink-0 text-text-muted" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="z-[70] w-auto min-w-[16rem] p-2"
        onOpenAutoFocus={(evento) => evento.preventDefault()}
      >
        <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          {t("analysisPeriod")}
        </p>
        <ul className="flex flex-col">
          {PRESETS_PERIODO.map((preset) => {
            const activo = presetActivo === preset && !mostrarCalendario;
            return (
              <li key={preset}>
                <button
                  type="button"
                  onClick={() => alPreset(preset)}
                  className={cn(
                    "w-full rounded-md px-2 py-1.5 text-left text-sm font-medium transition-colors",
                    activo
                      ? "bg-primary text-primary-fg"
                      : "text-text-secondary hover:bg-bg-muted hover:text-text-primary",
                  )}
                >
                  {t(CLAVE_PRESET[preset])}
                </button>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={alPersonalizada}
              className={cn(
                "w-full rounded-md px-2 py-1.5 text-left text-sm font-medium transition-colors",
                mostrarCalendario || !presetActivo
                  ? "bg-primary text-primary-fg"
                  : "text-text-secondary hover:bg-bg-muted hover:text-text-primary",
              )}
            >
              {t("periodCustom")}
            </button>
          </li>
        </ul>
        {mostrarCalendario ? (
          <div className="mt-2 border-t border-border-default/50 pt-2">
            <Calendar
              mode="range"
              selected={selected}
              onSelect={alSeleccionar}
              disabled={
                selected.from && esperandoFin.current
                  ? { before: selected.from }
                  : undefined
              }
              defaultMonth={local.inicio}
              className="p-0 [--cell-size:1.85rem]"
            />
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
