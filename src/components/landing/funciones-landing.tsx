"use client";

import {
  GitCompareArrows,
  ListFilter,
  MessageSquareWarning,
  Radar,
  ScanSearch,
  ShieldAlert,
  Waypoints,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Image, { type StaticImageData } from "next/image";
import { useTranslations } from "next-intl";
import type { ComponentType } from "react";
import mencionesImg from "@/assets/menciones.jpeg";
import narrativasImg from "@/assets/narrativas.jpeg";
import { ScrollStack, ScrollStackItem } from "@/components/ui";
import { cn } from "@/lib/utils";
import { TituloSeccionLanding } from "./titulo-seccion-landing";

const EASE = [0.23, 1, 0.32, 1] as const;
const DURACION_TARJETA = 0.55;
const DESPLAZAMIENTO_X = "4.5rem";

type Icono = ComponentType<{ className?: string }>;

type Funcion = {
  id: string;
  icono: Icono;
  titulo: string;
  descripcion: string;
  acento: string;
};

function TarjetaFuncion({
  funcion,
  delay,
  reducirMovimiento,
  origen,
}: {
  funcion: Funcion;
  delay: number;
  reducirMovimiento: boolean | null;
  origen: "izquierda" | "derecha";
}) {
  const desdeX =
    origen === "izquierda" ? `-${DESPLAZAMIENTO_X}` : DESPLAZAMIENTO_X;

  return (
    <motion.article
      initial={
        reducirMovimiento
          ? { opacity: 0 }
          : { opacity: 0, transform: `translateX(${desdeX})` }
      }
      whileInView={{ opacity: 1, transform: "translateX(0rem)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: reducirMovimiento ? 0.2 : DURACION_TARJETA,
        ease: EASE,
        delay,
      }}
      className="flex flex-1 flex-col rounded-2xl border border-border-default bg-bg-subtle p-7 transition-colors hover:border-border-strong"
    >
      <div
        className={`mb-5 inline-flex size-11 items-center justify-center rounded-xl ${funcion.acento}`}
      >
        <funcion.icono className="size-5" aria-hidden />
      </div>
      <h3 className="text-lg font-bold text-text-primary">{funcion.titulo}</h3>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-text-secondary">
        {funcion.descripcion}
      </p>
    </motion.article>
  );
}

function FotoFuncion({
  src,
  alt,
  className,
  delay,
  reducirMovimiento,
}: {
  src: StaticImageData;
  alt: string;
  className?: string;
  delay: number;
  reducirMovimiento: boolean | null;
}) {
  return (
    <motion.div
      initial={reducirMovimiento ? false : { opacity: 0, y: 22, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: reducirMovimiento ? 0 : 0.6, ease: EASE, delay }}
      className={cn(
        "flex h-[22rem] w-full items-center justify-center overflow-hidden rounded-2xl sm:h-[26rem] lg:h-[28rem]",
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        sizes="(min-width: 1024px) 28rem, 92vw"
        className="h-full w-auto max-w-full rounded-2xl object-contain"
      />
    </motion.div>
  );
}

export function FuncionesLanding() {
  const t = useTranslations("landing");
  const reducirMovimiento = useReducedMotion();

  const monitoreo: Funcion = {
    id: "360",
    icono: Radar,
    titulo: t("feature360Title"),
    descripcion: t("feature360Body"),
    acento: "bg-blue/10 text-blue",
  };
  const narrativas: Funcion = {
    id: "compare",
    icono: GitCompareArrows,
    titulo: t("featureCompareTitle"),
    descripcion: t("featureCompareBody"),
    acento: "bg-accent/10 text-accent",
  };
  const sarcasmo: Funcion = {
    id: "sarcasm",
    icono: MessageSquareWarning,
    titulo: t("featureSarcasmTitle"),
    descripcion: t("featureSarcasmBody"),
    acento: "bg-sky/15 text-navy",
  };
  const alertas: Funcion = {
    id: "alerts",
    icono: ShieldAlert,
    titulo: t("featureAlertsTitle"),
    descripcion: t("featureAlertsBody"),
    acento: "bg-error/10 text-error",
  };

  const pila: Funcion[] = [
    {
      id: "detect",
      icono: ScanSearch,
      titulo: t("stackDetectTitle"),
      descripcion: t("stackDetectBody"),
      acento: "bg-blue/10 text-blue",
    },
    {
      id: "context",
      icono: Waypoints,
      titulo: t("stackContextTitle"),
      descripcion: t("stackContextBody"),
      acento: "bg-accent/10 text-accent",
    },
    {
      id: "priority",
      icono: ListFilter,
      titulo: t("stackPriorityTitle"),
      descripcion: t("stackPriorityBody"),
      acento: "bg-sky/15 text-navy",
    },
    {
      id: "risk",
      icono: ShieldAlert,
      titulo: t("stackRiskTitle"),
      descripcion: t("stackRiskBody"),
      acento: "bg-error/10 text-error",
    },
  ];

  return (
    <section
      id="funciones"
      className="overflow-x-clip bg-bg-base py-24 sm:py-28"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          <span className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
            {t("featuresEyebrow")}
          </span>
          <TituloSeccionLanding
            text={t("featuresTitle")}
            className="mt-3 font-display text-3xl font-black tracking-tight text-text-primary sm:text-4xl"
          />
        </div>

        <ScrollStack useWindowScroll className="mt-10">
          {pila.map((paso) => (
            <ScrollStackItem key={paso.id}>
              <div
                className={`mb-5 inline-flex size-11 items-center justify-center rounded-xl ${paso.acento}`}
              >
                <paso.icono className="size-5" aria-hidden />
              </div>
              <h3 className="font-display text-2xl font-black tracking-tight text-text-primary sm:text-3xl">
                {paso.titulo}
              </h3>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg">
                {paso.descripcion}
              </p>
            </ScrollStackItem>
          ))}
        </ScrollStack>

        <div className="mt-14 grid items-stretch gap-5 lg:grid-cols-2 lg:gap-7">
          <FotoFuncion
            src={mencionesImg}
            alt={t("featureImgMencionesAlt")}
            delay={reducirMovimiento ? 0 : 0.05}
            reducirMovimiento={reducirMovimiento}
          />
          <div className="flex flex-col gap-5">
            <TarjetaFuncion
              funcion={monitoreo}
              origen="derecha"
              delay={reducirMovimiento ? 0 : 0.08}
              reducirMovimiento={reducirMovimiento}
            />
            <TarjetaFuncion
              funcion={alertas}
              origen="derecha"
              delay={reducirMovimiento ? 0 : 0.16}
              reducirMovimiento={reducirMovimiento}
            />
          </div>
        </div>

        <div className="mt-5 grid items-stretch gap-5 lg:mt-7 lg:grid-cols-2 lg:gap-7">
          <FotoFuncion
            src={narrativasImg}
            alt={t("featureImgNarrativasAlt")}
            delay={reducirMovimiento ? 0 : 0.08}
            reducirMovimiento={reducirMovimiento}
            className="lg:order-2"
          />
          <div className="flex flex-col gap-5 lg:order-1">
            <TarjetaFuncion
              funcion={narrativas}
              origen="izquierda"
              delay={reducirMovimiento ? 0 : 0.08}
              reducirMovimiento={reducirMovimiento}
            />
            <TarjetaFuncion
              funcion={sarcasmo}
              origen="izquierda"
              delay={reducirMovimiento ? 0 : 0.16}
              reducirMovimiento={reducirMovimiento}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
