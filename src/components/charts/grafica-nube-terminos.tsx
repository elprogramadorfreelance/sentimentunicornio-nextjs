"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { PALETA_ACTIVA } from "@/lib/paletas-graficas";

export type TérminoNube = {
  id: string;
  texto: string;
  menciones: number;
};

type GraficaNubeTerminosProps = {
  términos: TérminoNube[];
  etiqueta: string;
  className?: string;
  onSeleccionar?: (término: TérminoNube) => void;
  etiquetaAcción?: string;
};

/** Nube de palabras real: siempre horizontal, empacada de forma compacta, con
 * degradado morado→azul (tokens de marca --color-accent/--color-sky) según
 * qué tan frecuente es cada término, y aro punteado al pasar el mouse. */
export function GraficaNubeTerminos({
  términos,
  etiqueta,
  className,
  onSeleccionar,
  etiquetaAcción = "Ver menciones de",
}: GraficaNubeTerminosProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (términos.length === 0) {
    return (
      <p className="flex h-full items-center justify-center text-xs text-text-muted">
        Sin datos suficientes todavía.
      </p>
    );
  }

  const menciones = términos.map((item) => item.menciones);
  const min = Math.min(...menciones);
  const max = Math.max(...menciones);

  // El término más grande va al centro visual y el resto se acomoda
  // alternando hacia afuera (centro, +1, -1, +2, -2…) usando `order` de
  // flexbox — así se aproxima una nube real sin medir colisiones de texto.
  const centro = Math.floor((términos.length - 1) / 2);
  const ordenPorId = new Map(
    [...términos]
      .sort((a, b) => b.menciones - a.menciones)
      .map((término, rango) => [
        término.id,
        rango === 0
          ? centro
          : centro + (rango % 2 === 1 ? Math.ceil(rango / 2) : -Math.ceil(rango / 2)),
      ]),
  );

  return (
    <ul
      className={cn(
        "@container flex h-full min-h-0 w-full min-w-0 max-w-full list-none flex-wrap content-center items-baseline justify-center gap-x-1.5 gap-y-1 overflow-x-hidden overflow-y-auto px-1 py-2 sm:gap-x-2.5 sm:gap-y-1.5 sm:px-2",
        className,
      )}
      aria-label={etiqueta}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {términos.map((término, índice) => {
        const pesoRelativo = (término.menciones - min) / (max - min || 1);
        const tamaño = 13 + pesoRelativo ** 1.3 * 51;
        const peso = pesoRelativo > 0.7 ? 700 : pesoRelativo > 0.35 ? 600 : 500;
        const clicable = Boolean(onSeleccionar);
        const isHovered = hoveredIndex === índice;
        const isInactive = hoveredIndex !== null && !isHovered;
        const etiquetaTérmino = `${término.texto}: ${término.menciones.toLocaleString("es-MX")} menciones`;
        const claseTérmino = cn(
          "relative max-w-full min-w-0 leading-none outline-none transition-[filter,opacity] duration-300 whitespace-nowrap",
          clicable && "cursor-pointer focus-visible:ring-2 focus-visible:ring-accent",
        );

        const contenido = (
          <>
            <span className="relative z-10">{término.texto}</span>
            {clicable && (
              <AnimatePresence>
                {isHovered && (
                  <motion.span
                    initial={{ opacity: 0, scale: 1.3 }}
                    animate={{ opacity: 1, scale: 1.1 }}
                    exit={{ opacity: 0, scale: 1.3 }}
                    transition={{ type: "spring", stiffness: 350, damping: 20 }}
                    className="pointer-events-none absolute inset-0 z-0 rounded-lg border-2 border-dashed border-current"
                    style={{ margin: "-4px -8px" }}
                    aria-hidden
                  />
                )}
              </AnimatePresence>
            )}
          </>
        );

        const estilo = {
          fontSize: `min(${tamaño}px, 9vw)`,
          fontWeight: peso,
          color:
            PALETA_ACTIVA.categorica[índice % PALETA_ACTIVA.categorica.length].plano,
          filter: isInactive ? "blur(4px)" : "none",
          opacity: isInactive ? 0.4 : 1,
        } as const;

        return (
          <li
            key={término.id}
            className="flex max-w-full min-w-0"
            style={{ order: ordenPorId.get(término.id) ?? índice }}
          >
            {clicable ? (
              <button
                type="button"
                className={claseTérmino}
                style={estilo}
                title={etiquetaTérmino}
                aria-label={`${etiquetaAcción} ${etiquetaTérmino}`}
                onClick={() => onSeleccionar?.(término)}
                onMouseEnter={() => setHoveredIndex(índice)}
                onFocus={() => setHoveredIndex(índice)}
                onBlur={() => setHoveredIndex(null)}
              >
                {contenido}
              </button>
            ) : (
              <span className={claseTérmino} style={estilo} title={etiquetaTérmino}>
                {contenido}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
