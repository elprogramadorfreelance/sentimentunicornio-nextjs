"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type FocusBlurItem = {
  id: string;
  label: string;
  hint?: string;
};

type FocusBlurProps = {
  items: FocusBlurItem[];
  onSelect?: (item: FocusBlurItem) => void;
  blurAmount?: number;
  opacityAmount?: number;
  showBrackets?: boolean;
  className?: string;
};

/**
 * Micro-interacción Focus Blur (Amicro btn-35):
 * al enfocar un ítem, el resto se desenfoca y el activo recibe un marco punteado.
 */
export function FocusBlur({
  items,
  onSelect,
  blurAmount = 4,
  opacityAmount = 0.4,
  showBrackets = true,
  className,
}: FocusBlurProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (items.length === 0) {
    return (
      <p className="flex h-full items-center justify-center text-xs text-text-muted">
        Sin datos para graficar.
      </p>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full flex-wrap content-center items-center justify-center gap-x-5 gap-y-4 overflow-y-auto px-2 py-2",
        className,
      )}
    >
      {items.map((item, index) => {
        const isHovered = hoveredIndex === index;
        const isInactive = hoveredIndex !== null && !isHovered;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect?.(item)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onFocus={() => setHoveredIndex(index)}
            onBlur={() => setHoveredIndex(null)}
            title={item.hint}
            className="relative cursor-pointer select-none px-2 py-1 font-display text-base font-semibold tracking-tight whitespace-nowrap text-text-primary no-underline outline-none transition-[filter,opacity,color] duration-300 sm:text-xl"
            style={{
              filter: isInactive ? `blur(${blurAmount}px)` : "none",
              opacity: isInactive ? opacityAmount : 1,
              color: isHovered ? "var(--color-primary)" : undefined,
            }}
          >
            <span className="relative z-10">{item.label}</span>
            {showBrackets && (
              <AnimatePresence>
                {isHovered && (
                  <motion.span
                    initial={{ opacity: 0, scale: 1.3 }}
                    animate={{ opacity: 1, scale: 1.1 }}
                    exit={{ opacity: 0, scale: 1.3 }}
                    transition={{ type: "spring", stiffness: 350, damping: 20 }}
                    className="pointer-events-none absolute inset-0 z-0 rounded-lg border-2 border-dashed border-primary/50"
                    style={{ margin: "-4px -8px" }}
                    aria-hidden
                  />
                )}
              </AnimatePresence>
            )}
          </button>
        );
      })}
    </div>
  );
}
