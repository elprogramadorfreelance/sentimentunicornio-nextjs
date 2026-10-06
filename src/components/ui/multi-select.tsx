"use client";

import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type OpcionMultiSelect = {
  value: string;
  label: string;
};

type MultiSelectProps = {
  opciones: OpcionMultiSelect[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  /** Muestra acción para marcar/desmarcar todas las opciones. */
  mostrarSeleccionarTodos?: boolean;
  "aria-invalid"?: boolean;
};

export function MultiSelect({
  opciones,
  value,
  onChange,
  placeholder = "Selecciona opciones",
  className,
  mostrarSeleccionarTodos = false,
  "aria-invalid": ariaInvalid,
}: MultiSelectProps) {
  const [abierto, setAbierto] = useState(false);

  function alternar(opcion: string) {
    if (value.includes(opcion)) {
      onChange(value.filter((v) => v !== opcion));
    } else {
      onChange([...value, opcion]);
    }
  }

  const todosSeleccionados =
    opciones.length > 0 && opciones.every((o) => value.includes(o.value));

  function alternarTodos() {
    if (todosSeleccionados) {
      onChange([]);
    } else {
      onChange(opciones.map((o) => o.value));
    }
  }

  const etiquetas = opciones
    .filter((o) => value.includes(o.value))
    .map((o) => o.label);

  const resumenSeleccion =
    etiquetas.length === 0
      ? placeholder
      : todosSeleccionados
        ? "Todos"
        : etiquetas.length > 3
          ? `${etiquetas.length} seleccionados`
          : etiquetas.join(", ");

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger
        aria-invalid={ariaInvalid}
        className={cn(
          "flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-border-default bg-bg-base px-3 py-2 text-left text-sm transition-colors",
          "hover:bg-bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          ariaInvalid && "border-error",
          className,
        )}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            etiquetas.length === 0 && "text-text-muted",
          )}
        >
          {resumenSeleccion}
        </span>
        <ChevronDownIcon className="size-4 shrink-0 text-text-muted" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        // Evita que el scroll del Dialog robe la rueda al listado largo
        onWheel={(e) => e.stopPropagation()}
        className="flex w-[var(--radix-popover-trigger-width)] max-h-[min(24rem,var(--radix-popover-content-available-height))] flex-col p-2"
      >
        {mostrarSeleccionarTodos && opciones.length > 0 && (
          <button
            type="button"
            onClick={alternarTodos}
            className="mb-1 flex w-full shrink-0 cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium text-primary transition-colors hover:bg-primary/5"
          >
            <span
              aria-hidden
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-sm border border-border-default",
                todosSeleccionados &&
                  "border-primary bg-primary text-primary-fg",
              )}
            >
              {todosSeleccionados ? <CheckIcon className="size-3" /> : null}
            </span>
            {todosSeleccionados ? "Quitar todos" : "Seleccionar todos"}
          </button>
        )}
        <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain">
          {opciones.map((opcion) => {
            const checked = value.includes(opcion.value);
            return (
              <li key={opcion.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={checked}
                  onClick={() => alternar(opcion.value)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                    "hover:bg-bg-muted",
                    checked && "bg-primary/5",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-sm border border-border-default",
                      checked && "border-primary bg-primary text-primary-fg",
                    )}
                  >
                    {checked ? <CheckIcon className="size-3" /> : null}
                  </span>
                  <span className="text-text-primary">{opcion.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {value.length > 0 && value.length <= 8 && !todosSeleccionados && (
          <div className="mt-2 flex shrink-0 flex-wrap gap-1.5 border-t border-border-default/50 pt-2">
            {opciones
              .filter((o) => value.includes(o.value))
              .map((o) => (
                <Badge key={o.value} className="rounded-lg">
                  {o.label}
                </Badge>
              ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
