"use client";

import { InfoIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { cn } from "@/lib/utils";

type AvisoMotoresIaProps = {
  className?: string;
};

/**
 * Botón de información junto a cada "Resumen IA" real de la app — explica
 * que el resultado sale de motores de IA en mejora continua, para que nadie
 * lo confunda con un dato fijo/verificado a mano. Texto pedido por el
 * cliente (requerimientos de plataforma, sep-2026, punto 1).
 */
export function AvisoMotoresIa({ className }: AvisoMotoresIaProps) {
  const t = useTranslations("common");
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex size-4 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            className,
          )}
          aria-label={t("aiDisclaimerTrigger")}
        >
          <InfoIcon className="size-3.5" aria-hidden />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("aiDisclaimerTitle")}</DialogTitle>
          <DialogDescription>{t("aiDisclaimerBody")}</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
