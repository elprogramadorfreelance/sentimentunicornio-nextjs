"use client";

import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComponentType, SVGProps } from "react";
import { useTema } from "@/components/tema";
import { Card, CardContent, CardHeader, CardTitleBar } from "@/components/ui";
import type { Tema } from "@/lib/tema";
import { cn } from "@/lib/utils";

type IconoOpcion = ComponentType<
  SVGProps<SVGSVGElement> & { title?: string; titleId?: string }
>;

const OPCIONES: {
  id: Tema;
  nombreKey: "appearanceLight" | "appearanceDark" | "appearanceSystem";
  hintKey: "appearanceLightHint" | "appearanceDarkHint" | "appearanceSystemHint";
  Icono: IconoOpcion;
}[] = [
  { id: "light", nombreKey: "appearanceLight", hintKey: "appearanceLightHint", Icono: SunIcon },
  { id: "dark", nombreKey: "appearanceDark", hintKey: "appearanceDarkHint", Icono: MoonIcon },
  {
    id: "system",
    nombreKey: "appearanceSystem",
    hintKey: "appearanceSystemHint",
    Icono: MonitorIcon,
  },
];

export function SelectorApariencia() {
  const t = useTranslations("settings");
  const { preferencia, elegir } = useTema();

  return (
    <Card className="bg-bg-base">
      <CardHeader className="mb-5">
        <CardTitleBar bleed="lg">{t("appearanceSection")}</CardTitleBar>
        <h2 className="text-lg font-bold text-text-primary">{t("appearanceTitle")}</h2>
        <p className="mt-1 text-sm text-text-muted">{t("appearanceDescription")}</p>
      </CardHeader>

      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          {OPCIONES.map((opcion) => {
            const seleccionado = preferencia === opcion.id;
            const Icono = opcion.Icono;
            return (
              <button
                key={opcion.id}
                type="button"
                aria-pressed={seleccionado}
                onClick={() => elegir(opcion.id)}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border px-4 py-3.5 text-left transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  seleccionado
                    ? "border-primary bg-primary/5"
                    : "border-border-default bg-bg-subtle hover:border-border-strong hover:bg-bg-muted",
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Icono className="size-5 shrink-0 text-text-secondary" aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-text-primary">
                      {t(opcion.nombreKey)}
                    </span>
                    <span className="mt-0.5 block text-xs text-text-muted">
                      {t(opcion.hintKey)}
                    </span>
                  </span>
                </span>
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border",
                    seleccionado
                      ? "border-primary bg-primary text-primary-fg"
                      : "border-border-default bg-bg-base text-transparent",
                  )}
                  aria-hidden
                >
                  <CheckIcon className="size-3.5 stroke-[2.5]" />
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
