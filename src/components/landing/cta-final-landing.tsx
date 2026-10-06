"use client";

import { Mail } from "lucide-react";
import { motion } from "motion/react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useRef } from "react";
import { siWhatsapp } from "simple-icons";
import { FormularioDemo } from "@/components/demo";
import { BrandIcon } from "@/components/icons/brand-icon";
import { Bandera } from "@/components/tema";
import { esLocale } from "@/i18n/config";
import { WHATSAPP_POR_LOCALE } from "@/lib/contacto-landing";
import { TituloSeccionLanding } from "./titulo-seccion-landing";

const WebThreads = dynamic(
  () => import("./web-threads").then((m) => m.WebThreads),
  { ssr: false },
);

export function CtaFinalLanding() {
  const t = useTranslations("landing");
  const locale = useLocale();
  const localeActual = esLocale(locale) ? locale : "es";
  const whatsapp = WHATSAPP_POR_LOCALE[localeActual];
  const tarjetaRef = useRef<HTMLDivElement>(null);

  return (
    <section
      id="contacto"
      className="relative isolate scroll-mt-20 overflow-hidden bg-[#0a0a14] py-20 pb-28 sm:py-24 sm:pb-32"
    >
      <div className="absolute inset-0 z-0" aria-hidden>
        <WebThreads
          color1="#5227FF"
          color2="#06B6D4"
          color3="#cecaca"
          speed={0.1}
          threadCount={6}
          frequency={5}
          spread={0.21}
          taper={1}
          position={0.5}
          fanMode="center"
          glow={0.02}
          falloff={0.6}
          thickness={1.4}
          brightness={0.6}
          opacity={1}
          mirror
          shimmer={false}
          grain
          grainIntensity={0.05}
          mouseInteraction
          mouseStrength={0.3}
        />
      </div>
      {/* Velo para que el copy blanco no se pierda contra el brillo de los hilos */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] bg-[#05050c]/70"
      />

      <div className="pointer-events-none relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-16 lg:px-8">
        <div className="pointer-events-auto flex flex-col gap-5 text-center lg:text-left">
          <TituloSeccionLanding
            text={t("ctaTitle")}
            color="rgba(255,255,255,0.82)"
            className="font-display text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]"
          />
          <p className="mx-auto max-w-md text-base leading-relaxed text-white/85 lg:mx-0">
            {t("ctaBody")}
          </p>
          <p className="text-sm leading-relaxed text-white/70">
            {t("ctaContactHint")}
          </p>

          <div className="flex flex-col items-center gap-1 text-sm text-white/85 sm:flex-row sm:justify-center sm:gap-6 lg:justify-start">
            <a
              href={whatsapp.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 transition-colors hover:text-white"
            >
              <Bandera locale={localeActual} className="h-3 w-4" />
              <BrandIcon icon={siWhatsapp} className="size-4" />
              {whatsapp.numero}
            </a>
            <a
              href="mailto:contact@globalmediainvestment.com"
              className="inline-flex min-h-11 items-center gap-2 transition-colors hover:text-white"
            >
              <Mail className="size-4" />
              {t("footerEmailCta")}
            </a>
          </div>
        </div>

        <div
          ref={tarjetaRef}
          className="pointer-events-auto relative scroll-mt-24 overflow-hidden rounded-3xl bg-bg-base p-5 shadow-[0_24px_60px_-18px_rgba(15,29,61,0.55)] ring-1 ring-white/20 sm:p-6"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-sky/70 to-transparent"
          />

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-display text-lg font-black tracking-tight text-text-primary">
                {t("ctaFormTitle")}
              </h3>
              <span className="rounded-full bg-blue/10 px-2.5 py-1 text-[0.65rem] font-bold tracking-[0.12em] text-blue uppercase">
                {t("ctaFormBadge")}
              </span>
            </div>
            <FormularioDemo />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
