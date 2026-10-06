"use client";

import { type AnimationPlaybackControls, animate } from "motion/react";
import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import "./magic-bento.css";

const DEFAULT_PARTICLE_COUNT = 12;
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const DEFAULT_GLOW_COLOR = "132, 0, 255";
const MOBILE_BREAKPOINT = 768;
// Equivalentes cúbicos de power2.out / power2.inOut de GSAP para conservar la sensación original.
const EASE_OUT = [0.33, 1, 0.68, 1] as const;
const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

export type MagicBentoProps = {
  children?: ReactNode;
  className?: string;
  textAutoHide?: boolean;
  enableStars?: boolean;
  enableSpotlight?: boolean;
  enableBorderGlow?: boolean;
  disableAnimations?: boolean;
  spotlightRadius?: number;
  particleCount?: number;
  enableTilt?: boolean;
  glowColor?: string;
  clickEffect?: boolean;
  enableMagnetism?: boolean;
};

function createParticleElement(
  x: number,
  y: number,
  color: string,
): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "particle";
  el.style.cssText = `
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(${color}, 1);
    box-shadow: 0 0 6px rgba(${color}, 0.6);
    pointer-events: none;
    z-index: 30;
    left: ${x}px;
    top: ${y}px;
  `;
  return el;
}

function calculateSpotlightValues(radius: number): {
  proximity: number;
  fadeDistance: number;
} {
  return {
    proximity: radius * 0.5,
    fadeDistance: radius * 0.75,
  };
}

function updateCardGlowProperties(
  card: HTMLElement,
  mouseX: number,
  mouseY: number,
  glow: number,
  radius: number,
): void {
  const rect = card.getBoundingClientRect();
  const relativeX = ((mouseX - rect.left) / rect.width) * 100;
  const relativeY = ((mouseY - rect.top) / rect.height) * 100;

  card.style.setProperty("--glow-x", `${relativeX}%`);
  card.style.setProperty("--glow-y", `${relativeY}%`);
  card.style.setProperty("--glow-intensity", glow.toString());
  card.style.setProperty("--glow-radius", `${radius}px`);
}

type ParticleCardProps = {
  children: ReactNode;
  className?: string;
  disableAnimations?: boolean;
  style?: CSSProperties;
  particleCount?: number;
  glowColor?: string;
  enableStars?: boolean;
  enableTilt?: boolean;
  clickEffect?: boolean;
  enableMagnetism?: boolean;
};

