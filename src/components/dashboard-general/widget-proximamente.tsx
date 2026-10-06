"use client";

import { ClockIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type WidgetProximamenteProps = {
  titulo: string;
  descripcion: string;
  className?: string;
};

/**
 * Placeholder honesto para widgets cuyo dato no existe todavía en el backend
 * real (alcance, tráfico/tonalidad por fuente, trending topics, palabras
 * clave, países, imágenes/video) — mejor esto que inventar cifras.
 */
export function WidgetProximamente({ titulo, descripcion, className }: WidgetProximamenteProps) {
  const t = useTranslations("dashboard");

  return (
    <section
      className={cn(
        "flex h-full min-h-0 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border-default/60 bg-bg-subtle/40 p-3 text-center",
        className,
      )}
      aria-label={t("comingSoonAria", { title: titulo })}
    >
      <ClockIcon className="size-4 text-text-muted" aria-hidden />
      <span className="text-[9px] font-semibold uppercase tracking-widest text-text-muted">
        {t("comingSoon")}
      </span>
      <h2 className="text-sm font-semibold text-text-secondary">{titulo}</h2>
      <p className="max-w-[22rem] text-[11px] leading-snug text-text-muted">{descripcion}</p>
    </section>
  );
}
