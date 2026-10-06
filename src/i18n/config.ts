export const LOCALES = ["es", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const defaultLocale: Locale = "es";

export const COOKIE_LOCALE = "locale";

export const LOCALE_BCP47: Record<Locale, string> = {
  es: "es-MX",
  en: "en-US",
};

export function esLocale(valor: unknown): valor is Locale {
  return valor === "es" || valor === "en";
}

export function localeBcp47(locale: string): string {
  return esLocale(locale) ? LOCALE_BCP47[locale] : LOCALE_BCP47[defaultLocale];
}
