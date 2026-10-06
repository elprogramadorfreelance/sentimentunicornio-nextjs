import type { Locale } from "@/i18n/config";

export const WHATSAPP_POR_LOCALE: Record<
  Locale,
  { numero: string; href: string }
> = {
  es: { numero: "+52 5561362537", href: "https://wa.me/525561362537" },
  en: { numero: "+1 3466301746", href: "https://wa.me/13466301746" },
};
