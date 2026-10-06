"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import type { OrganizaciónAdmin, RolUsuario } from "@/types";

type FormularioNuevoUsuarioProps = {
  abierto: boolean;
  onAbiertoChange: (abierto: boolean) => void;
  organizaciones: OrganizaciónAdmin[];
  creando: boolean;
  onCrear: (datos: {
    organizationId: number;
    name: string;
    email: string;
    password: string;
    role: RolUsuario;
  }) => void;
};

function contraseñaTemporal(): string {
  return Math.random().toString(36).slice(-10);
}

export function FormularioNuevoUsuario({
  abierto,
  onAbiertoChange,
  organizaciones,
  creando,
  onCrear,
}: FormularioNuevoUsuarioProps) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<RolUsuario>("viewer");
  const [organizacionId, setOrganizacionId] = useState<string>("");

  const ROLES: { value: RolUsuario; label: string }[] = useMemo(
    () => [
      { value: "viewer", label: t("roleViewerDesc") },
      { value: "editor", label: t("roleEditorDesc") },
      { value: "admin", label: t("roleAdminDesc") },
    ],
    [t],
  );

  function limpiarYCerrar(valor: boolean) {
    if (!valor) {
      setNombre("");
      setCorreo("");
      setPassword("");
      setRol("viewer");
      setOrganizacionId("");
    }
    onAbiertoChange(valor);
  }

  function enviar() {
    // La contraseña se manda tal cual se escribió, sin trim — recortarla
    // guardaba una contraseña distinta a la que el usuario ve/recuerda si
    // quedó un espacio de más al principio o al final (bug real: cuenta
    // creada, contraseña "no funciona" porque nunca fue la que se tecleó).
    if (!nombre.trim() || !correo.trim() || !password.trim() || !organizacionId) return;
    onCrear({
      organizationId: Number(organizacionId),
      name: nombre.trim(),
      email: correo.trim(),
      password,
      role: rol,
    });
  }

  return (
    <Dialog open={abierto} onOpenChange={limpiarYCerrar}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("newUser")}</DialogTitle>
          <DialogDescription>{t("newUserDesc")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div>
            <Label htmlFor="nuevo-usuario-nombre">{tCommon("name")}</Label>
            <Input
              id="nuevo-usuario-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={t("fullNamePlaceholder")}
            />
          </div>
          <div>
            <Label htmlFor="nuevo-usuario-correo">{t("email")}</Label>
            <Input
              id="nuevo-usuario-correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder={t("emailPlaceholder")}
            />
          </div>
          <div>
            <Label htmlFor="nuevo-usuario-password">{tCommon("password")}</Label>
            <div className="flex gap-2">
              <Input
                id="nuevo-usuario-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("tempPasswordPlaceholder")}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPassword(contraseñaTemporal())}
              >
                {t("generate")}
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="nuevo-usuario-rol">{t("role")}</Label>
            <Select value={rol} onValueChange={(v) => setRol(v as RolUsuario)}>
              <SelectTrigger id="nuevo-usuario-rol">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="nuevo-usuario-org">{tCommon("organization")}</Label>
            <Select value={organizacionId} onValueChange={setOrganizacionId}>
              <SelectTrigger id="nuevo-usuario-org">
                <SelectValue placeholder={t("selectOrgPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {organizaciones.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => limpiarYCerrar(false)}>
            {tCommon("cancel")}
          </Button>
          <Button
            onClick={enviar}
            disabled={creando || !nombre.trim() || !correo.trim() || !password.trim() || !organizacionId}
          >
            {creando ? t("creating") : t("createUser")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
