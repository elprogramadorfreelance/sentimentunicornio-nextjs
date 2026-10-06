"use client";

import { CirclePlayIcon } from "lucide-react";
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
} from "@/components/ui";
import { apiCambiarEstadoProyecto } from "@/lib/api";
import type { Proyecto } from "@/types";

type ModalActivarProyectoProps = {
  proyecto: Proyecto | null;
  abierto: boolean;
  onAbiertoChange: (abierto: boolean) => void;
  onActivado: (proyecto: Proyecto) => void;
};

export function ModalActivarProyecto({
  proyecto,
  abierto,
  onAbiertoChange,
  onActivado,
}: ModalActivarProyectoProps) {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!abierto) {
      setError(null);
      setEnviando(false);
    }
  }, [abierto]);

  async function confirmarActivacion() {
    if (!proyecto) return;

    setError(null);
    setEnviando(true);
    try {
      const respuesta = await apiCambiarEstadoProyecto(proyecto.id, "activo");
      onActivado(respuesta.proyecto);
      onAbiertoChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("activateError"));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={onAbiertoChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CirclePlayIcon className="size-5 shrink-0 text-success" />
            {t("activateProject")}
          </DialogTitle>
          <DialogDescription>
            {proyecto
              ? t.rich("activateBody", {
                  name: proyecto.nombre,
                  strong: (chunks) => (
                    <span className="font-semibold text-text-primary">{chunks}</span>
                  ),
                })
              : t("activateBodyFallback")}
          </DialogDescription>
        </DialogHeader>

        {error && <p className="mt-3 text-xs text-error">{error}</p>}

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
            onClick={() => void confirmarActivacion()}
            disabled={enviando || !proyecto}
          >
            {enviando ? t("activating") : t("activateProject")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
