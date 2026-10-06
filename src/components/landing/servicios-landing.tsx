"use client";

import { Play } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { videoServiciosLanding } from "@/lib/video-landing";
import {
  DemoAlertas,
  DemoRegiones,
  DemoSentimiento,
  DemoTendencias,
  SlotServicio,
} from "./servicios-demo-cards";
import { TituloSeccionLanding } from "./titulo-seccion-landing";

export function ServiciosLanding() {
  const t = useTranslations("landing");
  const locale = useLocale();
  const video = videoServiciosLanding(locale);
  const reducirMovimiento = useReducedMotion();
  const marcoRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const enVista = useRef(false);
  const pausaManual = useRef(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    setListo(false);
    pausaManual.current = false;

    const marco = marcoRef.current;
    const el = videoRef.current;
    if (!marco || !el) {
      return;
    }

    el.pause();
    el.currentTime = 0;
    if (el.getAttribute("src") !== video.src) {
      el.src = video.src;
    }
    if (el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      setListo(true);
    }

    const observer = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada) {
          return;
        }
        if (entrada.isIntersecting) {
          enVista.current = true;
          if (!pausaManual.current && !reducirMovimiento) {
            void el.play().catch(() => undefined);
          }
        } else {
          enVista.current = false;
          el.pause();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(marco);
    return () => observer.disconnect();
  }, [reducirMovimiento, video.src]);

  return (
    <section
      id="servicios"
      className="scroll-mt-20 overflow-x-hidden bg-bg-base py-24 sm:py-28"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          <span className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
            {t("servicesTitle")}
          </span>
          <TituloSeccionLanding
            text={t("servicesBody")}
            className="mt-3 font-display text-3xl font-black tracking-tight text-text-primary sm:text-4xl"
          />
        </div>

        <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-[minmax(0,16rem)_auto_minmax(0,16rem)] lg:grid-rows-3 lg:items-center lg:justify-center lg:gap-x-20 lg:gap-y-8">
          <div
            ref={marcoRef}
            className="relative z-10 order-1 col-span-2 mx-auto mb-6 aspect-[9/16] w-full max-w-[17.5rem] overflow-hidden rounded-2xl bg-bg-muted ring-1 ring-border-default sm:max-w-[19rem] lg:order-none lg:col-span-1 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:mb-0 lg:self-center"
          >
            {!listo && (
              <div
                className="absolute inset-0 z-10 flex items-center justify-center"
                aria-hidden
              >
                <Skeleton className="absolute inset-0 rounded-none" />
                <span className="relative z-10 flex size-14 items-center justify-center rounded-full bg-bg-base/85 ring-1 ring-border-default sm:size-16">
                  <Play
                    className="size-6 translate-x-px text-text-muted sm:size-7"
                    fill="currentColor"
                  />
                </span>
              </div>
            )}
            <video
              ref={videoRef}
              src={video.src}
              preload="auto"
              muted
              playsInline
              loop
              controls
              aria-label={t("servicesVideoAria")}
              onCanPlay={() => setListo(true)}
              onError={() => setListo(true)}
              onPlay={() => {
                pausaManual.current = false;
              }}
              onPause={() => {
                if (enVista.current) {
                  pausaManual.current = true;
                }
              }}
              className={cn(
                "h-full w-full object-contain",
                !listo && "invisible",
              )}
            />
          </div>

          <SlotServicio
            className="order-2 lg:order-none lg:col-start-1 lg:row-start-1"
            demo={<DemoSentimiento />}
            titulo={t("sideSentimentTitle")}
            descripcion={t("sideSentimentBody")}
          />
          <SlotServicio
            className="order-4 lg:order-none lg:col-start-1 lg:row-start-2"
            titulo={t("sideActorsTitle")}
            descripcion={t("sideActorsBody")}
          />
          <SlotServicio
            className="order-6 lg:order-none lg:col-start-1 lg:row-start-3"
            demo={<DemoAlertas />}
            titulo={t("sideAlertsTitle")}
            descripcion={t("sideAlertsBody")}
          />
          <SlotServicio
            className="order-3 lg:order-none lg:col-start-3 lg:row-start-1"
            demo={<DemoRegiones />}
            titulo={t("sideSourcesTitle")}
            descripcion={t("sideSourcesBody")}
          />
          <SlotServicio
            className="order-5 lg:order-none lg:col-start-3 lg:row-start-2"
            titulo={t("sideKeywordsTitle")}
            descripcion={t("sideKeywordsBody")}
          />
          <SlotServicio
            className="order-7 lg:order-none lg:col-start-3 lg:row-start-3"
            demo={<DemoTendencias />}
            titulo={t("sideTrendsTitle")}
            descripcion={t("sideTrendsBody")}
          />
        </div>
      </div>
    </section>
  );
}
