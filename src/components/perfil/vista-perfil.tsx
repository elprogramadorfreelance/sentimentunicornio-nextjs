"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui";
import { usePerfil } from "@/lib/hooks/use-perfil";
import { SeccionIdentidad } from "./seccion-identidad";
import { SeccionSeguridad } from "./seccion-seguridad";
import { SeccionZonaRiesgo } from "./seccion-zona-riesgo";

type VistaPerfilProps = {
  onPerfilActualizado?: () => void;
};

export function VistaPerfil({ onPerfilActualizado }: VistaPerfilProps) {
  const t = useTranslations("perfil");
  const { perfil, cargando, error, actualizarPerfilLocal } = usePerfil();

  useEffect(() => {
    // Sync nombre/foto del topbar cuando el perfil cambia vía storage event ligero
    if (!perfil) return;
    onPerfilActualizado?.();
    window.dispatchEvent(
      new CustomEvent("perfil-actualizado", { detail: perfil }),
    );
  }, [perfil, onPerfilActualizado]);

  if (cargando) {
    return (
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-56 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !perfil) {
    return (
      <div className="rounded-xl border border-error/25 bg-error/5 px-4 py-6 text-sm text-error">
        {error ?? t("loadError")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-text-primary">{t("title")}</h1>
        <p className="mt-1 text-sm text-text-muted">{t("subtitle")}</p>
      </header>

      <SeccionIdentidad perfil={perfil} onActualizado={actualizarPerfilLocal} />
      <SeccionSeguridad perfil={perfil} onActualizado={actualizarPerfilLocal} />
      <SeccionZonaRiesgo nombreUsuario={perfil.nombre} emailActual={perfil.email} />
    </div>
  );
}
