import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

function ShellSkeleton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border-default/30 bg-bg-base p-2.5 shadow-widget sm:p-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

function SkeletonEncabezado() {
  return (
    <ShellSkeleton>
      <Skeleton className="h-8 w-40 lg:h-9 lg:w-48" />
      <Skeleton className="mt-3 h-4 w-32" />
      <Skeleton className="mt-6 h-9 w-full rounded-lg" />
      <Skeleton className="mt-auto h-9 w-40 rounded-lg" />
    </ShellSkeleton>
  );
}

function SkeletonEstadisticaCompacta() {
  return (
    <ShellSkeleton>
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-auto h-7 w-20" />
    </ShellSkeleton>
  );
}

function SkeletonLista({ filas = 4 }: { filas?: number }) {
  const claves = Array.from({ length: filas }, (_, i) => `fila-${i}`);
  return (
    <ShellSkeleton>
      <Skeleton className="h-5 w-44" />
      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2.5">
        {claves.map((clave) => (
          <div key={clave} className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </ShellSkeleton>
  );
}

function SkeletonChart() {
  return (
    <ShellSkeleton>
      <Skeleton className="h-5 w-48" />
      <Skeleton className="mt-3 min-h-0 w-full flex-1 rounded-lg" />
    </ShellSkeleton>
  );
}

function SkeletonCalendario() {
  return (
    <ShellSkeleton>
      <div className="mb-2 flex items-center justify-between">
        <Skeleton className="h-7 w-28" />
        <div className="flex gap-1">
          <Skeleton className="size-7 rounded-lg" />
          <Skeleton className="size-7 rounded-lg" />
        </div>
      </div>
      <Skeleton className="min-h-0 w-full flex-1 rounded-lg" />
    </ShellSkeleton>
  );
}

function SkeletonImagenes() {
  const celdas = Array.from({ length: 9 }, (_, i) => `celda-${i}`);
  return (
    <ShellSkeleton>
      <Skeleton className="h-5 w-56" />
      <div className="mt-2 grid min-h-0 flex-1 grid-cols-9 gap-1.5">
        {celdas.map((celda) => (
          <Skeleton key={celda} className="aspect-square rounded-md" />
        ))}
      </div>
    </ShellSkeleton>
  );
}

/** Skeleton del panel general — misma grilla que el dashboard general real. */
export function DashboardGeneralSkeleton() {
  const t = useTranslations("common");
  return (
    <div className="dashboard-general-bento">
      <span className="sr-only">{t("loading")}</span>
      <div data-area="resumen" className="min-h-0">
        <SkeletonEncabezado />
      </div>
      <div data-area="kpis" className="dashboard-general-kpis min-h-0">
        <SkeletonEstadisticaCompacta />
        <SkeletonEstadisticaCompacta />
        <SkeletonEstadisticaCompacta />
        <SkeletonEstadisticaCompacta />
      </div>
      <div data-area="alertas" className="min-h-0">
        <SkeletonLista filas={3} />
      </div>
      <div data-area="ia" className="min-h-0">
        <SkeletonLista filas={2} />
      </div>
      <div data-area="calendar" className="min-h-0 overflow-hidden">
        <SkeletonCalendario />
      </div>
      <div data-area="trafico" className="min-h-0">
        <SkeletonLista />
      </div>
      <div data-area="alcance-fuente" className="min-h-0">
        <SkeletonLista />
      </div>
      <div data-area="tendencia-combo" className="min-h-0">
        <SkeletonChart />
      </div>
      <div data-area="tendencias" className="min-h-0">
        <SkeletonLista filas={6} />
      </div>
      <div data-area="keywords" className="min-h-0">
        <SkeletonLista />
      </div>
      <div data-area="tendencia-alcance" className="min-h-0">
        <SkeletonChart />
      </div>
      <div data-area="tonalidad" className="min-h-0">
        <SkeletonLista />
      </div>
      <div data-area="paises" className="min-h-0">
        <SkeletonLista />
      </div>
      <div data-area="rendimiento" className="min-h-0">
        <SkeletonChart />
      </div>
      <div data-area="imagenes" className="min-h-0 overflow-hidden">
        <SkeletonImagenes />
      </div>
    </div>
  );
}
