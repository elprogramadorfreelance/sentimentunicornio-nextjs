"use client";

import { Building2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { useSidebar } from "@/components/ui/sidebar";
import { useOrganizacionActiva } from "@/lib/hooks/use-organizacion-activa";
import { cn } from "@/lib/utils";

export function SelectorOrganizacion({ className }: { className?: string }) {
  const t = useTranslations("common");
  const { state } = useSidebar();
  const colapsado = state === "collapsed";
  const {
    organizaciones,
    organizacion,
    organizacionId,
    setOrganizacionId,
    hidratado,
  } = useOrganizacionActiva();

  function alCambiar(id: string) {
    if (id === organizacionId) return;
    setOrganizacionId(id);
    const siguiente = organizaciones.find((o) => o.id === id);
    if (siguiente) {
      toast.success(t("organizationChanged"), {
        description: t("organizationChangedDesc", { name: siguiente.nombre }),
      });
    }
  }

  return (
    <div
      className={cn(
        "w-full space-y-1.5 pt-8",
        "group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center",
        className,
      )}
    >
      <p className="px-0.5 text-xs text-text-muted group-data-[collapsible=icon]:hidden">
        {t("organization")}
      </p>

      <Select
        value={hidratado ? organizacionId : undefined}
        onValueChange={alCambiar}
      >
        <SelectTrigger
          aria-label={t("changeOrganization")}
          title={organizacion?.nombre}
          className={cn(
            "h-auto w-full gap-2 rounded-lg border-border-default bg-bg-base px-2.5 py-2 text-left text-sm hover:bg-bg-muted",
            "[&>span]:min-w-0 [&>span]:flex-1 [&>span]:truncate [&>span]:text-left",
            "group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:hover:bg-sidebar-accent",
            "group-data-[collapsible=icon]:[&>svg:last-child]:hidden",
            "group-data-[collapsible=icon]:[&_[data-slot=select-value]]:sr-only",
          )}
        >
          <Building2Icon
            className={cn(
              "size-4 shrink-0 text-text-muted",
              "group-data-[collapsible=icon]:text-text-primary",
            )}
          />
          <SelectValue placeholder={t("selectEllipsis")} />
        </SelectTrigger>

        <SelectContent align={colapsado ? "start" : "center"} side="bottom">
          {organizaciones.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              {org.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
