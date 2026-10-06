"use client";

import { CheckIcon, FolderIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import { useSidebar } from "@/components/ui/sidebar";
import { useProyectosActivos } from "@/lib/hooks/use-proyectos-activos";
import { cn } from "@/lib/utils";

export function SelectorProyectosSidebar() {
  const t = useTranslations("common");
  const { state } = useSidebar();
  const colapsado = state === "collapsed";
  const {
    proyectos,
    hidratado,
    esTodos,
    idsEfectivos,
    sinSeleccion,
    alternarId,
    seleccionarTodos,
    limpiarSeleccion,
  } = useProyectosActivos();

  const etiqueta = !hidratado
    ? t("loading")
    : sinSeleccion
      ? t("noProjectSelected")
      : esTodos || idsEfectivos.length === proyectos.length
        ? t("allProjects")
        : idsEfectivos.length === 1
          ? (proyectos.find((p) => p.id === idsEfectivos[0])?.nombre ??
            t("project"))
          : t("projectsSelected", { count: idsEfectivos.length });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("selectProjects")}
        title={etiqueta}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border border-border-default bg-bg-subtle px-2.5 py-2 text-left text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          "group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0",
        )}
      >
        <FolderIcon className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate group-data-[collapsible=icon]:hidden">
          {etiqueta}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={colapsado ? "start" : "center"}
        side="bottom"
        className="w-56"
      >
        <DropdownMenuItem
          onSelect={(evento) => {
            evento.preventDefault();
            if (esTodos) {
              limpiarSeleccion();
            } else {
              seleccionarTodos();
            }
          }}
        >
          <span
            className={cn(
              "flex size-4 items-center justify-center rounded-sm border border-border-default",
              esTodos && "border-primary bg-primary text-primary-fg",
            )}
          >
            {esTodos ? <CheckIcon className="size-3" /> : null}
          </span>
          {t("allProjects")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {proyectos.map((proyecto) => {
          const activo = esTodos || idsEfectivos.includes(proyecto.id);
          return (
            <DropdownMenuItem
              key={proyecto.id}
              onSelect={(evento) => {
                evento.preventDefault();
                alternarId(proyecto.id);
              }}
            >
              <span
                className={cn(
                  "flex size-4 items-center justify-center rounded-sm border border-border-default",
                  activo && "border-primary bg-primary text-primary-fg",
                )}
              >
                {activo ? <CheckIcon className="size-3" /> : null}
              </span>
              <span className="min-w-0 truncate">{proyecto.nombre}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
