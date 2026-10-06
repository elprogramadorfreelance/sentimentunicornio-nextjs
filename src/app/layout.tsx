import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { ProveedorTema } from "@/components/tema";
import { Toaster } from "@/components/ui";
import { localeBcp47 } from "@/i18n/config";
import { COOKIE_TEMA, defaultTema, esTema, SCRIPT_TEMA, type Tema } from "@/lib/tema";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const grift = localFont({
  src: [
    {
      path: "../../public/fonts/grift-thin.woff2",
      weight: "100",
      style: "normal",
    },
    {
      path: "../../public/fonts/grift-thinitalic.woff2",
      weight: "100",
      style: "italic",
    },
    {
      path: "../../public/fonts/grift-extralight.woff2",
      weight: "200",
      style: "normal",
    },
    {
      path: "../../public/fonts/grift-extralightitalic.woff2",
      weight: "200",
      style: "italic",
    },
    {
      path: "../../public/fonts/grift-light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/grift-lightitalic.woff2",
      weight: "300",
      style: "italic",
    },
    {
      path: "../../public/fonts/grift-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/grift-italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../public/fonts/grift-medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/grift-mediumitalic.woff2",
      weight: "500",
      style: "italic",
    },
    {
      path: "../../public/fonts/grift-semibold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/grift-semibolditalic.woff2",
      weight: "600",
      style: "italic",
    },
    {
      path: "../../public/fonts/grift-bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/grift-bolditalic.woff2",
      weight: "700",
      style: "italic",
    },
    {
      path: "../../public/fonts/grift-extrabold.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../public/fonts/grift-extrabolditalic.woff2",
      weight: "800",
      style: "italic",
    },
    {
      path: "../../public/fonts/grift-black.woff2",
      weight: "900",
      style: "normal",
    },
    {
      path: "../../public/fonts/grift-blackitalic.woff2",
      weight: "900",
      style: "italic",
    },
  ],
  variable: "--font-grift",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("appMeta");
  const locale = await getLocale();

  return {
    title: {
      default: t("title"),
      template: `%s | ${t("title")}`,
    },
    description: t("description"),
    keywords: [
      "sentiment analysis",
      "analisis de sentimiento",
      "unicornio",
      "metricas",
      "opiniones",
    ],
    authors: [{ name: "Avantgardev" }],
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
      locale: locale === "en" ? "en_US" : "es_MX",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const cookieTema = (await cookies()).get(COOKIE_TEMA)?.value;
  const temaInicial: Tema = esTema(cookieTema) ? cookieTema : defaultTema;

  return (
    <html
      lang={localeBcp47(locale)}
      className={`${inter.variable} ${grift.variable} h-full antialiased${temaInicial === "dark" ? " dark" : ""}`}
      suppressHydrationWarning
    >
      <head>
        <script
          // Contenido estático del repo: aplica .dark antes del paint para evitar FOUC
          // biome-ignore lint/security/noDangerouslySetInnerHtml: script propio, no HTML de usuario
          dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }}
        />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <ProveedorTema preferenciaInicial={temaInicial}>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
            <Toaster />
          </NextIntlClientProvider>
        </ProveedorTema>
      </body>
    </html>
  );
}