function ParticleCard({
  children,
  className = "",
  disableAnimations = false,
  style,
  particleCount = DEFAULT_PARTICLE_COUNT,
  glowColor = DEFAULT_GLOW_COLOR,
  enableStars = true,
  enableTilt = true,
  clickEffect = false,
  enableMagnetism = false,
}: ParticleCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement[]>([]);
  const timeoutsRef = useRef<number[]>([]);
  const isHoveredRef = useRef(false);
  const memoizedParticles = useRef<HTMLDivElement[]>([]);
  const particlesInitialized = useRef(false);
  const seededGlowRef = useRef<string | null>(null);
  const magnetismAnimationRef = useRef<AnimationPlaybackControls | null>(null);
  const particleLoopsRef = useRef<AnimationPlaybackControls[]>([]);

  const clearAllParticles = useCallback(() => {
    for (const timeoutId of timeoutsRef.current) {
      clearTimeout(timeoutId);
    }
    timeoutsRef.current = [];
    magnetismAnimationRef.current?.stop();

    for (const loop of particleLoopsRef.current) {
      loop.stop();
    }
    particleLoopsRef.current = [];

    for (const particle of particlesRef.current) {
      animate(
        particle,
        { scale: 0, opacity: 0 },
        { duration: 0.3, ease: "backIn" },
      ).then(() => {
        particle.parentNode?.removeChild(particle);
      });
    }
    particlesRef.current = [];
  }, []);

  const initializeParticles = useCallback(() => {
    if (!cardRef.current || !enableStars) return;
    if (particlesInitialized.current && seededGlowRef.current === glowColor) {
      return;
    }

    const { width, height } = cardRef.current.getBoundingClientRect();
    seededGlowRef.current = glowColor;
    memoizedParticles.current = Array.from({ length: particleCount }, () =>
      createParticleElement(
        Math.random() * width,
        Math.random() * height,
        glowColor,
      ),
    );
    particlesInitialized.current = true;
  }, [enableStars, particleCount, glowColor]);

  const animateParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current || !enableStars) return;

    initializeParticles();

    memoizedParticles.current.forEach((particle, index) => {
      const timeoutId = window.setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return;

        const clone = particle.cloneNode(true) as HTMLDivElement;
        cardRef.current.appendChild(clone);
        particlesRef.current.push(clone);

        animate(clone, { scale: [0, 1] }, { duration: 0.3, ease: "backOut" });
        animate(clone, { opacity: [0, 1] }, { duration: 0.3 }).then(() => {
          if (!clone.isConnected || !particlesRef.current.includes(clone)) {
            return;
          }
          particleLoopsRef.current.push(
            animate(
              clone,
              { opacity: 0.3 },
              {
                duration: 1.5,
                ease: EASE_IN_OUT,
                repeat: Infinity,
                repeatType: "reverse",
              },
            ),
          );
        });

        particleLoopsRef.current.push(
          animate(
            clone,
            {
              x: (Math.random() - 0.5) * 100,
              y: (Math.random() - 0.5) * 100,
              rotate: Math.random() * 360,
            },
            {
              duration: 2 + Math.random() * 2,
              ease: "linear",
              repeat: Infinity,
              repeatType: "reverse",
            },
          ),
        );
      }, index * 100);

      timeoutsRef.current.push(timeoutId);
    });
  }, [enableStars, initializeParticles]);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;

    // Las partículas guardan coordenadas del ancho actual; al colapsar
    // el sidebar hay que volver a sembrarlas.
    const observer = new ResizeObserver(() => {
      particlesInitialized.current = false;
      memoizedParticles.current = [];
      if (isHoveredRef.current) {
        clearAllParticles();
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [clearAllParticles]);

  useEffect(() => {
    if (disableAnimations || !cardRef.current) return;

    const element = cardRef.current;

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      animateParticles();

      if (enableTilt) {
        animate(
          element,
          { rotateX: 5, rotateY: 5, transformPerspective: 1000 },
          { duration: 0.3, ease: EASE_OUT },
        );
      }
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      clearAllParticles();

      if (enableTilt) {
        animate(
          element,
          { rotateX: 0, rotateY: 0 },
          { duration: 0.3, ease: EASE_OUT },
        );
      }

      if (enableMagnetism) {
        animate(element, { x: 0, y: 0 }, { duration: 0.3, ease: EASE_OUT });
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!enableTilt && !enableMagnetism) return;

      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      if (enableTilt) {
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;

        animate(
          element,
          { rotateX, rotateY, transformPerspective: 1000 },
          { duration: 0.1, ease: EASE_OUT },
        );
      }

      if (enableMagnetism) {
        const magnetX = (x - centerX) * 0.05;
        const magnetY = (y - centerY) * 0.05;

        magnetismAnimationRef.current = animate(
          element,
          { x: magnetX, y: magnetY },
          { duration: 0.3, ease: EASE_OUT },
        );
      }
    };

    const handleClick = (event: MouseEvent) => {
      if (!clickEffect) return;

      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height),
      );

      const ripple = document.createElement("div");
      ripple.style.cssText = `
        position: absolute;
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(${glowColor}, 0.4) 0%, rgba(${glowColor}, 0.2) 30%, transparent 70%);
        left: ${x - maxDistance}px;
        top: ${y - maxDistance}px;
        pointer-events: none;
        z-index: 40;
      `;

      element.appendChild(ripple);

      animate(
        ripple,
        { scale: [0, 1], opacity: [1, 0] },
        { duration: 0.8, ease: EASE_OUT },
      ).then(() => ripple.remove());
    };

    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);
    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("click", handleClick);

    if (element.matches(":hover")) {
      isHoveredRef.current = true;
      animateParticles();
    }

    return () => {
      isHoveredRef.current = false;
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mouseleave", handleMouseLeave);
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("click", handleClick);
      clearAllParticles();
    };
  }, [
    animateParticles,
    clearAllParticles,
    disableAnimations,
    enableTilt,
    enableMagnetism,
    clickEffect,
    glowColor,
  ]);

  return (
    <div
      ref={cardRef}
      className={cn(className, "particle-container")}
      style={{ ...style, position: "relative", overflow: "hidden" }}
    >
      {children}
    </div>
  );
}

type GlobalSpotlightProps = {
  gridRef: RefObject<HTMLDivElement | null>;
  disableAnimations?: boolean;
  enabled?: boolean;
  spotlightRadius?: number;
  glowColor?: string;
};

