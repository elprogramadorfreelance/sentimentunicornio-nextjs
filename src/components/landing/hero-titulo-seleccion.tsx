"use client";

import { motion, useReducedMotion } from "motion/react";
import { type ReactNode, type RefObject, useState } from "react";
import { TimelineAnimation } from "@/components/ui";

const EASE_SELECCION = [0.23, 1, 0.32, 1] as const;
const EASE_WIPE = [0.4, 0, 0.2, 1] as const;
const DURACION_WIPE = 1.15;
const DELAY_WIPE = 0.12;
const DURACION_MANIJAS = 0.15;

const CLIP_OCULTO = "inset(0 100% 0 0)";
const CLIP_VISIBLE = "inset(0 0% 0 0)";

const CLASE_MANIJA =
  "pointer-events-none absolute z-20 size-3 border-2 border-indigo-500 bg-card dark:border-sky";

type HeroTituloSeleccionProps = {
  children: ReactNode;
  timelineRef: RefObject<HTMLElement | null>;
};

export function HeroTituloSeleccion({
  children,
  timelineRef,
}: HeroTituloSeleccionProps) {
  const reducirMovimiento = useReducedMotion();
  const [mostrarSeleccion, setMostrarSeleccion] = useState(false);
  const [mostrarManijas, setMostrarManijas] = useState(false);

  const seleccionVisible = Boolean(reducirMovimiento) || mostrarSeleccion;
  const manijasVisibles = Boolean(reducirMovimiento) || mostrarManijas;

  return (
    <span className="relative inline-block px-4 py-1">
      <TimelineAnimation
        as="span"
        animationNum={4}
        timelineRef={timelineRef}
        className="relative z-10 text-indigo-500 dark:text-sky"
        onAnimationComplete={(definition) => {
          if (definition !== "visible") {
            return;
          }
          setMostrarSeleccion(true);
          if (reducirMovimiento) {
            setMostrarManijas(true);
          }
        }}
      >
        {children}
      </TimelineAnimation>
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 rounded-md border-2 border-indigo-500 bg-indigo-100 dark:border-sky dark:bg-sky/15"
        initial={{ clipPath: reducirMovimiento ? CLIP_VISIBLE : CLIP_OCULTO }}
        animate={{
          clipPath: seleccionVisible ? CLIP_VISIBLE : CLIP_OCULTO,
        }}
        transition={{
          duration: reducirMovimiento || !seleccionVisible ? 0 : DURACION_WIPE,
          delay: reducirMovimiento || !seleccionVisible ? 0 : DELAY_WIPE,
          ease: EASE_WIPE,
        }}
        onAnimationComplete={() => {
          if (seleccionVisible) {
            setMostrarManijas(true);
          }
        }}
      />
      <motion.span
        aria-hidden
        className={`${CLASE_MANIJA} -top-1.5 -left-1.5`}
        initial={{ opacity: reducirMovimiento ? 1 : 0 }}
        animate={{ opacity: manijasVisibles ? 1 : 0 }}
        transition={{
          duration: reducirMovimiento ? 0 : DURACION_MANIJAS,
          ease: EASE_SELECCION,
        }}
      />
      <motion.span
        aria-hidden
        className={`${CLASE_MANIJA} -top-1.5 -right-1.5`}
        initial={{ opacity: reducirMovimiento ? 1 : 0 }}
        animate={{ opacity: manijasVisibles ? 1 : 0 }}
        transition={{
          duration: reducirMovimiento ? 0 : DURACION_MANIJAS,
          ease: EASE_SELECCION,
        }}
      />
      <motion.span
        aria-hidden
        className={`${CLASE_MANIJA} -bottom-1.5 -left-1.5`}
        initial={{ opacity: reducirMovimiento ? 1 : 0 }}
        animate={{ opacity: manijasVisibles ? 1 : 0 }}
        transition={{
          duration: reducirMovimiento ? 0 : DURACION_MANIJAS,
          ease: EASE_SELECCION,
        }}
      />
      <motion.span
        aria-hidden
        className={`${CLASE_MANIJA} -bottom-1.5 -right-1.5`}
        initial={{ opacity: reducirMovimiento ? 1 : 0 }}
        animate={{ opacity: manijasVisibles ? 1 : 0 }}
        transition={{
          duration: reducirMovimiento ? 0 : DURACION_MANIJAS,
          ease: EASE_SELECCION,
        }}
      />
    </span>
  );
}
