"use client";

import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import videoEnd from "@/assets/video_end.png";
import videoStart from "@/assets/video_start.png";
import { VIDEO_HERO_DASHBOARD } from "@/lib/video-landing";

const DELAY_INICIO_MS = 500;
const TRANSICION = { duration: 0.3 };
const TAMANOS = "(min-width: 1280px) 80vw, 100vw";

type FaseVideo = "inicio" | "video" | "fin";

type HeroVideoLandingProps = {
  alt: string;
};

export function HeroVideoLanding({ alt }: HeroVideoLandingProps) {
  const marcoRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iniciadoRef = useRef(false);
  const enVista = useInView(marcoRef, { amount: 0.35, once: false });
  const reducirMovimiento = useReducedMotion();
  const [fase, setFase] = useState<FaseVideo>("inicio");

  useEffect(() => {
    if (reducirMovimiento || fase === "fin" || iniciadoRef.current) {
      return;
    }
    if (!enVista) {
      return;
    }

    const id = window.setTimeout(() => {
      iniciadoRef.current = true;
      setFase("video");
    }, DELAY_INICIO_MS);

    return () => window.clearTimeout(id);
  }, [enVista, fase, reducirMovimiento]);

  useEffect(() => {
    if (fase !== "video") {
      return;
    }
    const el = videoRef.current;
    if (!el) {
      return;
    }
    if (enVista) {
      void el.play().catch(() => undefined);
    } else {
      el.pause();
    }
  }, [enVista, fase]);

  return (
    <div ref={marcoRef} className="relative w-full overflow-hidden rounded-2xl">
      <Image
        src={videoStart}
        alt={alt}
        className="w-full rounded-2xl"
        sizes={TAMANOS}
        priority
      />
      <AnimatePresence>
        {fase === "video" && (
          <motion.div
            key="video"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={TRANSICION}
          >
            <video
              ref={videoRef}
              src={VIDEO_HERO_DASHBOARD.src}
              muted
              playsInline
              preload="auto"
              aria-hidden
              className="h-full w-full rounded-2xl object-cover"
              onEnded={() => setFase("fin")}
            />
          </motion.div>
        )}
        {fase === "fin" && (
          <motion.div
            key="fin"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={TRANSICION}
          >
            <Image
              src={videoEnd}
              alt=""
              fill
              className="rounded-2xl object-cover"
              sizes={TAMANOS}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
