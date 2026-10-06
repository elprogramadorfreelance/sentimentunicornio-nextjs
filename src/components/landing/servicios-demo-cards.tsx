"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { type ReactNode, useRef } from "react";
import { GraficaBarraSentimiento } from "@/components/charts/grafica-barra-sentimiento";
import {
  formatearAlcanceCompacto,
  obtenerRegionesPresenciaMock,
  obtenerTendenciaMencionesAlcanceMock,
} from "@/lib/mock/dashboard-general";
import { PALETA_ACTIVA } from "@/lib/paletas-graficas";
import { cn } from "@/lib/utils";

const EASE = [0.23, 1, 0.32, 1] as const;
const DURACION_AVISO = 0.42;
const DURACION_REVEAL = 0.5;
const CLIP_OCULTO = "inset(0 100% 0 0)";
const CLIP_VISIBLE = "inset(0 0% 0 0)";
const VISTA = { once: true, margin: "-40px" } as const;

const CLASE_CARD =
  "rounded-lg border border-border-default/30 bg-bg-base p-2.5 shadow-widget";

const SENTIMIENTO_DEMO = {
  positivo: 51,
  neutro: 36,
  negativo: 13,
} as const;

type SlotServicioProps = {
  demo?: ReactNode;
  titulo: string;
  descripcion: string;
  className?: string;
};

export function SlotServicio({
  demo,
  titulo,
  descripcion,
  className,
}: SlotServicioProps) {
  return (
    <article className={cn("mx-auto w-full min-w-0 max-w-[15rem]", className)}>
      {demo ? <div aria-hidden>{demo}</div> : null}
      <h3
        className={cn("text-sm font-bold text-text-primary", demo && "mt-2.5")}
      >
        {titulo}
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-text-secondary">
        {descripcion}
      </p>
    </article>
  );
}

