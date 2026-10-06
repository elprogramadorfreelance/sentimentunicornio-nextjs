"use client";

import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui";
import { cn } from "@/lib/utils";

type ResumenGeneralWidgetProps = {
  proyectosActivos: number;
  proyectoActivoNombre: string | null;
  onNuevoProyecto: () => void;
  // Cuentas plan "basic" (Demo) solo pueden tener 1 proyecto — true cuando ya
  // lo alcanzaron y el botón debe quedar desactivado.
  límiteProyectosAlcanzado?: boolean;
  className?: string;
};

/** Cabecera del panel: nombre del proyecto activo (si hay uno solo) + acceso a crear proyecto. */
export function ResumenGeneralWidget({
  proyectosActivos,
  proyectoActivoNombre,
  onNuevoProyecto,
  límiteProyectosAlcanzado = false,
  className,
}: ResumenGeneralWidgetProps) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");

  return (
    <section
      className={cn("flex h-full min-h-0 flex-col overflow-hidden", className)}
      aria-label={proyectoActivoNombre ? t("currentProject") : t("generalTitle")}
    >
      {proyectoActivoNombre && (
        <p className="text-xs text-text-muted">
          {tCommon("projects")} <span aria-hidden>&gt;</span> {proyectoActivoNombre}
        </p>
      )}
      <h2 className="text-left text-2xl font-bold tracking-tight text-text-primary lg:text-3xl">
        {proyectoActivoNombre ? t("currentProject") : t("generalTitle")}
      </h2>
      <p className="mt-1 text-sm text-text-muted">
        {proyectoActivoNombre
          ? proyectoActivoNombre
          : t("activeProjectsUnderMonitoring", { count: proyectosActivos })}
      </p>

      {límiteProyectosAlcanzado ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="mt-auto inline-block w-fit max-w-44">
              <Button
                type="button"
                size="default"
                className="w-full"
                disabled
              >
                <PlusIcon className="size-4" />
                {t("newProject")}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>{t("newProjectLimitReached")}</TooltipContent>
        </Tooltip>
      ) : (
        <Button
          type="button"
          size="default"
          className="mt-auto max-w-44"
          onClick={onNuevoProyecto}
        >
          <PlusIcon className="size-4" />
          {t("newProject")}
        </Button>
      )}
    </section>
  );
}
