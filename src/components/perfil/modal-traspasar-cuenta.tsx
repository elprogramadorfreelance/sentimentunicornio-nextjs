"use client";

import { CircleArrowRightIcon } from "lucide-react";
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
import { apiSolicitarTraspaso } from "@/lib/api";

type ModalTraspasarCuentaProps = {
  abierto: boolean;
  onAbiertoChange: (abierto: boolean) => void;
  nombreUsuario: string;
  emailActual: string;
};

/**
 * Ya no traspasa aquí — solo pide al backend que mande un correo real con un
 * link de confirmación (vence en 24h) al correo ACTUAL (quien traspasa). El
 * traspaso de verdad ocurre cuando da clic en ese link — por eso ya no hay
 * paso de código OTP.
 */
export function ModalTraspasarCuenta({
  abierto,
  onAbiertoChange,
  nombreUsuario,
  emailActual,
}: ModalTraspasarCuentaProps) {
  const t = useTranslations("perfil");
  const tCommon = useTranslations("common");
  const [emailDestino, setEmailDestino] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!abierto) {
      setEmailDestino("");
      setConfirmacion("");
      setError(null);
      setEnviando(false);
    }
  }, [abierto]);

  async function solicitarTraspaso() {
    if (!emailDestino.trim() || !emailDestino.includes("@")) {
      setError(t("invalidDestEmail"));
      return;
    }
    if (confirmacion.trim() !== nombreUsuario) {
      setError(t("nameMismatch"));
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      const respuesta = await apiSolicitarTraspaso({ emailDestino: emailDestino.trim() });
      toast.success(t("checkEmail"), { description: `${respuesta.mensaje} (${emailActual})` });
      onAbiertoChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("confirmationEmailSendFailed"));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={onAbiertoChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-text-primary">
            <CircleArrowRightIcon className="size-5 shrink-0 text-primary" />
            {t("transferModalTitle")}
          </DialogTitle>
          <DialogDescription>{t("transferLinkDesc")}</DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email-destino-traspaso">{t("destEmail")}</Label>
            <Input
              id="email-destino-traspaso"
              type="email"
              autoComplete="off"
              placeholder={t("destEmailPlaceholder")}
              value={emailDestino}
              onChange={(e) => {
                setEmailDestino(e.target.value);
                if (error) setError(null);
              }}
            />
          </div>

          <div className="rounded-lg border border-border-default bg-bg-subtle px-3 py-2.5">
            <p className="text-xs font-medium text-text-muted">
              {t("typeNameSensitive")}
            </p>
            <p className="mt-1 break-all font-mono text-sm font-semibold text-text-primary">
              {nombreUsuario}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmar-nombre-traspaso">{t("yourName")}</Label>
            <Input
              id="confirmar-nombre-traspaso"
              autoComplete="off"
              placeholder={t("typeExactName")}
              value={confirmacion}
              onChange={(e) => {
                setConfirmacion(e.target.value);
                if (error) setError(null);
              }}
              aria-invalid={!!error}
            />
          </div>
          {error && <p className="text-xs text-error">{error}</p>}
        </div>

        <DialogFooter className="border-t border-border-default/40 pt-4">
          <Button type="button" variant="ghost" onClick={() => onAbiertoChange(false)} disabled={enviando}>
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            disabled={enviando || !emailDestino.trim() || !confirmacion.trim()}
            onClick={() => void solicitarTraspaso()}
          >
            {enviando ? tCommon("sending") : t("sendConfirmationLink")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
