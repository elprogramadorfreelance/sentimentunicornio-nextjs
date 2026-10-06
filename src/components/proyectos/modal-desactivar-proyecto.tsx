"use client";

import { CirclePauseIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
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
import { apiCambiarEstadoProyecto } from "@/lib/api";
import type { Proyecto } from "@/types";

type ModalDesactivarProyectoProps = {
  proyecto: Proyecto | null;
  abierto: boolean;
  onAbiertoChange: (abierto: boolean) => void;
  onDesactivado: (proyecto: Proyecto) => void;
};

export function ModalDesactivarProyecto({
  proyecto,
  abierto,
  onAbiertoChange,
  onDesactivado,
}: ModalDesactivarProyectoProps) {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!abierto) {
      setConfirmacion("");
      setError(null);
      setEnviando(false);
    }
  }, [abierto]);

  async function confirmarDesactivacion() {
    if (!proyecto) return;

    if (confirmacion.trim() !== proyecto.nombre) {
      setError(t("nameMismatch"));
      return;
    }

    setError(null);
    setEnviando(true);
    try {
      const respuesta = await apiCambiarEstadoProyecto(proyecto.id, "inactivo");
      onDesactivado(respuesta.proyecto);
      onAbiertoChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("deactivateError"));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={onAbiertoChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CirclePauseIcon className="size-5 shrink-0 text-warning" />
            {t("deactivateProject")}
          </DialogTitle>
          <DialogDescription>{t("deactivateBody")}</DialogDescription>
        </DialogHeader>

        {proyecto && (
          <div className="mt-4 space-y-4">
            <ul className="list-disc space-y-1.5 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5 pl-7 text-xs text-text-secondary">
              <li>{t("deactivateBullet1")}</li>
              <li>{t("deactivateBullet2")}</li>
              <li>{t("deactivateBullet3")}</li>
            </ul>

            <div className="rounded-lg border border-border-default/60 bg-bg-muted/50 px-3 py-2.5">
              <p className="text-xs font-medium text-text-muted">{t("confirmTypeName")}</p>
              <p className="mt-1 break-all font-mono text-sm font-semibold text-text-primary">
                {proyecto.nombre}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmar-desactivar-proyecto">{t("projectNameLabel")}</Label>
              <Input
                id="confirmar-desactivar-proyecto"
                autoComplete="off"
                autoFocus
                placeholder={t("exactNamePlaceholder")}
                value={confirmacion}
                onChange={(e) => {
                  setConfirmacion(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void confirmarDesactivacion();
                  }
                }}
                aria-invalid={!!error}
              />
              {error && <p className="text-xs text-error">{error}</p>}
            </div>
          </div>
        )}

        <DialogFooter className="border-t border-border-default/40 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onAbiertoChange(false)}
            disabled={enviando}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="border-warning/40 text-text-primary hover:bg-warning/15"
            onClick={() => void confirmarDesactivacion()}
            disabled={enviando || !proyecto || !confirmacion.trim()}
          >
            {enviando ? t("deactivating") : t("deactivateProject")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
