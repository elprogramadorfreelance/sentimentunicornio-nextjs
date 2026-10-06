"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { ConsumoUsuario, OrganizaciónAdmin, UsuarioAdmin } from "@/types";
import { TablaConsumo } from "./tabla-consumo";
import { TablaOrganizaciones } from "./tabla-organizaciones";
import { TablaUsuarios } from "./tabla-usuarios";

type PestañaId = "usuarios" | "consumo" | "organizaciones";

type AdminVistaProps = {
  usuariosIniciales: UsuarioAdmin[];
  consumoInicial: ConsumoUsuario[];
  organizacionesIniciales: OrganizaciónAdmin[];
};

export function AdminVista({
  usuariosIniciales,
  consumoInicial,
  organizacionesIniciales,
}: AdminVistaProps) {
  const t = useTranslations("admin");
  const [pestaña, setPestaña] = useState<PestañaId>("usuarios");
  const [usuarios, setUsuarios] = useState(usuariosIniciales);
  const [organizaciones, setOrganizaciones] = useState(organizacionesIniciales);

  const PESTAÑAS = useMemo(
    () =>
      [
        { id: "usuarios", etiqueta: t("tabUsers") },
        { id: "consumo", etiqueta: t("tabUsage") },
        { id: "organizaciones", etiqueta: t("tabOrganizations") },
      ] as const,
    [t],
  );

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-bold text-text-primary">{t("title")}</h1>
        <p className="mt-1 text-sm text-text-muted">{t("subtitle")}</p>
      </header>

      <div className="flex gap-1 border-b border-border-default/50">
        {PESTAÑAS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPestaña(p.id)}
            className={cn(
              "-mb-px cursor-pointer border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              pestaña === p.id
                ? "border-primary text-primary"
                : "border-transparent text-text-muted hover:text-text-primary",
            )}
          >
            {p.etiqueta}
          </button>
        ))}
      </div>

      {pestaña === "usuarios" && (
        <TablaUsuarios
          usuarios={usuarios}
          organizaciones={organizaciones}
          onUsuarioCreado={(u) => setUsuarios((prev) => [...prev, u])}
        />
      )}
      {pestaña === "consumo" && <TablaConsumo consumo={consumoInicial} />}
      {pestaña === "organizaciones" && (
        <TablaOrganizaciones
          organizaciones={organizaciones}
          onOrganizacionCreada={(o) => setOrganizaciones((prev) => [...prev, o])}
        />
      )}
    </div>
  );
}
