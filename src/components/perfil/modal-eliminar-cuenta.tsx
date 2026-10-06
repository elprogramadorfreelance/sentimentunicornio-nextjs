"use client";

import { TriangleAlertIcon } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { apiEliminarCuenta, apiEnviarOtpPerfil, apiVerificarOtpPerfil } from "@/lib/api";
import { CampoOtp } from "./campo-otp";

type Paso = "confirmar" | "otp";

type ModalEliminarCuentaProps = {
  abierto: boolean;
  onAbiertoChange: (abierto: boolean) => void;
  nombreUsuario: string;
  emailActual: string;
};

export function ModalEliminarCuenta({
  abierto,
  onAbiertoChange,
  nombreUsuario,
  emailActual,
}: ModalEliminarCuentaProps) {
  const t = useTranslations("perfil");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>("confirmar");
  const [confirmacion, setConfirmacion] = useState("");
  const [código, setCódigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!abierto) {
      setPaso("confirmar");
      setConfirmacion("");
      setCódigo("");
      setError(null);
      setEnviando(false);
    }
  }, [abierto]);

  async function enviarCódigo() {
    if (confirmacion.trim() !== nombreUsuario) {
      setError(t("nameMismatch"));
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      const respuesta = await apiEnviarOtpPerfil({ propósito: "eliminar_cuenta" });
      if (!respuesta.enviado) {
        setError(
          t("codeSendFailedDetailed", { message: respuesta.mensaje }),
        );
        return;
      }
      toast.message(t("codeSent"), { description: `${respuesta.mensaje} (${emailActual})` });
      setPaso("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("codeSendFailed"));
    } finally {
      setEnviando(false);
    }
  }

  async function verificarYEliminar() {
    if (código.length !== 6) {
      setError(t("codeLength"));
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      const verificación = await apiVerificarOtpPerfil({ propósito: "eliminar_cuenta", código });
      if (!verificación.válido || !verificación.tokenCambio) {
        setError(verificación.mensaje);
        return;
      }
      const respuesta = await apiEliminarCuenta({ tokenCambio: verificación.tokenCambio });
      toast.success(t("accountDeleted"), { description: respuesta.mensaje });
      onAbiertoChange(false);
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("deleteFailed"));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={onAbiertoChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-error">
            <TriangleAlertIcon className="size-5 shrink-0" />
            {t("deleteTitle")}
          </DialogTitle>
          <DialogDescription>
            {paso === "confirmar"
              ? t("deleteDesc")
              : t("deleteOtpDesc", { email: emailActual })}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {paso === "confirmar" ? (
            <>
              <div className="rounded-lg border border-error/25 bg-error/5 px-3 py-2.5">
                <p className="text-xs font-medium text-text-muted">{t("typeNameToConfirm")}</p>
                <p className="mt-1 break-all font-mono text-sm font-semibold text-text-primary">
                  {nombreUsuario}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmar-nombre-cuenta">{t("yourName")}</Label>
                <Input
                  id="confirmar-nombre-cuenta"
                  autoComplete="off"
                  autoFocus
                  placeholder={t("typeExactName")}
                  value={confirmacion}
                  onChange={(e) => {
                    setConfirmacion(e.target.value);
                    if (error) setError(null);
                  }}
                  aria-invalid={!!error}
                />
              </div>
            </>
          ) : (
            <CampoOtp
              id="otp-eliminar"
              value={código}
              onChange={(v) => {
                setCódigo(v);
                if (error) setError(null);
              }}
              disabled={enviando}
            />
          )}
          {error && <p className="text-xs text-error">{error}</p>}
        </div>

        <DialogFooter className="border-t border-border-default/40 pt-4">
          <Button type="button" variant="ghost" onClick={() => onAbiertoChange(false)} disabled={enviando}>
            {tCommon("cancel")}
          </Button>
          {paso === "confirmar" ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => void enviarCódigo()}
              disabled={enviando || !confirmacion.trim()}
            >
              {enviando ? tCommon("sending") : t("sendCode")}
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              onClick={() => void verificarYEliminar()}
              disabled={enviando || código.length !== 6}
            >
              {enviando ? t("deleting") : t("deleteTitle")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
