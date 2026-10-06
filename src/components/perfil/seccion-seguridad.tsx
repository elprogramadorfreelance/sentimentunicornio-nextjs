"use client";

import { KeyRoundIcon, MailIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import type { PerfilUsuario } from "@/types";
import { ModalCambiarCorreo } from "./modal-cambiar-correo";
import { ModalCambiarPassword } from "./modal-cambiar-password";

type SeccionSeguridadProps = {
  perfil: PerfilUsuario;
  onActualizado: (perfil: PerfilUsuario) => void;
};

export function SeccionSeguridad({
  perfil,
  onActualizado,
}: SeccionSeguridadProps) {
  const t = useTranslations("perfil");
  const tCommon = useTranslations("common");
  const [correoAbierto, setCorreoAbierto] = useState(false);
  const [passwordAbierta, setPasswordAbierta] = useState(false);

  return (
    <>
      <Card className="bg-bg-base">
        <CardHeader className="mb-5">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t("securitySection")}
          </CardTitle>
          <h2 className="text-lg font-bold text-text-primary">
            {t("securityTitle")}
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            {t("securityHelper")}
          </p>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex flex-col gap-3 rounded-xl border border-border-default bg-bg-subtle px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MailIcon className="size-5" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {t("emailLabel")}
                </p>
                <p className="text-sm text-text-secondary">{perfil.email}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCorreoAbierto(true)}
            >
              {t("changeEmail")}
            </Button>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-border-default bg-bg-subtle px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <KeyRoundIcon className="size-5" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {tCommon("password")}
                </p>
                <p className="text-sm text-text-secondary">••••••••••••</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPasswordAbierta(true)}
            >
              {t("changePassword")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ModalCambiarCorreo
        abierto={correoAbierto}
        onAbiertoChange={setCorreoAbierto}
        emailActual={perfil.email}
        onActualizado={onActualizado}
      />
      <ModalCambiarPassword
        abierto={passwordAbierta}
        onAbiertoChange={setPasswordAbierta}
        emailActual={perfil.email}
      />
    </>
  );
}
