"use client";

import {
  Activity,
  BellRing,
  Check,
  FileBarChart,
  HeartHandshake,
  Languages,
  MessageCircle,
  Newspaper,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ComponentType } from "react";
import { useState } from "react";
import { Button, GlareHover } from "@/components/ui";
import { cn } from "@/lib/utils";
import { TituloSeccionLanding } from "./titulo-seccion-landing";

const EASE = [0.23, 1, 0.32, 1] as const;

type Icono = ComponentType<{ className?: string }>;

type PlanDef = {
  id: string;
  nameKey:
    | "planBasicName"
    | "planGrowthName"
    | "planBusinessName"
    | "planGoldName";
  cadenceKey:
    | "planBasicCadence"
    | "planGrowthCadence"
    | "planBusinessCadence"
    | "planGoldCadence";
  featuresKey:
    | "planBasicFeatures"
    | "planGrowthFeatures"
    | "planBusinessFeatures"
    | "planGoldFeatures";
  destacado: boolean;
  premium: boolean;
};

type AddonGold = "eligible" | "excluded";

type AddonId = "reputation" | "whatsapp" | "media" | "research" | "peci";

type AddonDef = {
  id: AddonId;
  icono: Icono;
  shortKey:
    | "addonReputationShort"
    | "addonWhatsappShort"
    | "addonMediaShort"
    | "addonResearchShort"
    | "addonPeciShort";
  channelKey:
    | "addonReputationChannel"
    | "addonWhatsappChannel"
    | "addonMediaChannel"
    | "addonResearchChannel"
    | "addonPeciChannel";
  titleKey:
    | "addonReputationTitle"
    | "addonWhatsappTitle"
    | "addonMediaTitle"
    | "addonResearchTitle"
    | "addonPeciTitle";
  featuresKey:
    | "addonReputationFeatures"
    | "addonWhatsappFeatures"
    | "addonMediaFeatures"
    | "addonResearchFeatures"
    | "addonPeciFeatures";
  quote: boolean;
  gold: AddonGold;
};

const PLANES: PlanDef[] = [
  {
    id: "basic",
    nameKey: "planBasicName",
    cadenceKey: "planBasicCadence",
    featuresKey: "planBasicFeatures",
    destacado: false,
    premium: false,
  },
  {
    id: "growth",
    nameKey: "planGrowthName",
    cadenceKey: "planGrowthCadence",
    featuresKey: "planGrowthFeatures",
    destacado: false,
    premium: false,
  },
  {
    id: "business",
    nameKey: "planBusinessName",
    cadenceKey: "planBusinessCadence",
    featuresKey: "planBusinessFeatures",
    destacado: true,
    premium: false,
  },
  {
    id: "gold",
    nameKey: "planGoldName",
    cadenceKey: "planGoldCadence",
    featuresKey: "planGoldFeatures",
    destacado: false,
    premium: true,
  },
];

const BENEFICIOS: {
  icono: Icono;
  titulo:
    | "benefitRealtimeTitle"
    | "benefitSentimentTitle"
    | "benefitReportsTitle"
    | "benefitAlertsTitle";
  cuerpo:
    | "benefitRealtimeBody"
    | "benefitSentimentBody"
    | "benefitReportsBody"
    | "benefitAlertsBody";
  disclaimer?: "benefitReportsDisclaimer";
}[] = [
  {
    icono: Activity,
    titulo: "benefitRealtimeTitle",
    cuerpo: "benefitRealtimeBody",
  },
  {
    icono: Languages,
    titulo: "benefitSentimentTitle",
    cuerpo: "benefitSentimentBody",
  },
  {
    icono: FileBarChart,
    titulo: "benefitReportsTitle",
    cuerpo: "benefitReportsBody",
    disclaimer: "benefitReportsDisclaimer",
  },
  {
    icono: BellRing,
    titulo: "benefitAlertsTitle",
    cuerpo: "benefitAlertsBody",
  },
];

