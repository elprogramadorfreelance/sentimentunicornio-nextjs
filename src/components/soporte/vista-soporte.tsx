"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Skeleton } from "@/components/ui";
import { usePerfil } from "@/lib/hooks/use-perfil";
import { FormularioReporte } from "./formulario-reporte";
import { ListaTickets } from "./lista-tickets";

export function VistaSoporte() {
  const t = useTranslations("support");
  const { perfil, cargando } = usePerfil();
  const [recargarTrigger, setRecargarTrigger] = useState(0);

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col gap-8 overflow-y-auto pb-8 pt-1 sm:pt-2">
      <header className="shrink-0 space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
          {t("title")}
        </h1>
        <p className="text-sm text-text-muted sm:text-base">{t("subtitle")}</p>
      </header>

      {cargando || !perfil ? (
        <div className="space-y-3">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ) : (
        <>
          <FormularioReporte
            userId={perfil.id}
            onTicketCreado={() => setRecargarTrigger((t) => t + 1)}
          />
          <ListaTickets
            userId={perfil.id}
            esAdmin={perfil.rol === "admin"}
            recargarTrigger={recargarTrigger}
          />
        </>
      )}
    </div>
  );
}
