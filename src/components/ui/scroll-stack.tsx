"use client";

import { useReducedMotion } from "motion/react";
import { type ReactNode, useCallback, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type ScrollStackItemProps = {
  itemClassName?: string;
  children: ReactNode;
};

type TransformTarjeta = {
  translateY: number;
  scale: number;
  rotation: number;
  blur: number;
};

export type ScrollStackProps = {
  className?: string;
  children: ReactNode;
  itemDistance?: number;
  itemScale?: number;
  itemStackDistance?: number;
  stackPosition?: string;
  scaleEndPosition?: string;
  baseScale?: number;
  rotationAmount?: number;
  blurAmount?: number;
  useWindowScroll?: boolean;
  onStackComplete?: () => void;
};

function progreso(scrollTop: number, inicio: number, fin: number) {
  if (scrollTop < inicio) return 0;
  if (scrollTop > fin) return 1;
  return (scrollTop - inicio) / (fin - inicio);
}

function aPixeles(valor: string | number, altoContenedor: number) {
  if (typeof valor === "string" && valor.includes("%")) {
    return (Number.parseFloat(valor) / 100) * altoContenedor;
  }
  return Number.parseFloat(String(valor));
}

/** Posición de layout, sin el translate que el propio stack aplica. */
function topeEnDocumento(elemento: HTMLElement) {
  const rect = elemento.getBoundingClientRect();
  const matriz = new DOMMatrix(getComputedStyle(elemento).transform);
  return rect.top + window.scrollY - matriz.m42;
}

export function ScrollStackItem({
  children,
  itemClassName = "",
}: ScrollStackItemProps) {
  return (
    <div
      className={cn(
        "scroll-stack-card relative box-border w-full origin-top rounded-[2rem] border border-border-default bg-bg-subtle p-6 shadow-[0_0_30px_rgba(0,0,0,0.08)] sm:rounded-[2.5rem] sm:p-10 dark:shadow-[0_0_30px_rgba(0,0,0,0.35)]",
        itemClassName,
      )}
    >
      {children}
    </div>
  );
}

export function ScrollStack({
  children,
  className,
  itemDistance = 100,
  itemScale = 0.03,
  itemStackDistance = 30,
  stackPosition = "20%",
  scaleEndPosition = "10%",
  baseScale = 0.85,
  rotationAmount = 0,
  blurAmount = 0,
  useWindowScroll = false,
  onStackComplete,
}: ScrollStackProps) {
  const reducirMovimiento = useReducedMotion();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stackCompletadoRef = useRef(false);
  const tarjetasRef = useRef<HTMLElement[]>([]);
  const ultimosRef = useRef(new Map<number, TransformTarjeta>());
  const actualizandoRef = useRef(false);

  const actualizar = useCallback(() => {
    if (!tarjetasRef.current.length || actualizandoRef.current) return;
    if (reducirMovimiento) return;

    actualizandoRef.current = true;

    const scroller = scrollerRef.current;
    const scrollTop = useWindowScroll
      ? window.scrollY
      : (scroller?.scrollTop ?? 0);
    const altoContenedor = useWindowScroll
      ? window.innerHeight
      : (scroller?.clientHeight ?? 0);
    const posicionPila = aPixeles(stackPosition, altoContenedor);
    const finEscala = aPixeles(scaleEndPosition, altoContenedor);
    const fin = scroller?.querySelector<HTMLElement>(".scroll-stack-end");
    const topeFin = fin
      ? useWindowScroll
        ? topeEnDocumento(fin)
        : fin.offsetTop
      : 0;

    const topeDe = (tarjeta: HTMLElement) =>
      useWindowScroll ? topeEnDocumento(tarjeta) : tarjeta.offsetTop;

    let indiceSuperior = 0;
    if (blurAmount) {
      for (let j = 0; j < tarjetasRef.current.length; j++) {
        const tarjeta = tarjetasRef.current[j];
        if (!tarjeta) continue;
        const inicio = topeDe(tarjeta) - posicionPila - itemStackDistance * j;
        if (scrollTop >= inicio) indiceSuperior = j;
      }
    }

    tarjetasRef.current.forEach((tarjeta, i) => {
      if (!tarjeta) return;

      const tope = topeDe(tarjeta);
      const inicioDisparo = tope - posicionPila - itemStackDistance * i;
      const finDisparo = tope - finEscala;
      const avanceEscala = progreso(scrollTop, inicioDisparo, finDisparo);
      const escalaObjetivo = baseScale + i * itemScale;
      const escala = 1 - avanceEscala * (1 - escalaObjetivo);
      const rotacion = rotationAmount ? i * rotationAmount * avanceEscala : 0;

      let desenfoque = 0;
      if (blurAmount && i < indiceSuperior) {
        desenfoque = Math.max(0, (indiceSuperior - i) * blurAmount);
      }

      const finClavado = topeFin - altoContenedor / 2;
      const clavada = scrollTop >= inicioDisparo && scrollTop <= finClavado;
      let translateY = 0;
      if (clavada) {
        translateY = scrollTop - tope + posicionPila + itemStackDistance * i;
      } else if (scrollTop > finClavado) {
        translateY = finClavado - tope + posicionPila + itemStackDistance * i;
      }

      const siguiente: TransformTarjeta = {
        translateY: Math.round(translateY * 100) / 100,
        scale: Math.round(escala * 1000) / 1000,
        rotation: Math.round(rotacion * 100) / 100,
        blur: Math.round(desenfoque * 100) / 100,
      };

      const previo = ultimosRef.current.get(i);
      const cambio =
        !previo ||
        Math.abs(previo.translateY - siguiente.translateY) > 0.1 ||
        Math.abs(previo.scale - siguiente.scale) > 0.001 ||
        Math.abs(previo.rotation - siguiente.rotation) > 0.1 ||
        Math.abs(previo.blur - siguiente.blur) > 0.1;

      if (cambio) {
        tarjeta.style.transform = `translate3d(0, ${siguiente.translateY}px, 0) scale(${siguiente.scale}) rotate(${siguiente.rotation}deg)`;
        tarjeta.style.filter =
          siguiente.blur > 0 ? `blur(${siguiente.blur}px)` : "";
        ultimosRef.current.set(i, siguiente);
      }

      if (i === tarjetasRef.current.length - 1) {
        if (clavada && !stackCompletadoRef.current) {
          stackCompletadoRef.current = true;
          onStackComplete?.();
        } else if (!clavada && stackCompletadoRef.current) {
          stackCompletadoRef.current = false;
        }
      }
    });

    actualizandoRef.current = false;
  }, [
    baseScale,
    blurAmount,
    itemScale,
    itemStackDistance,
    onStackComplete,
    reducirMovimiento,
    rotationAmount,
    scaleEndPosition,
    stackPosition,
    useWindowScroll,
  ]);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const tarjetas = Array.from(
      scroller.querySelectorAll<HTMLElement>(".scroll-stack-card"),
    );
    tarjetasRef.current = tarjetas;
    const cache = ultimosRef.current;

    if (reducirMovimiento) {
      tarjetas.forEach((tarjeta) => {
        tarjeta.style.marginBottom = "";
        tarjeta.style.transform = "";
        tarjeta.style.filter = "";
      });
      return () => {
        tarjetasRef.current = [];
        cache.clear();
      };
    }

    tarjetas.forEach((tarjeta, i) => {
      tarjeta.style.marginBottom =
        i < tarjetas.length - 1 ? `${itemDistance}px` : "";
      tarjeta.style.zIndex = String(i + 1);
      tarjeta.style.willChange = "transform, filter";
      tarjeta.style.transformOrigin = "top center";
      tarjeta.style.backfaceVisibility = "hidden";
    });

    const interior = scroller.querySelector<HTMLElement>(".scroll-stack-inner");
    const reservarSeparacion = () => {
      if (!useWindowScroll || !interior || tarjetas.length === 0) return;
      const ultima = tarjetas[tarjetas.length - 1];
      if (!ultima) return;
      const altoViewport = window.innerHeight;
      const posicionPila = aPixeles(stackPosition, altoViewport);
      const escalaFrente = baseScale + (tarjetas.length - 1) * itemScale;
      const altoFrente = ultima.offsetHeight * escalaFrente;
      const separacion = 112;
      const sobrante =
        posicionPila -
        altoViewport / 2 +
        (tarjetas.length - 1) * itemStackDistance +
        altoFrente;
      interior.style.paddingBottom = `${Math.max(separacion, sobrante + separacion)}px`;
    };
    reservarSeparacion();

    const alScroll = () => actualizar();
    let frame = 0;
    const seguirScroll = () => {
      actualizar();
      frame = requestAnimationFrame(seguirScroll);
    };

    if (useWindowScroll) {
      // El scroll de anclas no siempre emite el evento en window; el frame
      // lee scrollY y mantiene la pila alineada.
      frame = requestAnimationFrame(seguirScroll);
    } else {
      scroller.addEventListener("scroll", alScroll, { passive: true });
      actualizar();
    }
    const alRedimensionar = () => {
      reservarSeparacion();
      alScroll();
    };
    window.addEventListener("resize", alRedimensionar);

    return () => {
      cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", alScroll);
      window.removeEventListener("resize", alRedimensionar);
      if (interior) interior.style.paddingBottom = "";
      stackCompletadoRef.current = false;
      tarjetasRef.current = [];
      cache.clear();
      actualizandoRef.current = false;
    };
  }, [
    actualizar,
    baseScale,
    itemDistance,
    itemScale,
    itemStackDistance,
    reducirMovimiento,
    stackPosition,
    useWindowScroll,
  ]);

  return (
    <div
      ref={scrollerRef}
      className={cn(
        "relative w-full",
        !useWindowScroll &&
          "h-full overflow-x-visible overflow-y-auto overscroll-contain",
        className,
      )}
    >
      <div
        className={cn(
          "scroll-stack-inner",
          !useWindowScroll && "min-h-screen px-5 pt-[20vh] pb-[50rem] sm:px-20",
        )}
      >
        {children}
        {/* Extiende el clavado para que la pila se sostenga y suelte antes del bloque siguiente. */}
        {useWindowScroll && !reducirMovimiento ? (
          <div className="h-[40vh]" aria-hidden />
        ) : null}
        <div className="scroll-stack-end h-px w-full" />
      </div>
    </div>
  );
}
