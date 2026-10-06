import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { COOKIE_LOCALE, defaultLocale, esLocale, type Locale } from "./config";

export default getRequestConfig(async () => {
  const store = await cookies();
  const crudo = store.get(COOKIE_LOCALE)?.value;
  const locale: Locale = esLocale(crudo) ? crudo : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
