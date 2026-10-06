"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { TituloSeccionLanding } from "./titulo-seccion-landing";

const PREGUNTAS = [
  { q: "faq1Q", a: "faq1A" },
  { q: "faq2Q", a: "faq2A" },
  { q: "faq3Q", a: "faq3A" },
  { q: "faq4Q", a: "faq4A" },
  { q: "faq5Q", a: "faq5A" },
  { q: "faq6Q", a: "faq6A" },
  { q: "faq7Q", a: "faq7A" },
  { q: "faq8Q", a: "faq8A" },
] as const;

export function FaqLanding() {
  const t = useTranslations("landing");
  const idBase = useId();
  const [abierta, setAbierta] = useState<string | null>(null);

  return (
    <section
      id="faq"
      aria-label={t("faqAria")}
      className="scroll-mt-20 bg-bg-subtle py-24 sm:py-28"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:gap-16 lg:px-8">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <span className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
            {t("faqEyebrow")}
          </span>
          <TituloSeccionLanding
            text={t("faqTitle")}
            className="mt-3 font-display text-3xl font-black tracking-tight text-text-primary sm:text-4xl"
          />
        </div>

        <div className="divide-y divide-border-default border-y border-border-default">
          {PREGUNTAS.map((pregunta, i) => {
            const id = `${idBase}-${i}`;
            const panelId = `${id}-panel`;
            const abiertaAhora = abierta === id;

            return (
              <div key={pregunta.q}>
                <h3>
                  <button
                    type="button"
                    id={id}
                    aria-expanded={abiertaAhora}
                    aria-controls={panelId}
                    onClick={() => setAbierta(abiertaAhora ? null : id)}
                    className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-4 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  >
                    <span className="text-base font-semibold text-text-primary">
                      {t(pregunta.q)}
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-5 shrink-0 text-text-muted transition-transform duration-200 motion-reduce:transition-none",
                        abiertaAhora && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </button>
                </h3>
                <div
                  id={panelId}
                  inert={!abiertaAhora}
                  className={cn(
                    "grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none",
                    abiertaAhora ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="pb-5 text-[0.95rem] leading-relaxed text-text-secondary">
                      {t(pregunta.a)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
