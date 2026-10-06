"use client";

import { ArrowRightIcon, PlusIcon } from "lucide-react";
import { AnimatePresence, type HTMLMotionProps, motion } from "motion/react";
import type * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

/** Omit<..., "children">: el componente renderiza motion.button, así que
 * las props deben tipar contra HTMLMotionProps (no ButtonHTMLAttributes
 * nativo) — motion redefine onDrag/onAnimationStart/etc. con su propia
 * firma, y mezclar ambos tipos rompe el build de Next/TypeScript. */
type SlideArrowButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  children: React.ReactNode;
  /** Ícono a la izquierda en estado idle. Por defecto: Plus. */
  idleIcon?: React.ReactNode;
};

/** Ease-out: responde al hover y aterriza suave (mejor que ease-in-out en feedback UI). */
const iconEase = {
  duration: 0.42,
  ease: [0.22, 1, 0.36, 1] as const,
};

const scaleEase = {
  duration: 0.35,
  ease: [0.22, 1, 0.36, 1] as const,
};

/**
 * Botón primario con micro-interacción slide-arrow (idle icon ↔ flecha).
 * Slots fijos a ambos lados evitan layout thrashing al intercambiar íconos.
 */
export function SlideArrowButton({
  children,
  className,
  disabled,
  idleIcon,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  type = "button",
  ...props
}: SlideArrowButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const showArrow = isHovered && !disabled;

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onMouseEnter={(e) => {
        setIsHovered(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        onMouseLeave?.(e);
      }}
      onFocus={(e) => {
        setIsHovered(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setIsHovered(false);
        onBlur?.(e);
      }}
      whileHover={disabled ? undefined : { scale: 1.01 }}
      whileTap={disabled ? undefined : { scale: 0.985 }}
      transition={scaleEase}
      className={cn(
        buttonVariants({ variant: "default" }),
        "relative gap-2",
        className,
      )}
      {...props}
    >
      <span className="relative grid size-4 shrink-0 place-items-center overflow-hidden">
        <AnimatePresence initial={false} mode="sync">
          {!showArrow && (
            <motion.span
              key="icon-idle"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={iconEase}
              className="absolute inset-0 flex items-center justify-center"
            >
              {idleIcon ?? <PlusIcon className="size-4" aria-hidden />}
            </motion.span>
          )}
        </AnimatePresence>
      </span>

      <span className="tracking-tight">{children}</span>

      <span className="relative grid size-4 shrink-0 place-items-center overflow-hidden">
        <AnimatePresence initial={false} mode="sync">
          {showArrow && (
            <motion.span
              key="icon-arrow"
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={iconEase}
              className="absolute inset-0 flex items-center justify-center"
            >
              <ArrowRightIcon className="size-4" aria-hidden />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </motion.button>
  );
}
