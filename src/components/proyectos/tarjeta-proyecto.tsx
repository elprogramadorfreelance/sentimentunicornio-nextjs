"use client";

import {
  CirclePauseIcon,
  CirclePlayIcon,
  EllipsisIcon,
  Frown,
  Meh,
  Smile,
  SquarePenIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { nivelCaraSentimiento } from "@/lib/mock/metricas-vista-proyecto";
import { cn } from "@/lib/utils";
import type {
  MetricasVistaProyecto,
  Proyecto,
  TipoAlertaCrisis,
} from "@/types";

type TarjetaProyectoProps = {
  proyecto: Proyecto;
  metricas?: MetricasVistaProyecto;
  // true si el proyecto aún no tiene ninguna mención clasificada — evita
  // mostrar "0% + carita triste" como si fuera un sentimiento negativo real.
  sinDatos?: boolean;
  className?: string;
  onEditar?: (proyecto: Proyecto) => void;
  onDesactivar?: (proyecto: Proyecto) => void;
  onActivar?: (proyecto: Proyecto) => void;
  onEliminar?: (proyecto: Proyecto) => void;
};

const VARIANTE_ALERTA: Record<
  TipoAlertaCrisis,
  "neutral" | "warning" | "error" | "negativo"
> = {
  ninguna: "neutral",
  aumento_menciones_negativas: "warning",
  crecimiento_fake_news: "error",
  menciones_negativas: "negativo",
};

function IconoSentimiento({
  porcentaje,
  sinDatos,
}: {
  porcentaje: number;
  sinDatos?: boolean;
}) {
  // "0% + carita triste" para un proyecto que simplemente no tiene menciones
  // clasificadas todavía se lee como "va mal" cuando en realidad es "no hay
  // data aún" — son cosas distintas y no hay que confundirlas.
  const nivel = sinDatos ? "neutral" : nivelCaraSentimiento(porcentaje);
  const clase = cn(
    "size-3.5 shrink-0",
    nivel === "triste" && "text-error",
    nivel === "neutral" && "text-warning",
    nivel === "feliz" && "text-success",
  );

  if (nivel === "triste") return <Frown className={clase} aria-hidden />;
  if (nivel === "neutral") return <Meh className={clase} aria-hidden />;
  return <Smile className={clase} aria-hidden />;
}

export function TarjetaProyecto({
  proyecto,
  metricas: metricasProp,
  sinDatos = false,
  className,
  onEditar,
  onDesactivar,
  onActivar,
  onEliminar,
}: TarjetaProyectoProps) {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const inactivo = proyecto.estado === "inactivo";
  // Mientras cargan las métricas reales (o si el proyecto no tiene menciones
  // aún) se muestra 0%/ninguna — nunca el generador hash que fingía data.
  const metricas: MetricasVistaProyecto =
    metricasProp ?? { sentimientoPorcentaje: 0, alertaCrisis: "ninguna" };

  const fecha = new Date(proyecto.ultimoAnalisis).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const etiquetaCrisis: Record<TipoAlertaCrisis, string> = {
    ninguna: t("crisisNone"),
    aumento_menciones_negativas: t("crisisNegativeRise"),
    crecimiento_fake_news: t("crisisFakeNews"),
    menciones_negativas: t("crisisNegative"),
  };

  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border-0 border-border-default bg-bg-base shadow-sm",
        inactivo && "opacity-80",
        className,
      )}
    >
      <div
        className="relative h-28 w-full flex-shrink-0"
        style={{
          background: `linear-gradient(135deg, ${proyecto.gradienteInicio} 0%, ${proyecto.gradienteFin} 100%)`,
        }}
      >
        <div
          className="absolute -right-6 -top-6 size-32 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, white 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        <span className="absolute right-3 top-3 rounded-full bg-white/25 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
          #{proyecto.numero}
        </span>

        <div className="absolute -bottom-6 left-1/2 flex size-14 -translate-x-1/2 items-center justify-center overflow-hidden rounded-full bg-white/30 text-base font-bold text-white backdrop-blur-sm ring-2 ring-white/40">
          {proyecto.imagenUrl ? (
            // biome-ignore lint/performance/noImgElement: preview puede ser data URL del mock
            <img
              src={proyecto.imagenUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            proyecto.iniciales
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-9">
        <div className="text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <h3 className="text-sm font-bold text-text-primary">
              {proyecto.nombre}
            </h3>
            {inactivo && (
              <Badge variante="warning" className="rounded-lg">
                {t("inactive")}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-text-muted">
            {proyecto.ubicacion} · {proyecto.idioma}
          </p>
        </div>

        <p className="flex items-center justify-center gap-1.5">
          <IconoSentimiento porcentaje={metricas.sentimientoPorcentaje} sinDatos={sinDatos} />
          <span className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
            {tCommon("sentiment")}
          </span>
          <span className="text-xs font-bold tabular-nums text-text-primary">
            {sinDatos ? t("noDataShort") : `${metricas.sentimientoPorcentaje}%`}
          </span>
        </p>

        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
            {t("crisisAlert")}
          </span>
          <Badge
            variante={VARIANTE_ALERTA[metricas.alertaCrisis]}
            className="max-w-full truncate rounded-lg"
          >
            {etiquetaCrisis[metricas.alertaCrisis]}
          </Badge>
        </div>

        <div className="rounded-md border border-border-default px-2.5 py-1.5 text-center">
          <span className="truncate text-xs text-text-secondary">
            {proyecto.palabraClave}
          </span>
        </div>

        <p className="line-clamp-2 text-xs leading-relaxed text-text-muted">
          {proyecto.descripcion}
        </p>

        <p className="text-xs text-text-muted">
          {t("analysisCount", { count: proyecto.analisis })}
          <span className="mx-2 opacity-40">·</span>
          {fecha}
        </p>

        <div className="mt-auto flex gap-2">
          <Button asChild variant="default" size="sm" className="flex-1">
            <Link href={`/proyectos/${proyecto.id}`}>
              {t("viewProject")}
            </Link>
          </Button>

          <DropdownMenu open={menuAbierto} onOpenChange={setMenuAbierto}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label={t("moreOptions")}
              >
                <EllipsisIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onSelect={() => {
                  setMenuAbierto(false);
                  onEditar?.(proyecto);
                }}
              >
                <SquarePenIcon />
                {tCommon("edit")}
              </DropdownMenuItem>
              {inactivo ? (
                <DropdownMenuItem
                  onSelect={() => {
                    setMenuAbierto(false);
                    onActivar?.(proyecto);
                  }}
                >
                  <CirclePlayIcon />
                  {tCommon("activate")}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onSelect={() => {
                    setMenuAbierto(false);
                    onDesactivar?.(proyecto);
                  }}
                >
                  <CirclePauseIcon />
                  {tCommon("deactivate")}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => {
                  setMenuAbierto(false);
                  onEliminar?.(proyecto);
                }}
              >
                <Trash2Icon />
                {tCommon("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </article>
  );
}
