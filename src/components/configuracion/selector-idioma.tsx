"use client";

import { CheckIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitleBar } from "@/components/ui";
import { cambiarLocale } from "@/i18n/acciones";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const OPCIONES: {
  id: Locale;
  nombreKey: "languageEs" | "languageEn";
  hintKey: "languageEsHint" | "languageEnHint";
}[] = [
  { id: "es", nombreKey: "languageEs", hintKey: "languageEsHint" },
  { id: "en", nombreKey: "languageEn", hintKey: "languageEnHint" },
];

export function SelectorIdioma() {
  const t = useTranslations("settings");
  const locale = useLocale();
  const [pendiente, startTransition] = useTransition();

  function elegir(siguiente: Locale) {
    if (siguiente === locale || pendiente) return;

    startTransition(async () => {
      await cambiarLocale(siguiente);
      window.location.reload();
    });
  }

  return (
    <Card className="bg-bg-base">
      <CardHeader className="mb-5">
        <CardTitleBar bleed="lg">{t("languageSection")}</CardTitleBar>
        <h2 className="text-lg font-bold text-text-primary">
          {t("languageTitle")}
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          {t("languageDescription")}
        </p>
      </CardHeader>

      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {OPCIONES.map((opcion) => {
            const seleccionado = locale === opcion.id;
            return (
              <button
                key={opcion.id}
                type="button"
                aria-pressed={seleccionado}
                disabled={pendiente}
                onClick={() => elegir(opcion.id)}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border px-4 py-3.5 text-left transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                  "disabled:cursor-wait disabled:opacity-70",
                  seleccionado
                    ? "border-primary bg-primary/5"
                    : "border-border-default bg-bg-subtle hover:border-border-strong hover:bg-bg-muted",
                )}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-text-primary">
                    {t(opcion.nombreKey)}
                  </span>
                  {t(opcion.hintKey) ? (
                    <span className="mt-0.5 block text-xs text-text-muted">
                      {t(opcion.hintKey)}
                    </span>
                  ) : null}
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
