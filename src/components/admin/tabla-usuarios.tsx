"use client";

import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Badge,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { apiCrearUsuarioAdmin } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { OrganizaciónAdmin, RolUsuario, UsuarioAdmin } from "@/types";
import { FormularioNuevoUsuario } from "./formulario-nuevo-usuario";

const COLOR_ROL: Record<UsuarioAdmin["role"], string> = {
  superadmin: "bg-accent/10 text-accent",
  admin: "bg-primary/10 text-primary",
  editor: "bg-success/10 text-success",
  viewer: "bg-bg-muted text-text-muted",
};

type TablaUsuariosProps = {
  usuarios: UsuarioAdmin[];
  organizaciones: OrganizaciónAdmin[];
  onUsuarioCreado: (usuario: UsuarioAdmin) => void;
};

export function TablaUsuarios({ usuarios, organizaciones, onUsuarioCreado }: TablaUsuariosProps) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [creando, setCreando] = useState(false);

  const ETIQUETA_ROL: Record<UsuarioAdmin["role"], string> = useMemo(
    () => ({
      superadmin: t("roleSuperadmin"),
      admin: t("roleAdmin"),
      editor: t("roleEditor"),
      viewer: t("roleViewer"),
    }),
    [t],
  );

  async function crearUsuario(datos: {
    organizationId: number;
    name: string;
    email: string;
    password: string;
    role: RolUsuario;
  }) {
    setCreando(true);
    try {
      const usuario = await apiCrearUsuarioAdmin(datos.organizationId, {
        name: datos.name,
        email: datos.email,
        password: datos.password,
        role: datos.role,
      });
      onUsuarioCreado(usuario);
      toast.success(t("userCreated"), {
        description: t("userCreatedDesc", { email: datos.email }),
      });
      setModalAbierto(false);
    } catch (error) {
      toast.error(t("userCreateFailed"), {
        description: error instanceof Error ? error.message : tCommon("tryAgain"),
      });
    } finally {
      setCreando(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setModalAbierto(true)}>
          <PlusIcon className="size-4" />
          {t("newUser")}
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tCommon("name")}</TableHead>
              <TableHead>{t("email")}</TableHead>
              <TableHead>{t("role")}</TableHead>
              <TableHead>{tCommon("organization")}</TableHead>
              <TableHead>{t("created")}</TableHead>
              <TableHead>{t("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-text-muted">
                  {t("noUsers")}
                </TableCell>
              </TableRow>
            ) : (
              usuarios.map((u) => {
                const org = organizaciones.find((o) => o.id === u.organization_id);
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-text-primary">{u.name}</TableCell>
                    <TableCell className="text-text-secondary">{u.email}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          COLOR_ROL[u.role],
                        )}
                      >
                        {ETIQUETA_ROL[u.role]}
                      </span>
                    </TableCell>
                    <TableCell className="text-text-secondary">{org?.name ?? `#${u.organization_id}`}</TableCell>
                    <TableCell className="text-text-muted">
                      {new Date(u.created_at).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variante={u.status === "active" ? "positivo" : "neutral"}>
                        {u.status === "active" ? t("statusActive") : t("statusArchived")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <FormularioNuevoUsuario
        abierto={modalAbierto}
        onAbiertoChange={setModalAbierto}
        organizaciones={organizaciones}
        creando={creando}
        onCrear={crearUsuario}
      />
    </div>
  );
}
