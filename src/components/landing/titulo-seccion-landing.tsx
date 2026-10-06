"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useTema } from "@/components/tema";
import { BlurText, ShinyText } from "@/components/ui";

const DELAY_PALABRA_MS = 100;
const DURACION_BLUR_MS = 700;
const COLCHON_MS = 280;

type TituloSeccionLandingProps = {
  text: string;
  className?: string;
  color?: string;
  shineColor?: string;
  as?: "p" | "h1" | "h2" | "h3";
};

export function TituloSeccionLanding({
  text,
  className,
  color,
  shineColor = "#ffffff",
  as = "h2",
}: TituloSeccionLandingProps) {
  const reducirMovimiento = useReducedMotion();
  const { resuelto } = useTema();
  const [brilloListo, setBrilloListo] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  const colorBase = color ?? (resuelto === "dark" ? "#c8c8cc" : "#161712");

  useEffect(() => {
    if (reducirMovimiento) {
      setBrilloListo(true);
      return;
    }
    if (brilloListo) {
      return;
    }

    const nodo = contenedorRef.current;
    if (!nodo) {
      return;
    }

    let timeoutId: number | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }
        observer.disconnect();
        const palabras = text.trim().split(/\s+/).filter(Boolean).length;
        const ms =
          Math.max(0, palabras - 1) * DELAY_PALABRA_MS +
          DURACION_BLUR_MS +
          COLCHON_MS;
        timeoutId = window.setTimeout(() => setBrilloListo(true), ms);
      },
      { threshold: 0.1 },
    );
    observer.observe(nodo);

    return () => {
      observer.disconnect();
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [text, reducirMovimiento, brilloListo]);

  const Titulo = as;

  if (brilloListo) {
    return (
      <Titulo className={className}>
        <ShinyText
          text={text}
          speed={2.5}
          delay={0.8}
          color={colorBase}
          shineColor={shineColor}
          spread={120}
          direction="left"
          yoyo={false}
          pauseOnHover={false}
          className="max-w-full"
        />
      </Titulo>
    );
  }

  return (
    <div ref={contenedorRef}>
      <BlurText
        as={as}
        text={text}
        delay={DELAY_PALABRA_MS}
        animateBy="words"
        direction="top"
        className={className}
        onAnimationComplete={() => setBrilloListo(true)}
      />
    </div>
  );
}
