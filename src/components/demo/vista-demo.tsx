"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import globalLogo from "@/assets/global-logo.webp";
import loginImage from "@/assets/login.webp";
import unicornioLogoClaro from "@/assets/unicornio-logo-dark.webp";
import unicornioLogoOscuro from "@/assets/unicornio-logo-light.webp";
import { FormularioDemo } from "@/components/demo/formulario-demo";

export function VistaDemo() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");

  return (
    <div className="flex min-h-screen">
      <section className="flex w-full flex-col justify-between bg-bg-subtle px-6 py-8 sm:px-12 lg:w-1/2 lg:px-20 xl:px-28">
        <div className="pt-4">
          <Link href="/">
            <Image
              src={unicornioLogoClaro}
              alt="Unicornio"
              className="absolute left-12 top-10 z-10 h-auto w-40 xl:left-20 dark:hidden"
              priority
            />
            <Image
              src={unicornioLogoOscuro}
              alt="Unicornio"
              className="absolute left-12 top-10 z-10 hidden h-auto w-40 xl:left-20 dark:block"
              priority
            />
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <div className="mb-8 space-y-2">
            <h1 className="text-center text-4xl font-bold text-text-primary">
              {t("demoTitle")}
            </h1>
            <p className="text-center text-sm text-text-secondary">
              {t("demoSubtitleSimple")}
            </p>
          </div>

          <FormularioDemo />
        </div>

        <div className="flex items-center justify-between text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            {tCommon("poweredBy")}
            <span className="inline-flex items-center font-semibold text-text-primary">
              <Image
                src={globalLogo}
                alt=""
                aria-hidden="true"
                className="mr-1 size-12 object-contain"
              />
            </span>
          </span>
          <Link
            href="/privacy"
            className="font-medium transition-colors hover:text-text-primary"
          >
            {tCommon("privacyNotice")}
          </Link>
        </div>
      </section>

      <section className="hidden bg-bg-subtle lg:flex lg:w-1/2 lg:px-3 lg:py-6 xl:px-4 xl:py-8">
        <div className="relative flex-1 overflow-hidden rounded-lg">
          <Image
            src={loginImage}
            alt={t("imageAlt")}
            fill
            priority
            sizes="50vw"
            className="object-contain"
          />
          <div className="absolute z-10 text-white lg:inset-x-10 lg:top-10 xl:inset-x-16 xl:top-12 2xl:inset-x-44 2xl:top-14">
            <h2 className="max-w-md font-bold leading-tight lg:text-3xl xl:text-4xl 2xl:text-5xl">
              {t("asideTitle")}
            </h2>
            <p className="mt-3 max-w-md leading-relaxed text-white/80 lg:text-sm xl:mt-4 xl:text-base 2xl:text-lg">
              {t("demoAsideBody")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
