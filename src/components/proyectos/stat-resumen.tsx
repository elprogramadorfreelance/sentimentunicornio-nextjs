import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type StatResumenProps = {
  etiqueta: string;
  valor: string | number;
  descripcion: string;
  progreso?: { actual: number; total: number };
  className?: string;
};

/**
 * KPI de la fila superior: ancla etiqueta arriba y descripción abajo
 * para ocupar la altura stretch sin flotar un bloque centrado.
 */
export function StatResumen({
  etiqueta,
  valor,
  descripcion,
  progreso,
  className,
}: StatResumenProps) {
  return (
    <div
      className={cn(
        "flex h-full min-h-[7.5rem] flex-col justify-between rounded-xl border border-border-default bg-bg-base p-4",
        className,
      )}
    >
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
        {etiqueta}
      </span>

      <div className="flex min-h-0 flex-1 flex-col justify-center gap-2 py-2">
        <span className="text-3xl font-bold tracking-tight text-text-primary tabular-nums">
          {valor}
        </span>
        {progreso && (
          <Progress
            value={(progreso.actual / progreso.total) * 100}
            className="h-1.5 w-full"
          />
        )}
      </div>

      <span className="shrink-0 text-xs text-text-muted">{descripcion}</span>
    </div>
  );
}