const ADDONS: AddonDef[] = [
  {
    id: "reputation",
    icono: HeartHandshake,
    shortKey: "addonReputationShort",
    channelKey: "addonReputationChannel",
    titleKey: "addonReputationTitle",
    featuresKey: "addonReputationFeatures",
    quote: false,
    gold: "eligible",
  },
  {
    id: "whatsapp",
    icono: MessageCircle,
    shortKey: "addonWhatsappShort",
    channelKey: "addonWhatsappChannel",
    titleKey: "addonWhatsappTitle",
    featuresKey: "addonWhatsappFeatures",
    quote: false,
    gold: "eligible",
  },
  {
    id: "media",
    icono: Newspaper,
    shortKey: "addonMediaShort",
    channelKey: "addonMediaChannel",
    titleKey: "addonMediaTitle",
    featuresKey: "addonMediaFeatures",
    quote: false,
    gold: "eligible",
  },
  {
    id: "research",
    icono: Search,
    shortKey: "addonResearchShort",
    channelKey: "addonResearchChannel",
    titleKey: "addonResearchTitle",
    featuresKey: "addonResearchFeatures",
    quote: true,
    gold: "eligible",
  },
  {
    id: "peci",
    icono: Sparkles,
    shortKey: "addonPeciShort",
    channelKey: "addonPeciChannel",
    titleKey: "addonPeciTitle",
    featuresKey: "addonPeciFeatures",
    quote: true,
    gold: "excluded",
  },
];

function textos(valor: unknown): string[] {
  if (!Array.isArray(valor)) {
    return [];
  }
  return valor.filter((item): item is string => typeof item === "string");
}

function CeldaGold({ gold }: { gold: AddonGold }) {
  const t = useTranslations("landing");
  const incluido = gold === "eligible";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-semibold",
        incluido ? "text-blue" : "text-error",
      )}
    >
      {incluido ? (
        <Check className="size-4 shrink-0" aria-hidden />
      ) : (
        <X className="size-4 shrink-0" aria-hidden />
      )}
      {incluido ? t("addonsGoldYes") : t("addonsGoldNo")}
    </span>
  );
}

