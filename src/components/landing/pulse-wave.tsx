"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type PulseWaveProps = {
  className?: string;
};

/**
 * Línea de pulso de conversación — motivo visual de marca para la landing.
 * Referencia directa a "Pulso en vivo" del dashboard: una señal que viaja,
 * no un blob decorativo genérico.
 */
export function PulseWave({ className }: PulseWaveProps) {
  const t = useTranslations("landing");

  return (
    <svg
      viewBox="0 0 800 120"
      fill="none"
      preserveAspectRatio="none"
      className={cn("h-full w-full", className)}
      aria-hidden="true"
    >
      <title>{t("pulseAria")}</title>
      <path
        d="M0 60 H120 L145 60 L160 20 L180 100 L200 60 L230 60 L250 90 L270 30 L290 60 H360 L385 60 L400 20 L420 100 L440 60 L470 60 L490 90 L510 30 L530 60 H600 L625 60 L640 20 L660 100 L680 60 L710 60 L730 90 L750 30 L770 60 H800"
        stroke="url(#pulse-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="6 10"
        className="animate-pulse-travel"
      />
      <path
        d="M0 60 H120 L145 60 L160 20 L180 100 L200 60 L230 60 L250 90 L270 30 L290 60 H360 L385 60 L400 20 L420 100 L440 60 L470 60 L490 90 L510 30 L530 60 H600 L625 60 L640 20 L660 100 L680 60 L710 60 L730 90 L750 30 L770 60 H800"
        stroke="url(#pulse-gradient)"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.35"
      />
      <defs>
        <linearGradient
          id="pulse-gradient"
          x1="0"
          y1="0"
          x2="800"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#1bb8e1" stopOpacity="0" />
          <stop offset="20%" stopColor="#1bb8e1" />
          <stop offset="50%" stopColor="#6c1ad9" />
          <stop offset="80%" stopColor="#1bb8e1" />
          <stop offset="100%" stopColor="#1bb8e1" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