function GlobalSpotlight({
  gridRef,
  disableAnimations = false,
  enabled = true,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  glowColor = DEFAULT_GLOW_COLOR,
}: GlobalSpotlightProps) {
  useEffect(() => {
    if (disableAnimations || !gridRef.current || !enabled) return;

    const section = gridRef.current;
    const spotlight = document.createElement("div");
    spotlight.className = "global-spotlight";
    spotlight.style.cssText = `
      position: absolute;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${glowColor}, 0.15) 0%,
        rgba(${glowColor}, 0.08) 15%,
        rgba(${glowColor}, 0.04) 25%,
        rgba(${glowColor}, 0.02) 40%,
        rgba(${glowColor}, 0.01) 65%,
        transparent 70%
      );
      z-index: 15;
      opacity: 0;
      transform: translate(-50%, -50%);
    `;
    // Dentro del panel, no en document.body: el glow no invade el contenido.
    const card = section.querySelector(".magic-bento-card");
    (card ?? section).appendChild(spotlight);

    const cards = () =>
      section.querySelectorAll<HTMLElement>(".magic-bento-card");

    const handleMouseMove = (event: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      const mouseInside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (!mouseInside) {
        animate(spotlight, { opacity: 0 }, { duration: 0.3, ease: EASE_OUT });
        for (const item of cards()) {
          item.style.setProperty("--glow-intensity", "0");
        }
        return;
      }

      const { proximity, fadeDistance } =
        calculateSpotlightValues(spotlightRadius);
      let minDistance = Infinity;

      for (const item of cards()) {
        const cardRect = item.getBoundingClientRect();
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;
        const distance =
          Math.hypot(event.clientX - centerX, event.clientY - centerY) -
          Math.max(cardRect.width, cardRect.height) / 2;
        const effectiveDistance = Math.max(0, distance);

        minDistance = Math.min(minDistance, effectiveDistance);

        let glowIntensity = 0;
        if (effectiveDistance <= proximity) {
          glowIntensity = 1;
        } else if (effectiveDistance <= fadeDistance) {
          glowIntensity =
            (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
        }

        updateCardGlowProperties(
          item,
          event.clientX,
          event.clientY,
          glowIntensity,
          spotlightRadius,
        );
      }

      const host = spotlight.parentElement ?? section;
      const hostRect = host.getBoundingClientRect();
      animate(
        spotlight,
        {
          left: `${event.clientX - hostRect.left}px`,
          top: `${event.clientY - hostRect.top}px`,
        },
        { duration: 0.1, ease: EASE_OUT },
      );

      const targetOpacity =
        minDistance <= proximity
          ? 0.8
          : minDistance <= fadeDistance
            ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8
            : 0;

      animate(
        spotlight,
        { opacity: targetOpacity },
        { duration: targetOpacity > 0 ? 0.2 : 0.5, ease: EASE_OUT },
      );
    };

    const handleMouseLeave = () => {
      for (const item of cards()) {
        item.style.setProperty("--glow-intensity", "0");
      }
      animate(spotlight, { opacity: 0 }, { duration: 0.3, ease: EASE_OUT });
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      spotlight.parentNode?.removeChild(spotlight);
    };
  }, [gridRef, disableAnimations, enabled, spotlightRadius, glowColor]);

  return null;
}

function useMobileDetection(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () =>
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

export function MagicBento({
  children,
  className,
  textAutoHide = true,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  disableAnimations = false,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  particleCount = DEFAULT_PARTICLE_COUNT,
  enableTilt = false,
  glowColor = DEFAULT_GLOW_COLOR,
  clickEffect = true,
  enableMagnetism = true,
}: MagicBentoProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobileDetection();
  const shouldDisableAnimations = disableAnimations || isMobile;
  const glowStyle = { "--glow-color": glowColor } as CSSProperties;

  return (
    <div
      ref={gridRef}
      className={cn(
        "magic-bento-section bento-section relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden",
        className,
      )}
      style={glowStyle}
    >
      {enableSpotlight ? (
        <GlobalSpotlight
          gridRef={gridRef}
          disableAnimations={shouldDisableAnimations}
          enabled={enableSpotlight}
          spotlightRadius={spotlightRadius}
          glowColor={glowColor}
        />
      ) : null}

      <ParticleCard
        className={cn(
          "magic-bento-card flex min-h-0 w-full flex-1 flex-col",
          textAutoHide && "magic-bento-card--text-autohide",
          enableBorderGlow && "magic-bento-card--border-glow",
        )}
        style={glowStyle}
        disableAnimations={shouldDisableAnimations}
        particleCount={particleCount}
        glowColor={glowColor}
        enableStars={enableStars}
        enableTilt={enableTilt}
        clickEffect={clickEffect}
        enableMagnetism={enableMagnetism}
      >
        {children}
      </ParticleCard>
    </div>
  );
}
