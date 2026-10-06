"use client";

import { useReducedMotion } from "motion/react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useRef, useSyncExternalStore } from "react";
import { TimelineAnimation } from "@/components/ui";
import { HeroTituloSeleccion } from "./hero-titulo-seleccion";
import { HeroVideoLanding } from "./hero-video-landing";

// Ruta directa (no barrel) para que el shader WebGL quede en su propio chunk.
const MagicRings = dynamic(
  () => import("@/components/ui/magic-rings").then((m) => m.MagicRings),
  { ssr: false },
);

const COLOR_CLARO = "#4338CA";
const COLOR_CLARO_DOS = "#1F3C7A";
const COLOR_OSCURO = "#A855F7";
const COLOR_OSCURO_DOS = "#6366F1";

function suscribirTema(onStoreChange: () => void) {
  const observador = new MutationObserver(onStoreChange);
  observador.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observador.disconnect();
}

function temaOscuro() {
  return document.documentElement.classList.contains("dark");
}

function temaServidor() {
  return false;
}

function FondoHero() {
  const reducirMovimiento = useReducedMotion();
  const oscuro = useSyncExternalStore(suscribirTema, temaOscuro, temaServidor);
  const color = oscuro ? COLOR_OSCURO : COLOR_CLARO;
  const colorTwo = oscuro ? COLOR_OSCURO_DOS : COLOR_CLARO_DOS;

  if (reducirMovimiento) {
    return (
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: `radial-gradient(ellipse at center, ${color}55 0%, ${colorTwo}22 45%, transparent 72%)`,
        }}
      />
    );
  }

  return (
    <div aria-hidden className="pointer-events-auto absolute inset-0 z-0">
      <MagicRings
        color={color}
        colorTwo={colorTwo}
        ringCount={6}
        speed={0.6}
        attenuation={10}
        lineThickness={2}
        baseRadius={0.35}
        radiusStep={0.12}
        scaleRate={0.1}
        opacity={1}
        blur={6}
        noiseAmount={0.04}
        rotation={0}
        ringGap={1.4}
        fadeIn={0.85}
        fadeOut={0.5}
        followMouse
        mouseInfluence={0.05}
        hoverScale={1.2}
        parallax={0.05}
        clickBurst
      />
    </div>
  );
}

const CLASE_BOTON_HERO =
  "inline-block cursor-pointer rounded-[9px] px-4 py-3 text-center text-base font-semibold whitespace-nowrap transition duration-400 hover:shadow-[7px_5px_56px_-14px_#625fff] active:scale-[0.97] active:shadow-[7px_5px_56px_-10px_#625fff] dark:hover:shadow-[7px_5px_56px_-14px_#1bb8e1] dark:active:shadow-[7px_5px_56px_-10px_#1bb8e1] sm:px-8.25 sm:py-4 sm:text-lg";

export function HeroLanding() {
  const t = useTranslations("landing");
  const timelineRef = useRef<HTMLElement | null>(null);

  return (
    <section
      ref={timelineRef}
      className="relative flex min-h-screen flex-col items-center overflow-hidden bg-bg-base text-text-primary"
    >
      <FondoHero />

      <div className="pointer-events-none relative z-10 px-4 pt-16 pb-12 text-center">
        <TimelineAnimation
          as="h1"
          animationNum={3}
          timelineRef={timelineRef}
          className="mb-8 font-medium text-5xl tracking-tight text-text-primary sm:text-6xl md:text-7xl"
        >
          {t("heroTitle1")} <br className="hidden sm:inline-block" />
          <HeroTituloSeleccion timelineRef={timelineRef}>
            {t("heroTitle2")}
          </HeroTituloSeleccion>
        </TimelineAnimation>
        <TimelineAnimation
          as="p"
          animationNum={5}
          timelineRef={timelineRef}
          className="mx-auto mb-8 max-w-6xl text-lg leading-relaxed font-normal text-pretty whitespace-pre-line text-text-secondary"
        >
          {t("heroBody")}
        </TimelineAnimation>
        <TimelineAnimation animationNum={6} timelineRef={timelineRef}>
          <div className="pointer-events-auto flex flex-nowrap items-center justify-center gap-2 sm:gap-4">
            <a
              href="/demo"
              className={`${CLASE_BOTON_HERO} border-0 bg-indigo-500 text-white dark:bg-sky`}
            >
              {t("ctaDemo")}
            </a>
            <a
              href="#funciones"
              className={`${CLASE_BOTON_HERO} border border-indigo-500 bg-transparent text-indigo-500 dark:border-sky dark:text-sky`}
            >
              {t("heroSecondaryCta")}
            </a>
          </div>
        </TimelineAnimation>
      </div>

      <div className="pointer-events-auto relative mx-auto mt-10 w-full max-w-7xl rounded-xl">
        <TimelineAnimation
          animationNum={7}
          timelineRef={timelineRef}
          className="rounded-2xl bg-white/50 p-4 backdrop-blur-lg dark:bg-white/10"
        >
          <TimelineAnimation
            animationNum={8}
            timelineRef={timelineRef}
            className="relative z-[4] w-full"
          >
            <HeroVideoLanding alt={t("heroImageAlt")} />
          </TimelineAnimation>
        </TimelineAnimation>
      </div>
    </section>
  );
}
