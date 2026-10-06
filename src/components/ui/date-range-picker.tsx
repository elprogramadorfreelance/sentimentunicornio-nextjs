"use client";

import { CalendarDaysIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { localeBcp47 } from "@/i18n/config";
import { cn } from "@/lib/utils";

type DateRangePickerProps = {
  value: DateRange | undefined;
  onChange: (value: DateRange | undefined) => void;
  className?: string;
  placeholder?: string;
};

function inicioDelDía(fecha: Date): number {
  return new Date(
    fecha.getFullYear(),
    fecha.getMonth(),
    fecha.getDate(),
  ).getTime();
}

function formatearDía(fecha: Date, locale: string): string {
  return fecha.toLocaleDateString(localeBcp47(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function DateRangePicker({
  value,
  onChange,
  className,
  placeholder,
}: DateRangePickerProps) {
  const t = useTranslations("dates");
  const locale = useLocale();
  const [abierto, setAbierto] = useState(false);
  const esperandoFin = useRef(false);
  const textoPlaceholder = placeholder ?? t("rangePlaceholder");

  const etiqueta =
    value?.from && value.to
      ? `${formatearDía(value.from, locale)} — ${formatearDía(value.to, locale)}`
      : value?.from
        ? `${formatearDía(value.from, locale)} — ${t("endDate")}`
        : textoPlaceholder;

  function alCambiarAbierto(siguiente: boolean) {
    setAbierto(siguiente);
    if (siguiente) {
      esperandoFin.current = Boolean(value?.from && !value.to);
    }
  }

  function alSeleccionar(siguiente: DateRange | undefined) {
    if (!siguiente?.from) {
      esperandoFin.current = false;
      onChange(undefined);
      return;
    }

    if (
      siguiente.to &&
      inicioDelDía(siguiente.to) < inicioDelDía(siguiente.from)
    ) {
      return;
    }

    // RDP v10 marca from=to en el primer clic; el fin se elige en el segundo.
    if (!esperandoFin.current) {
      esperandoFin.current = true;
      onChange({ from: siguiente.from, to: undefined });
      return;
    }

    onChange({
      from: siguiente.from,
      to: siguiente.to ?? siguiente.from,
    });
    esperandoFin.current = false;
    setAbierto(false);
  }

  return (
    <Popover open={abierto} onOpenChange={alCambiarAbierto}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={t("selectPeriodAria")}
          className={cn(
            "h-12 min-w-0 w-full justify-start px-3 text-left font-medium",
            !(value?.from && value.to) && "text-text-muted",
            className,
          )}
        >
          <CalendarDaysIcon className="size-4 shrink-0 text-text-muted" />
          <span className="min-w-0 truncate">{etiqueta}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="z-[70] w-auto p-0"
        onOpenAutoFocus={(evento) => evento.preventDefault()}
      >
        <Calendar
          mode="range"
          selected={value}
          onSelect={alSeleccionar}
          disabled={
            value?.from && !value.to ? { before: value.from } : undefined
          }
          defaultMonth={value?.from}
        />
      </PopoverContent>
    </Popover>
  );
}
