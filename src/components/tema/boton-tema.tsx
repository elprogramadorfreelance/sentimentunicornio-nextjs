"use client";

import { useTranslations } from "next-intl";
import { AnimatedThemeToggler } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useTema } from "./proveedor-tema";

export function BotonTema({ className }: { className?: string }) {
  const t = useTranslations("auth");
  const { resuelto, elegir } = useTema();
  const oscuro = resuelto === "dark";

  return (
    <AnimatedThemeToggler
      theme={resuelto}
      onThemeChange={(tema) => elegir(tema)}
      aria-label={oscuro ? t("themeToLight") : t("themeToDark")}
      className={cn(
        "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-text-secondary transition-colors duration-200",
        "hover:bg-bg-muted hover:text-text-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        className,
      )}
    />
  );
}
