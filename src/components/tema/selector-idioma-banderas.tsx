"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { BanderaMx } from "@/components/icons/bandera-mx";
import { BanderaUs } from "@/components/icons/bandera-us";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui";
import { cambiarLocale } from "@/i18n/acciones";
import { esLocale, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const CLASE_BANDERA = "h-4 w-6 shrink-0 overflow-hidden rounded-[2px] ring-1 ring-border-default";

export function Bandera({ locale, className }: { locale: Locale; className?: string }) {
  return locale === "es" ? (
    <BanderaMx className={cn(CLASE_BANDERA, className)} />
  ) : (
    <BanderaUs className={cn(CLASE_BANDERA, className)} />
  );
}

type SelectorIdiomaBanderasProps = {
  className?: string;
};

export function SelectorIdiomaBanderas({ className }: SelectorIdiomaBanderasProps) {
  const t = useTranslations("auth");
  const tSettings = useTranslations("settings");
  const locale = useLocale();
  const [pendiente, startTransition] = useTransition();
  const actual: Locale = esLocale(locale) ? locale : "es";

  function elegir(siguiente: string) {
    if (!esLocale(siguiente) || siguiente === locale || pendiente) return;

    startTransition(async () => {
      await cambiarLocale(siguiente);
      window.location.reload();
    });
  }

  return (
    <Select value={locale} onValueChange={elegir} disabled={pendiente}>
      <SelectTrigger
        aria-label={t("languageAria")}
        className={cn("h-11 w-14 justify-center gap-1 bg-bg-base px-2", className)}
      >
        <Bandera locale={actual} />
      </SelectTrigger>
      <SelectContent align="end" className="min-w-0">
        <SelectItem value="es" className="justify-center pr-8">
          <Bandera locale="es" />
          <span className="sr-only">{tSettings("languageEs")}</span>
        </SelectItem>
        <SelectItem value="en" className="justify-center pr-8">
          <Bandera locale="en" />
          <span className="sr-only">{tSettings("languageEn")}</span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
