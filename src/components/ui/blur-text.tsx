"use client";

import {
  motion,
  type TargetAndTransition,
  useReducedMotion,
} from "motion/react";
import { type ElementType, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type PasoAnimacion = {
  filter?: string;
  opacity?: number;
  y?: number;
};

type BlurTextProps = {
  text: string;
  className?: string;
  as?: "p" | "h1" | "h2" | "h3";
  animateBy?: "words" | "letters";
  direction?: "top" | "bottom";
  delay?: number;
  stepDuration?: number;
  threshold?: number;
  rootMargin?: string;
  onAnimationComplete?: () => void;
};

function armarKeyframes(
  from: PasoAnimacion,
  steps: PasoAnimacion[],
): TargetAndTransition {
  return {
    filter: [from.filter, ...steps.map((s) => s.filter)].filter(
      (v): v is string => v !== undefined,
    ),
    opacity: [from.opacity, ...steps.map((s) => s.opacity)].filter(
      (v): v is number => v !== undefined,
    ),
    y: [from.y, ...steps.map((s) => s.y)].filter(
      (v): v is number => v !== undefined,
    ),
  };
}

export function BlurText({
  text = "",
  delay = 200,
  className = "",
  as: Tag = "p",
  animateBy = "words",
  direction = "top",
  threshold = 0.1,
  rootMargin = "0px",
  onAnimationComplete,
  stepDuration = 0.35,
}: BlurTextProps) {
  const reducirMovimiento = useReducedMotion();
  const elementos = animateBy === "words" ? text.split(" ") : text.split("");
  const [enVista, setEnVista] = useState(false);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (reducirMovimiento) {
      setEnVista(true);
      return;
    }
    const nodo = ref.current;
    if (!nodo) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setEnVista(true);
          observer.unobserve(nodo);
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(nodo);
    return () => observer.disconnect();
  }, [threshold, rootMargin, reducirMovimiento]);

  const defaultFrom = useMemo(
    () =>
      direction === "top"
        ? { filter: "blur(10px)", opacity: 0, y: -50 }
        : { filter: "blur(10px)", opacity: 0, y: 50 },
    [direction],
  );

  const defaultTo = useMemo(
    () => [
      {
        filter: "blur(5px)",
        opacity: 0.5,
        y: direction === "top" ? 5 : -5,
      },
      { filter: "blur(0px)", opacity: 1, y: 0 },
    ],
    [direction],
  );

  if (reducirMovimiento) {
    const Titulo = Tag as ElementType;
    return <Titulo className={className}>{text}</Titulo>;
  }

  const stepCount = defaultTo.length + 1;
  const totalDuration = stepDuration * (stepCount - 1);
  const times = Array.from({ length: stepCount }, (_, i) =>
    stepCount === 1 ? 0 : i / (stepCount - 1),
  );
  const animateKeyframes = armarKeyframes(defaultFrom, defaultTo);
  const Titulo = Tag as ElementType;

  return (
    <Titulo ref={ref} className={cn("flex flex-wrap", className)}>
      {elementos.map((segmento, index) => (
        <motion.span
          className="inline-block will-change-[transform,filter,opacity]"
          // biome-ignore lint/suspicious/noArrayIndexKey: el texto es estático y el orden es el de la animación
          key={`${segmento}-${index}`}
          initial={defaultFrom}
          animate={enVista ? animateKeyframes : defaultFrom}
          transition={{
            duration: totalDuration,
            times,
            delay: (index * delay) / 1000,
            ease: "linear",
          }}
          onAnimationComplete={
            index === elementos.length - 1 ? onAnimationComplete : undefined
          }
        >
          {segmento === " " ? "\u00A0" : segmento}
          {animateBy === "words" && index < elementos.length - 1
            ? "\u00A0"
            : null}
        </motion.span>
      ))}
    </Titulo>
  );
}
