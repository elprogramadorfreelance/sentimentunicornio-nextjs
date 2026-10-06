"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Avatar,
  AvatarFallback,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@/components/ui";
import { apiActualizarPerfil } from "@/lib/api";
import type { PerfilUsuario, SesiónUsuario } from "@/types";

type SeccionIdentidadProps = {
  perfil: PerfilUsuario;
  onActualizado: (perfil: PerfilUsuario) => void;
};

export function SeccionIdentidad({ perfil, onActualizado }: SeccionIdentidadProps) {
  const t = useTranslations("perfil");
  const tRoles = useTranslations("roles");
  const tCommon = useTranslations("common");
  const ETIQUETA_ROL: Record<SesiónUsuario["role"], string> = {
    superadmin: tRoles("superadmin"),
    admin: tRoles("admin"),
    editor: tRoles("editor"),
    viewer: tRoles("viewer"),
  };
  const [nombre, setNombre] = useState(perfil.nombre);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setNombre(perfil.nombre);
  }, [perfil.nombre]);

  const hayCambios = nombre.trim() !== perfil.nombre;

  async function guardarDatos() {
    if (!nombre.trim()) {
      toast.error(t("nameRequired"));
      return;
    }

    setGuardando(true);
    try {
      const { perfil: actualizado } = await apiActualizarPerfil({ nombre: nombre.trim() });
      onActualizado(actualizado);
      toast.success(t("profileUpdated"));
    } catch (err) {
      toast.error(t("saveFailed"), {
        description: err instanceof Error ? err.message : tCommon("tryAgainLaterAlt"),
      });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Card className="bg-bg-base">
      <CardHeader className="mb-5">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {t("identitySection")}
        </CardTitle>
        <h2 className="text-lg font-bold text-text-primary">{t("identityTitle")}</h2>
        <p className="mt-1 text-sm text-text-muted">{t("identityHelperSimple")}</p>
      </CardHeader>

      <CardContent className="space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <Avatar className="size-28 ring-4 ring-bg-muted sm:size-32">
            <AvatarFallback className="bg-bg-muted text-2xl font-bold tracking-wide text-text-primary sm:text-3xl">
              {perfil.iniciales}
            </AvatarFallback>
          </Avatar>
          <p className="text-xs text-text-muted">{ETIQUETA_ROL[perfil.rol]}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="perfil-nombre">{tCommon("name")}</Label>
            <Input
              id="perfil-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="perfil-rol">{t("roleLabel")}</Label>
            <Input id="perfil-rol" value={ETIQUETA_ROL[perfil.rol]} disabled />
          </div>
        </div>

        <Button type="button" disabled={guardando || !hayCambios} onClick={() => void guardarDatos()}>
          {guardando ? tCommon("saving") : tCommon("saveChanges")}
        </Button>
      </CardContent>
    </Card>
  );
}
