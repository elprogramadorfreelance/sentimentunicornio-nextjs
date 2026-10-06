"use client";

import { InfoIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui";
import { cn } from "@/lib/utils";

type AvisoFrecuenciaActualizacionProps = {
  className?: string;
};

/**
 * Leyenda sobre frecuencia de actualización pedida por el cliente
 * (requerimientos de plataforma, sep-2026, punto 2) — texto literal
 * solicitado, junto al indicador de "Última actualización". El cron real de
 * server.js corre cada 2 horas y viene completando sin fallos en
 * producción, así que a diferencia del intento anterior (ver
 * AvisoActualizacion) sí se puede afirmar la cadencia sin faltar a la
 * verdad.
 */
export function AvisoFrecuenciaActualizacion({
  className,
}: AvisoFrecuenciaActualizacionProps) {
  const t = useTranslations("dashboard");
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex size-3.5 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            className,
          )}
          aria-label={t("updateFrequencyTrigger")}
        >
          <InfoIcon className="size-3.5" aria-hidden />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("updateFrequencyTitle")}</DialogTitle>
          <DialogDescription>{t("updateFrequencyBody")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button asChild size="sm" className="w-full">
            <Link href="/soporte">{t("updateFrequencyCta")}</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
