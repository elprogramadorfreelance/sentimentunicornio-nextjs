import { defaultLocale, esLocale, type Locale } from "@/i18n/config";

export const VIDEO_HERO_DASHBOARD = {
  src: "https://res.cloudinary.com/dzqmdmhwy/video/upload/v1789678653/sentiment-dashboard.mp4",
  type: "video/mp4",
} as const;

export const VIDEO_SERVICIOS_POR_LOCALE: Record<
  Locale,
  { src: string; type: string }
> = {
  es: { src: "/landing/video_esp.mp4", type: "video/mp4" },
  en: { src: "/landing/video_eng.mov", type: "video/quicktime" },
};

export function videoServiciosLanding(locale: string) {
  return VIDEO_SERVICIOS_POR_LOCALE[esLocale(locale) ? locale : defaultLocale];
}
