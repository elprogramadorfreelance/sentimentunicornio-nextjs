"use server";

import { cookies } from "next/headers";
import { COOKIE_LOCALE, defaultLocale, esLocale, type Locale } from "./config";

export async function cambiarLocale(siguiente: string): Promise<Locale> {
  const locale: Locale = esLocale(siguiente) ? siguiente : defaultLocale;
  const store = await cookies();
  store.set(COOKIE_LOCALE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return locale;
}
