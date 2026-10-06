"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
} from "@/components/ui";
import { apiSolicitarCambioCorreo } from "@/lib/api";
import { validarFormatoEmail } from "@/lib/validaciones/credenciales";
import type { PerfilUsuario } from "@/types";

type ModalCambiarCorreoProps = {
  abierto: boolean;
  onAbiertoChange: (abierto: boolean) => void;
  emailActual: string;
  onActualizado: (perfil: PerfilUsuario) => void;
};

/**
 * Ya no aplica el cambio aquí — solo pide al backend que mande un correo real
 * con un link de confirmación (vence en 24h) al correo NUEVO. El cambio de
 * verdad ocurre cuando el usuario da clic en ese link, no en este modal —
 * por eso ya no hay paso de código OTP.
 */
export function ModalCambiarCorreo({
  abierto,
  onAbiertoChange,
  emailActual,
}: ModalCambiarCorreoProps) {
  const t = useTranslations("perfil");
  const tCommon = useTranslations("common");
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!abierto) {
      setNuevoEmail("");
      setError(null);
      setEnviando(false);
    }
  }, [abierto]);

  async function solicitarCambio() {
    const email = nuevoEmail.trim().toLowerCase();
    const errorFormato = validarFormatoEmail(email);
    if (errorFormato) {
      setError(t("emailInvalid"));
      return;
    }
    if (email === emailActual.toLowerCase()) {
      setError(t("emailMustDiffer"));
      return;
    }

    setError(null);
    setEnviando(true);
    try {
      const { mensaje } = await apiSolicitarCambioCorreo({ nuevoEmail: email });
      toast.success(t("checkNewEmail"), { description: mensaje });
      onAbiertoChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("confirmationEmailSendFailed"),
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={onAbiertoChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("changeEmail")}</DialogTitle>
          <DialogDescription>{t("changeEmailLinkDesc")}</DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nuevo-email">{t("newEmail")}</Label>
            <Input
              id="nuevo-email"
              type="email"
              autoComplete="email"
              placeholder={t("newEmailPlaceholder")}
              aria-invalid={!!error}
              value={nuevoEmail}
              onChange={(e) => {
                setNuevoEmail(e.target.value);
                if (error) setError(null);
              }}
              onBlur={() => {
                if (!nuevoEmail.trim()) return;
                const errorFormato = validarFormatoEmail(nuevoEmail);
                if (errorFormato) setError(t("emailInvalid"));
              }}
            />
            {nuevoEmail.trim() && !error && (
              <p className="text-xs text-text-muted">
                {t("emailFormatHint")}
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-error" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="mt-6 gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={enviando}
            onClick={() => onAbiertoChange(false)}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            disabled={enviando || !nuevoEmail.trim()}
            onClick={() => void solicitarCambio()}
          >
            {enviando ? tCommon("sending") : t("sendConfirmationLink")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
