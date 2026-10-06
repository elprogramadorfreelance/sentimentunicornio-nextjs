"use client";

import { TriangleAlertIcon } from "lucide-react";
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
import { apiEliminarProyecto } from "@/lib/api";
import type { Proyecto } from "@/types";

type ModalEliminarProyectoProps = {
  proyecto: Proyecto | null;
  abierto: boolean;
  onAbiertoChange: (abierto: boolean) => void;
  onEliminado: (id: string) => void;
};

export function ModalEliminarProyecto({
  proyecto,
  abierto,
  onAbiertoChange,
  onEliminado,
}: ModalEliminarProyectoProps) {
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

  async function confirmarEliminacion() {
    if (!proyecto) return;

    if (confirmacion.trim() !== proyecto.nombre) {
      setError(t("nameMismatch"));
      return;
    }

    setError(null);
    setEnviando(true);
    try {
      await apiEliminarProyecto(proyecto.id);
      onEliminado(proyecto.id);
      onAbiertoChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("deleteError"));
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
            {t("deleteProject")}
          </DialogTitle>
          <DialogDescription>{t("deleteBody")}</DialogDescription>
        </DialogHeader>

        {proyecto && (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-error/25 bg-error/5 px-3 py-2.5">
              <p className="text-xs font-medium text-text-muted">{t("confirmTypeName")}</p>
              <p className="mt-1 break-all font-mono text-sm font-semibold text-text-primary">
                {proyecto.nombre}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmar-nombre-proyecto">{t("projectNameLabel")}</Label>
              <Input
                id="confirmar-nombre-proyecto"
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
                    void confirmarEliminacion();
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
            variant="destructive"
            onClick={() => void confirmarEliminacion()}
            disabled={enviando || !proyecto || !confirmacion.trim()}
          >
            {enviando ? t("deleting") : t("deleteProject")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
