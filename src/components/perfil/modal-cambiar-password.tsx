"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
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
import {
  apiCambiarPasswordPerfil,
  apiEnviarOtpPerfil,
  apiVerificarOtpPerfil,
} from "@/lib/api";
import {
  evaluarPassword,
  type RequisitoPassword,
} from "@/lib/validaciones/credenciales";
import { CampoOtp } from "./campo-otp";
import { IndicadorSeguridadPassword } from "./indicador-seguridad-password";

type Paso = "datos" | "otp";

const CLAVES_REQUISITO: Record<
  RequisitoPassword["id"],
  | "passwordMinLength"
  | "passwordUppercase"
  | "passwordNumber"
  | "passwordSpecial"
> = {
  longitud: "passwordMinLength",
  mayuscula: "passwordUppercase",
  numero: "passwordNumber",
  especial: "passwordSpecial",
};

type ModalCambiarPasswordProps = {
  abierto: boolean;
  onAbiertoChange: (abierto: boolean) => void;
  emailActual: string;
};

export function ModalCambiarPassword({
  abierto,
  onAbiertoChange,
  emailActual,
}: ModalCambiarPasswordProps) {
  const t = useTranslations("perfil");
  const tCommon = useTranslations("common");
  const [paso, setPaso] = useState<Paso>("datos");
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [código, setCódigo] = useState("");
  const [tokenCambio, setTokenCambio] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const evaluación = useMemo(() => evaluarPassword(password), [password]);
  const coinciden = confirmacion.length > 0 && password === confirmacion;

  useEffect(() => {
    if (!abierto) {
      setPaso("datos");
      setPassword("");
      setConfirmacion("");
      setCódigo("");
      setTokenCambio(null);
      setError(null);
      setEnviando(false);
    }
  }, [abierto]);

  async function enviarCódigo() {
    if (!evaluación.esVálida) {
      const faltantes = evaluación.requisitos
        .filter((r) => !r.cumple)
        .map((r) => t(CLAVES_REQUISITO[r.id]).toLowerCase());
      setError(t("passwordMustMeet", { requirements: faltantes.join(", ") }));
      return;
    }
    if (password !== confirmacion) {
      setError(t("passwordsMismatch"));
      return;
    }

    setError(null);
    setEnviando(true);
    try {
      const respuesta = await apiEnviarOtpPerfil({
        propósito: "cambiar_password",
      });
      if (!respuesta.enviado) {
        setError(
          t("codeSendFailedDetailed", { message: respuesta.mensaje }),
        );
        return;
      }
      toast.message(t("codeSent"), {
        description: `${respuesta.mensaje} (${emailActual})`,
      });
      setPaso("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("codeSendFailed"));
    } finally {
      setEnviando(false);
    }
  }

  async function verificarYCambiar() {
    if (código.length !== 6) {
      setError(t("codeLength"));
      return;
    }

    setError(null);
    setEnviando(true);
    try {
      let token = tokenCambio;
      if (!token) {
        const verificación = await apiVerificarOtpPerfil({
          propósito: "cambiar_password",
          código,
        });
        if (!verificación.válido || !verificación.tokenCambio) {
          setError(verificación.mensaje);
          setEnviando(false);
          return;
        }
        token = verificación.tokenCambio;
        setTokenCambio(token);
      }

      const respuesta = await apiCambiarPasswordPerfil({
        tokenCambio: token,
        nuevaPassword: password,
      });
      toast.success(t("passwordUpdated"), {
        description: respuesta.mensaje,
      });
      onAbiertoChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("passwordChangeFailed"));
      setTokenCambio(null);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={onAbiertoChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("changePassword")}</DialogTitle>
          <DialogDescription>
            {paso === "datos"
              ? t("changePasswordDesc", { email: emailActual })
              : t("changePasswordOtpDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {paso === "datos" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="nueva-password">{t("newPassword")}</Label>
                <Input
                  id="nueva-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder={t("newPasswordPlaceholder")}
                  aria-invalid={!!error && !!password && !evaluación.esVálida}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                />
              </div>

              <IndicadorSeguridadPassword password={password} />

              <div className="space-y-1.5">
                <Label htmlFor="confirmar-password">
                  {t("confirmPassword")}
                </Label>
                <Input
                  id="confirmar-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder={t("confirmPasswordPlaceholder")}
                  aria-invalid={
                    confirmacion.length > 0 && password !== confirmacion
                  }
                  value={confirmacion}
                  onChange={(e) => {
                    setConfirmacion(e.target.value);
                    if (error) setError(null);
                  }}
                />
                {confirmacion.length > 0 && (
                  <p
                    className={
                      coinciden ? "text-xs text-success" : "text-xs text-error"
                    }
                  >
                    {coinciden ? t("passwordsMatch") : t("passwordsMismatch")}
                  </p>
                )}
              </div>
            </>
          ) : (
            <CampoOtp
              id="otp-password"
              value={código}
              onChange={(v) => {
                setCódigo(v);
                if (error) setError(null);
              }}
              disabled={enviando}
            />
          )}

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
          {paso === "datos" ? (
            <Button
              type="button"
              disabled={enviando || !evaluación.esVálida || !coinciden}
              onClick={() => void enviarCódigo()}
            >
              {enviando ? tCommon("sending") : t("sendCode")}
            </Button>
          ) : (
            <Button
              type="button"
              disabled={enviando || código.length !== 6}
              onClick={() => void verificarYCambiar()}
            >
              {enviando ? t("verifying") : t("confirmPassword")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