function ListaIncluye({ features }: { features: string[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {features.map((feature) => (
        <li
          key={feature}
          className="flex items-start gap-2 text-sm leading-snug text-text-secondary"
        >
          <Check
            className="mt-0.5 size-3.5 shrink-0 text-primary"
            aria-hidden
          />
          {feature}
        </li>
      ))}
    </ul>
  );
}

function TablaAddons() {
  const t = useTranslations("landing");
  const reducirMovimiento = useReducedMotion();
  const [activo, setActivo] = useState<AddonId>("reputation");
  const addon = ADDONS.find((item) => item.id === activo) ?? ADDONS[0];
  const featuresActivo = textos(t.raw(addon.featuresKey));

  return (
    <div className="mt-10">
      <div
        role="tablist"
        aria-label={t("addonsPick")}
        className="flex flex-wrap gap-1 rounded-2xl border border-border-default bg-bg-subtle p-1 lg:hidden"
      >
        {ADDONS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={activo === item.id}
            onClick={() => setActivo(item.id)}
            className={cn(
              "min-h-11 flex-1 cursor-pointer rounded-xl px-3 py-2 text-sm font-semibold transition-colors duration-200",
              activo === item.id
                ? "bg-primary text-primary-fg"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            {t(item.shortKey)}
          </button>
        ))}
      </div>

      <motion.div
        key={addon.id}
        initial={reducirMovimiento ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducirMovimiento ? 0 : 0.28, ease: EASE }}
        className="mt-4 overflow-hidden rounded-2xl border border-border-default bg-bg-subtle lg:hidden"
      >
        <div className="flex items-start gap-3 border-b border-border-default px-5 py-4">
          <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <addon.icono className="size-5" aria-hidden />
          </div>
          <div>
            <p className="text-xs font-bold tracking-[0.12em] text-primary uppercase">
              {t(addon.shortKey)}
            </p>
            <h4 className="mt-1 text-base font-bold text-text-primary">
              {t(addon.titleKey)}
            </h4>
          </div>
        </div>
        <dl>
          <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 border-b border-border-default/70 px-5 py-3.5">
            <dt className="text-xs font-bold tracking-[0.08em] text-text-muted uppercase">
              {t("addonsColChannel")}
            </dt>
            <dd className="text-sm font-medium text-text-primary">
              {t(addon.channelKey)}
            </dd>
          </div>
          <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 border-b border-border-default/70 px-5 py-3.5">
            <dt className="text-xs font-bold tracking-[0.08em] text-text-muted uppercase">
              {t("addonsColGold")}
            </dt>
            <dd>
              <CeldaGold gold={addon.gold} />
            </dd>
          </div>
          <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 border-b border-border-default/70 px-5 py-3.5">
            <dt className="text-xs font-bold tracking-[0.08em] text-text-muted uppercase">
              {t("addonsColMode")}
            </dt>
            <dd className="text-sm font-medium text-text-primary">
              {addon.quote ? t("plansQuote") : t("addonsPackage")}
            </dd>
          </div>
          <div className="px-5 py-4">
            <dt className="text-xs font-bold tracking-[0.08em] text-text-muted uppercase">
              {t("addonsColIncludes")}
            </dt>
            <dd className="mt-3">
              <ListaIncluye features={featuresActivo} />
            </dd>
          </div>
        </dl>
      </motion.div>

      <div className="hidden overflow-hidden rounded-2xl border border-border-default lg:block">
        <table className="w-full table-fixed caption-bottom text-left">
          <caption className="sr-only">{t("addonsAria")}</caption>
          <thead>
            <tr className="border-b border-border-default bg-bg-subtle">
              <th className="w-[7.5rem] px-4 py-3 text-xs font-bold tracking-[0.08em] text-text-muted uppercase">
                <span className="sr-only">{t("addonsColCriterion")}</span>
              </th>
              {ADDONS.map((item) => (
                <th
                  key={item.id}
                  scope="col"
                  title={t(item.titleKey)}
                  className="px-3 py-4 align-bottom"
                >
                  <div className="flex flex-col items-start gap-2">
                    <span className="inline-flex size-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
                      <item.icono className="size-4" aria-hidden />
                    </span>
                    <span className="font-display text-base font-black tracking-tight text-text-primary">
                      {t(item.shortKey)}
                    </span>
                    <span className="sr-only">{t(item.titleKey)}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border-default/70">
              <th
                scope="row"
                className="bg-bg-subtle px-4 py-4 text-xs font-bold tracking-[0.08em] text-text-muted uppercase"
              >
                {t("addonsColChannel")}
              </th>
              {ADDONS.map((item) => (
                <td
                  key={item.id}
                  className="px-3 py-4 text-sm font-medium text-text-primary"
                >
                  {t(item.channelKey)}
                </td>
              ))}
            </tr>
            <tr className="border-b border-border-default/70">
              <th
                scope="row"
                className="bg-bg-subtle px-4 py-4 align-top text-xs font-bold tracking-[0.08em] text-text-muted uppercase"
              >
                {t("addonsColIncludes")}
              </th>
              {ADDONS.map((item) => (
                <td key={item.id} className="px-3 py-4 align-top">
                  <ListaIncluye features={textos(t.raw(item.featuresKey))} />
                </td>
              ))}
            </tr>
            <tr className="border-b border-border-default/70">
              <th
                scope="row"
                className="bg-bg-subtle px-4 py-4 text-xs font-bold tracking-[0.08em] text-text-muted uppercase"
              >
                {t("addonsColGold")}
              </th>
              {ADDONS.map((item) => (
                <td key={item.id} className="px-3 py-4">
                  <CeldaGold gold={item.gold} />
                </td>
              ))}
            </tr>
            <tr>
              <th
                scope="row"
                className="bg-bg-subtle px-4 py-4 text-xs font-bold tracking-[0.08em] text-text-muted uppercase"
              >
                {t("addonsColMode")}
              </th>
              {ADDONS.map((item) => (
                <td
                  key={item.id}
                  className="px-3 py-4 text-sm font-medium text-text-primary"
                >
                  {item.quote ? t("plansQuote") : t("addonsPackage")}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PlanesLanding() {
  const t = useTranslations("landing");
  const reducirMovimiento = useReducedMotion();

  return (
    <section id="planes" className="scroll-mt-20 bg-bg-base py-24 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <span className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
            {t("plansEyebrow")}
          </span>
          <TituloSeccionLanding
            text={t("plansTitle")}
            className="mt-3 font-display text-3xl font-black tracking-tight text-text-primary sm:text-4xl"
          />
          <p className="mt-4 text-[0.95rem] leading-relaxed text-text-secondary">
            {t("plansBody")}
          </p>
          <Link
            href="/demo"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 transition-colors hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base focus-visible:outline-none"
          >
            {t("plansCtaDemo")}
            <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFICIOS.map((beneficio, i) => (
            <motion.article
              key={beneficio.titulo}
              initial={reducirMovimiento ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: reducirMovimiento ? 0 : 0.45,
                ease: EASE,
                delay: reducirMovimiento ? 0 : i * 0.06,
              }}
              className="rounded-2xl border border-border-default bg-bg-subtle p-5"
            >
              <div className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-blue/10 text-blue">
                <beneficio.icono className="size-5" aria-hidden />
              </div>
              <h3 className="text-sm font-bold text-text-primary">
                {t(beneficio.titulo)}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                {t(beneficio.cuerpo)}
              </p>
              {beneficio.disclaimer ? (
                <p className="mt-2 text-xs text-text-muted italic">
                  {t(beneficio.disclaimer)}
                </p>
              ) : null}
            </motion.article>
          ))}
        </div>

        <div className="mt-14 grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {PLANES.map((plan, i) => {
            const features = textos(t.raw(plan.featuresKey));

            return (
              <motion.article
                key={plan.id}
                initial={
                  reducirMovimiento ? false : { opacity: 0, y: 18, scale: 0.97 }
                }
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: reducirMovimiento ? 0 : 0.5,
                  ease: EASE,
                  delay: reducirMovimiento ? 0 : 0.08 + i * 0.07,
                }}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-6",
                  plan.destacado &&
                    "group border-primary bg-bg-base shadow-lg ring-1 ring-primary",
                  plan.premium &&
                    "bg-grain overflow-hidden border-amber-400/50 bg-[linear-gradient(165deg,#1f3c7a_0%,#0f1d3d_100%)] text-white shadow-[0_0_32px_-10px_rgba(212,175,55,0.55)] ring-1 ring-amber-300/40 after:pointer-events-none after:absolute after:inset-x-5 after:top-0 after:h-px after:bg-linear-to-r after:from-transparent after:via-amber-200/80 after:to-transparent",
                  !plan.destacado &&
                    !plan.premium &&
                    "border-border-default bg-bg-subtle",
                )}
              >
                {plan.destacado ? (
                  <GlareHover
                    className="pointer-events-none absolute inset-0 rounded-2xl"
                    duration={600}
                    aria-hidden
                  />
                ) : null}

                {plan.destacado ? (
                  <p className="mb-4 inline-flex w-fit items-center rounded-full bg-primary px-2.5 py-1 text-[0.65rem] font-bold tracking-[0.12em] text-primary-fg uppercase">
                    {t("plansPopular")}
                  </p>
                ) : null}

                <h3
                  className={cn(
                    "font-display text-2xl font-black tracking-tight",
                    plan.premium ? "text-amber-50" : "text-text-primary",
                  )}
                >
                  {t(plan.nameKey)}
                </h3>
                <p
                  className={cn(
                    "mt-1 text-sm font-medium",
                    plan.premium ? "text-amber-100/70" : "text-text-secondary",
                  )}
                >
                  {t(plan.cadenceKey)}
                </p>

                <ul className="mt-6 flex flex-1 flex-col gap-3">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check
                        className={cn(
                          "mt-0.5 size-4 shrink-0",
                          plan.premium ? "text-amber-300" : "text-primary",
                        )}
                        aria-hidden
                      />
                      <span
                        className={cn(
                          "text-sm leading-snug",
                          plan.premium ? "text-white/90" : "text-text-primary",
                        )}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  size="lg"
                  variant={plan.destacado ? "default" : "outline"}
                  className={cn(
                    "relative z-20 mt-8 w-full",
                    plan.premium &&
                      "border-transparent bg-white text-navy hover:bg-white/90",
                  )}
                >
                  <Link href={`/demo?plan=${plan.id}`}>{t("plansCta")}</Link>
                </Button>
              </motion.article>
            );
          })}
        </div>

        <div id="addons" className="mt-20 scroll-mt-20">
          <span className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
            {t("addonsEyebrow")}
          </span>
          <h3 className="mt-3 max-w-2xl font-display text-2xl font-black tracking-tight text-text-primary sm:text-3xl">
            {t("addonsTitle")}
          </h3>
          <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-text-secondary">
            {t("addonsBody")}
          </p>

          <TablaAddons />
        </div>
      </div>
    </section>
  );
}
