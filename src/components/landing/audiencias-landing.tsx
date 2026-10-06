"use client";

import {
  AlertTriangle,
  Briefcase,
  Building2,
  FileDown,
  Folders,
  Heart,
  Landmark,
  TrendingUp,
  Users,
  Vote,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { ComponentType } from "react";
import { useState } from "react";
import sentimentImg from "@/assets/sentiment.jpeg";
import { cn } from "@/lib/utils";
import { TituloSeccionLanding } from "./titulo-seccion-landing";

const EASE = [0.23, 1, 0.32, 1] as const;
const DURACION_FADE = 0.18;

type AudienciaId = "marcas" | "gobierno" | "agencias";

type Beneficio = {
  icono: ComponentType<{ className?: string }>;
  texto: string;
};

type Audiencia = {
  id: AudienciaId;
  etiqueta: string;
  icono: ComponentType<{ className?: string }>;
  titulo: string;
  descripcion: string;
  beneficios: Beneficio[];
};

function ContenidoAudiencia({ audiencia }: { audiencia: Audiencia }) {
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
      <div>
        <div className="inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <audiencia.icono className="size-6" />
        </div>
        <h3 className="mt-5 text-2xl leading-snug font-bold text-text-primary">
          {audiencia.titulo}
        </h3>
        <p className="mt-4 leading-relaxed text-text-secondary">
          {audiencia.descripcion}
        </p>
      </div>

      <ul className="flex flex-col justify-center gap-5">
        {audiencia.beneficios.map((beneficio) => (
          <li key={beneficio.texto} className="flex items-start gap-4">
            <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-bg-muted text-primary">
              <beneficio.icono className="size-4" />
            </span>
            <span className="pt-1.5 text-[0.95rem] leading-relaxed text-text-primary">
              {beneficio.texto}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AudienciasLanding() {
  const t = useTranslations("landing");
  const reducirMovimiento = useReducedMotion();
  const [activa, setActiva] = useState<AudienciaId>("marcas");

  const audiencias: Audiencia[] = [
    {
      id: "marcas",
      etiqueta: t("brandsTab"),
      icono: Building2,
      titulo: t("brandsTitle"),
      descripcion: t("brandsBody"),
      beneficios: [
        { icono: Heart, texto: t("brandsB1") },
        { icono: TrendingUp, texto: t("brandsB2") },
        { icono: AlertTriangle, texto: t("brandsB3") },
      ],
    },
    {
      id: "gobierno",
      etiqueta: t("govTab"),
      icono: Landmark,
      titulo: t("govTitle"),
      descripcion: t("govBody"),
      beneficios: [
        { icono: Vote, texto: t("govB1") },
        { icono: TrendingUp, texto: t("govB2") },
        { icono: AlertTriangle, texto: t("govB3") },
      ],
    },
    {
      id: "agencias",
      etiqueta: t("agencyTab"),
      icono: Briefcase,
      titulo: t("agencyTitle"),
      descripcion: t("agencyBody"),
      beneficios: [
        { icono: Folders, texto: t("agencyB1") },
        { icono: Users, texto: t("agencyB2") },
        { icono: FileDown, texto: t("agencyB3") },
      ],
    },
  ];

  const audiencia = audiencias.find((a) => a.id === activa) ?? audiencias[0];

  return (
    <section id="audiencias" className="bg-bg-subtle py-24 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-xl">
            <span className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
              {t("audiencesEyebrow")}
            </span>
            <TituloSeccionLanding
              text={t("audiencesTitle")}
              className="mt-3 font-display text-3xl font-black tracking-tight text-text-primary sm:text-4xl"
            />
            <p className="mt-3 text-base leading-relaxed text-text-secondary">
              {t("audiencesLead")}
            </p>
          </div>

          <div
            role="tablist"
            aria-label={t("audiencesAria")}
            className="flex w-full flex-col gap-1 rounded-2xl border border-border-default bg-bg-base p-1 sm:inline-flex sm:w-auto sm:max-w-full sm:shrink-0 sm:flex-row sm:flex-wrap sm:rounded-full"
          >
            {audiencias.map((a) => {
              const seleccionada = activa === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  role="tab"
                  aria-selected={seleccionada}
                  onClick={() => setActiva(a.id)}
                  className={cn(
                    "relative cursor-pointer rounded-xl px-4 py-2.5 text-left text-sm sm:rounded-full sm:py-2 sm:text-center font-semibold transition-[color,transform] duration-[160ms] ease-out active:scale-[0.97]",
                    seleccionada
                      ? "text-primary-fg"
                      : "text-text-secondary hover:text-text-primary",
                  )}
                >
                  {seleccionada &&
                    (reducirMovimiento ? (
                      <span className="absolute inset-0 rounded-xl bg-primary sm:rounded-full" />
                    ) : (
                      <motion.span
                        layoutId="audiencia-tab-pill"
                        className="absolute inset-0 rounded-xl bg-primary sm:rounded-full"
                        transition={{
                          type: "tween",
                          duration: DURACION_FADE,
                          ease: EASE,
                        }}
                      />
                    ))}
                  <span className="relative z-10">{a.etiqueta}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative mt-12 overflow-hidden rounded-2xl border border-border-default bg-bg-base p-8 sm:p-10">
          <div className="invisible grid" aria-hidden>
            {audiencias.map((panel) => (
              <div key={panel.id} className="col-start-1 row-start-1">
                <ContenidoAudiencia audiencia={panel} />
              </div>
            ))}
          </div>

          <div className="absolute inset-0 p-8 sm:p-10">
            {reducirMovimiento ? (
              <ContenidoAudiencia audiencia={audiencia} />
            ) : (
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={audiencia.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: DURACION_FADE, ease: EASE }}
                >
                  <ContenidoAudiencia audiencia={audiencia} />
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl bg-bg-muted ring-1 ring-border-default">
          <Image
            src={sentimentImg}
            alt={t("featureImgSentimentAlt")}
            sizes="(min-width: 1024px) 72rem, 92vw"
            className="h-auto w-full"
          />
        </div>
      </div>
    </section>
  );
}
