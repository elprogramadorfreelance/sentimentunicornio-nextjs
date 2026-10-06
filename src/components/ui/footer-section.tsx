"use client";

import { Mail } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { siWhatsapp } from "simple-icons";
import globalLogo from "@/assets/global-logo.webp";
import { LogoUnicornio } from "@/components/brand";
import { BrandIcon } from "@/components/icons/brand-icon";

export type FooterLink = {
  title: ReactNode;
  href?: string;
  icon?: "whatsapp" | "mail";
  disabled?: boolean;
  legend?: string;
};

export type FooterColumn = {
  label: string;
  links: FooterLink[];
};

type FooterProps = {
  tagline: string;
  columns: FooterColumn[];
  copyright: string;
  poweredByLabel: string;
};

const ICONOS = {
  mail: Mail,
} as const;

export function Footer({
  tagline,
  columns,
  copyright,
  poweredByLabel,
}: FooterProps) {
  return (
    <footer className="relative z-20 mx-auto flex w-full max-w-6xl -mt-10 flex-col items-center justify-center rounded-t-[2rem] border-t border-border-default bg-bg-base bg-[radial-gradient(35%_128px_at_50%_0%,color-mix(in_srgb,var(--color-sky)_16%,transparent),transparent)] px-6 py-12 md:rounded-t-[3rem] lg:py-16">
      <div className="bg-foreground/20 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur-sm" />

      <div className="grid w-full gap-8 xl:grid-cols-3 xl:gap-8">
        <AnimatedContainer className="space-y-4">
          <LogoUnicornio className="h-8 w-auto" />
          <p className="mt-8 max-w-xs text-sm leading-relaxed text-muted-foreground md:mt-0">
            {tagline}
          </p>
        </AnimatedContainer>

        <div className="mt-10 grid min-w-0 grid-cols-2 gap-8 md:grid-cols-3 xl:col-span-2 xl:mt-0">
          {columns.map((section, index) => (
            <AnimatedContainer
              key={section.label}
              delay={0.1 + index * 0.1}
              className="min-w-0"
            >
              <div className="mb-10 min-w-0 md:mb-0">
                <h3 className="text-xs font-semibold tracking-[0.08em] text-foreground uppercase">
                  {section.label}
                </h3>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {section.links.map((link, index) => (
                    <li key={link.href ?? `${section.label}-${index}`}>
                      {link.disabled ? (
                        <span
                          aria-disabled="true"
                          className="inline-flex cursor-not-allowed flex-wrap items-center gap-x-2 gap-y-0.5 opacity-55"
                        >
                          <span>{link.title}</span>
                          {link.legend ? (
                            <span className="rounded-full border border-border-default px-1.5 py-0.5 text-[0.6rem] font-semibold tracking-[0.08em] uppercase">
                              {link.legend}
                            </span>
                          ) : null}
                        </span>
                      ) : link.href ? (
                        <FooterAnchor href={link.href}>
                          {link.icon ? (
                            <IconoEnlace nombre={link.icon} />
                          ) : null}
                          <span>{link.title}</span>
                        </FooterAnchor>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedContainer>
          ))}
        </div>
      </div>

      <AnimatedContainer
        delay={0.4}
        className="mt-10 flex w-full flex-col items-center justify-between gap-4 border-t border-border-default pt-6 text-xs text-muted-foreground sm:flex-row"
      >
        <p>{copyright}</p>
        <span className="inline-flex items-center gap-1.5">
          {poweredByLabel}
          <Image
            src={globalLogo}
            alt="Global International Services"
            className="size-8 object-contain dark:invert"
          />
        </span>
      </AnimatedContainer>
    </footer>
  );
}

function IconoEnlace({ nombre }: { nombre: NonNullable<FooterLink["icon"]> }) {
  if (nombre === "whatsapp") {
    return <BrandIcon icon={siWhatsapp} className="me-1 size-4 shrink-0" />;
  }

  const Icono = ICONOS[nombre];
  return <Icono className="me-1 size-4 shrink-0" />;
}

function FooterAnchor({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const className =
    "hover:text-foreground inline-flex cursor-pointer items-center transition-colors duration-200";

  if (
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("https://") ||
    href.startsWith("http://")
  ) {
    const externo = href.startsWith("http");
    return (
      <a
        href={href}
        className={className}
        {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

type ViewAnimationProps = {
  delay?: number;
  className?: ComponentProps<typeof motion.div>["className"];
  children: ReactNode;
};

function AnimatedContainer({
  className,
  delay = 0.1,
  children,
}: ViewAnimationProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ filter: "blur(4px)", translateY: -8, opacity: 0 }}
      whileInView={{ filter: "blur(0px)", translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