export function DemoAlertas() {
  const t = useTranslations("landing");
  const ref = useRef<HTMLDivElement>(null);
  const reducir = useReducedMotion();
  const enVista = useInView(ref, VISTA);
  const filas = [
    {
      id: "critica",
      clase: "border-l-error",
      mensaje: t("serviceAlertDummyCritical"),
    },
    {
      id: "advertencia",
      clase: "border-l-warning",
      mensaje: t("serviceAlertDummyWarning"),
    },
    {
      id: "info",
      clase: "border-l-sky",
      mensaje: t("serviceAlertDummyInfo"),
    },
  ] as const;

  return (
    <div ref={ref} className={CLASE_CARD}>
      <ul className="space-y-1.5">
        {filas.map((fila, i) => (
          <motion.li
            key={fila.id}
            className={cn(
              "rounded-md border-l-4 bg-bg-subtle px-2 py-1",
              fila.clase,
            )}
            initial={
              reducir
                ? { opacity: 0 }
                : { opacity: 0, transform: "translateX(-0.5rem)" }
            }
            animate={
              enVista
                ? reducir
                  ? { opacity: 1 }
                  : { opacity: 1, transform: "translateX(0rem)" }
                : undefined
            }
            transition={{
              duration: reducir ? 0.2 : DURACION_AVISO,
              ease: EASE,
              delay: reducir ? 0 : i * 0.06,
            }}
          >
            <p className="text-[11px] leading-snug text-text-primary">
              {fila.mensaje}
            </p>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

export function DemoRegiones() {
  const t = useTranslations("common");
  const ref = useRef<HTMLDivElement>(null);
  const reducir = useReducedMotion();
  const enVista = useInView(ref, VISTA);
  const regiones = obtenerRegionesPresenciaMock().slice(0, 3);
  const max = Math.max(...regiones.map((region) => region.menciones), 1);

  return (
    <div ref={ref} className={CLASE_CARD}>
      <ul className="flex flex-col gap-2">
        {regiones.map((region, i) => (
          <li key={region.region}>
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="min-w-0 truncate text-text-secondary">
                {region.region}
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-text-primary">
                {formatearAlcanceCompacto(region.menciones)}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg-muted">
              <motion.div
                className="h-full rounded-full bg-sky"
                style={{ width: `${(region.menciones / max) * 100}%` }}
                initial={reducir ? { opacity: 0 } : { clipPath: CLIP_OCULTO }}
                animate={
                  enVista
                    ? reducir
                      ? { opacity: 1 }
                      : { clipPath: CLIP_VISIBLE }
                    : undefined
                }
                transition={{
                  duration: reducir ? 0.2 : DURACION_REVEAL,
                  ease: EASE,
                  delay: reducir ? 0 : i * 0.05,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
      <span className="mt-2 block text-right text-[11px] font-medium text-primary">
        {t("seeMore")}
      </span>
    </div>
  );
}

export function DemoSentimiento() {
  const t = useTranslations("landing");
  const tCommon = useTranslations("common");
  const ref = useRef<HTMLDivElement>(null);
  const reducir = useReducedMotion();
  const enVista = useInView(ref, VISTA);
  const { positivo, neutro, negativo } = SENTIMIENTO_DEMO;

  const segmentos = [
    {
      id: "positivo",
      etiqueta: tCommon("positive"),
      porcentaje: positivo,
      color: "bg-success",
    },
    {
      id: "neutro",
      etiqueta: tCommon("neutralShort"),
      porcentaje: neutro,
      color: "bg-border-strong",
    },
    {
      id: "negativo",
      etiqueta: tCommon("negative"),
      porcentaje: negativo,
      color: "bg-error",
    },
  ];

  return (
    <div ref={ref} className={CLASE_CARD}>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="min-w-0 text-[10px] font-semibold tracking-wide text-text-muted uppercase">
          {t("serviceSentimientoAgregado")}
        </p>
        <p className="shrink-0 text-[11px] font-semibold text-success">
          {t("serviceSentimientoPositivoPct", { pct: positivo })}
        </p>
      </div>
      <motion.div
        className="min-w-0"
        initial={reducir ? { opacity: 0 } : { clipPath: CLIP_OCULTO }}
        animate={
          enVista
            ? reducir
              ? { opacity: 1 }
              : { clipPath: CLIP_VISIBLE }
            : undefined
        }
        transition={{
          duration: reducir ? 0.2 : DURACION_REVEAL,
          ease: EASE,
        }}
      >
        <GraficaBarraSentimiento segmentos={segmentos} />
      </motion.div>
      <p className="mt-2 text-[10px] text-text-muted">
        {t("serviceSentimientoPie", {
          pos: positivo,
          neu: neutro,
          neg: negativo,
        })}
      </p>
    </div>
  );
}

const ANCHO_SVG = 200;
const ALTO_SVG = 96;
const SVG_PAD = { top: 8, right: 6, bottom: 8, left: 6 };

export function DemoTendencias() {
  const t = useTranslations("landing");
  const ref = useRef<HTMLDivElement>(null);
  const reducir = useReducedMotion();
  const enVista = useInView(ref, VISTA);
  const puntos = obtenerTendenciaMencionesAlcanceMock().slice(-8);
  const maxMenciones = Math.max(...puntos.map((punto) => punto.menciones), 1);
  const maxAlcance = Math.max(...puntos.map((punto) => punto.alcance), 1);
  const innerW = ANCHO_SVG - SVG_PAD.left - SVG_PAD.right;
  const innerH = ALTO_SVG - SVG_PAD.top - SVG_PAD.bottom;
  const gap = 4;
  const anchoBarra = (innerW - gap * (puntos.length - 1)) / puntos.length;

  const coords = puntos.map((punto, i) => {
    const x = SVG_PAD.left + i * (anchoBarra + gap);
    const altoBarra = (punto.menciones / maxMenciones) * innerH * 0.85;
    return {
      x,
      y: SVG_PAD.top + innerH - altoBarra,
      altoBarra,
      cx: x + anchoBarra / 2,
      cy: SVG_PAD.top + innerH - (punto.alcance / maxAlcance) * innerH,
    };
  });

  return (
    <div ref={ref} className={CLASE_CARD}>
      <p className="mb-1.5 text-[10px] font-semibold text-text-secondary">
        {t("serviceTendenciasChartTitle")}
      </p>
      <svg
        viewBox={`0 0 ${ANCHO_SVG} ${ALTO_SVG}`}
        className="pointer-events-none h-24 w-full"
        aria-hidden
      >
        <title>{t("serviceTendenciasChartTitle")}</title>
        {coords.map((punto, i) => (
          <motion.rect
            key={`bar-${puntos[i]?.fecha ?? i}`}
            x={punto.x}
            y={punto.y}
            width={anchoBarra}
            height={punto.altoBarra}
            rx={2}
            fill={PALETA_ACTIVA.categorica[1].plano}
            style={{
              transformBox: "fill-box",
              transformOrigin: "center bottom",
            }}
            initial={
              reducir
                ? { opacity: 0 }
                : { opacity: 0, transform: "scaleY(0.92)" }
            }
            animate={
              enVista
                ? reducir
                  ? { opacity: 0.75 }
                  : { opacity: 0.75, transform: "scaleY(1)" }
                : undefined
            }
            transition={{
              duration: reducir ? 0.2 : DURACION_REVEAL,
              ease: EASE,
              delay: reducir ? 0 : i * 0.04,
            }}
          />
        ))}
        <motion.polyline
          points={coords.map((punto) => `${punto.cx},${punto.cy}`).join(" ")}
          fill="none"
          stroke={PALETA_ACTIVA.categorica[0].plano}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reducir ? { opacity: 0 } : { pathLength: 0, opacity: 1 }}
          animate={
            enVista
              ? reducir
                ? { opacity: 1 }
                : { pathLength: 1, opacity: 1 }
              : undefined
          }
          transition={{
            duration: reducir ? 0.2 : DURACION_REVEAL,
            ease: EASE,
            delay: reducir ? 0 : 0.15,
          }}
        />
        {coords.map((punto, i) => (
          <motion.circle
            key={`dot-${puntos[i]?.fecha ?? i}`}
            cx={punto.cx}
            cy={punto.cy}
            r={2}
            fill={PALETA_ACTIVA.categorica[0].plano}
            initial={{ opacity: 0 }}
            animate={enVista ? { opacity: 1 } : undefined}
            transition={{
              duration: 0.2,
              ease: EASE,
              delay: reducir ? 0 : 0.45 + i * 0.03,
            }}
          />
        ))}
      </svg>
    </div>
  );
}
