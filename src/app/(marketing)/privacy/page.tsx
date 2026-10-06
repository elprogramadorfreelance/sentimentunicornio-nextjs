import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import unicornioLogoClaro from "@/assets/unicornio-logo-dark.webp";
import unicornioLogoOscuro from "@/assets/unicornio-logo-light.webp";
import { AvisoPrivacidadContenido } from "@/components/legal";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal");
  return { title: t("title"), description: t("metaDescription") };
}

export default async function PrivacyPage() {
  const tNav = await getTranslations("nav");

  return (
    <div className="min-h-dvh bg-bg-base">
      <header className="sticky top-0 z-20 border-b border-border-default/40 bg-bg-base/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="inline-flex shrink-0">
            <Image
              src={unicornioLogoClaro}
              alt="Unicornio"
              className="h-8 w-auto dark:hidden"
              priority
            />
            <Image
              src={unicornioLogoOscuro}
              alt="Unicornio"
              className="hidden h-8 w-auto dark:block"
              priority
            />
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-text-secondary transition-colors hover:text-primary"
          >
            {tNav("dashboard")}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <AvisoPrivacidadContenido />
      </main>
    </div>
  );
}
