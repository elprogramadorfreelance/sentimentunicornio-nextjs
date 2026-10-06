"use client";

import { ClockIcon, TriangleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { apiEstadoAnalisis } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { EstadoAnalisisProyecto } from "@/types";

const INTERVALO_POLL_MS = 15_000;

function minutosDesdeSegundos(segundos: number): number {
  return Math.max(1, Math.round(segundos / 60));
}

type BannerEstadoAnalisisProps = {
  proyectoId: string;
  /** Se llama cuando el estado pasa a "completo" (o deja de estar en progreso) — el padre puede refrescar el resto del panel sin que el usuario tenga que darle F5. */
  onCompletado?: () => void;
  className?: string;
};

/**
 * El pipeline real (RSS + fuentes vivas + clasificación + síntesis IA) tarda
 * 1-2 minutos tras crear un proyecto o darle "Analizar ahora". Sin esto, el
 * usuario entra de inmediato y ve un proyecto vacío que parece roto — este
 * banner avisa que sigue en proceso real (no inventa un tiempo fijo, usa el
 * tiempo transcurrido real) y desaparece solo cuando termina.
 */
export function BannerEstadoAnalisis({ proyectoId, onCompletado, className }: BannerEstadoAnalisisProps) {
  const t = useTranslations("projects");
  const [estado, setEstado] = useState<EstadoAnalisisProyecto | null>(null);
  const estabaEnProgreso = useRef(false);

  useEffect(() => {
    let cancelado = false;
    let intervalo: ReturnType<typeof setInterval> | undefined;

    async function consultar() {
      const actual = await apiEstadoAnalisis(proyectoId);
      if (cancelado) return;
      setEstado(actual);
      const enProgreso = actual.estado === "en_progreso";
      if (!enProgreso && estabaEnProgreso.current) onCompletado?.();
      estabaEnProgreso.current = enProgreso;
      if (!enProgreso && intervalo) {
        clearInterval(intervalo);
        intervalo = undefined;
      }
    }

    consultar();
    intervalo = setInterval(consultar, INTERVALO_POLL_MS);
    return () => {
      cancelado = true;
      if (intervalo) clearInterval(intervalo);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectoId]);

  if (!estado || estado.estado === "completo" || estado.estado === "sin_datos") return null;

  if (estado.estado === "en_progreso") {
    return (
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-lg border border-warning/40 bg-warning/10 px-3.5 py-2.5 text-sm text-text-primary",
          className,
        )}
      >
        <ClockIcon className="size-4 shrink-0 animate-pulse text-warning" aria-hidden />
        <p>
          <span className="font-semibold">{t("analysisBannerInProgressTitle")}</span>{" "}
          {t("analysisBannerInProgressBody", {
            minutes: t("analysisBannerMinutes", {
              count: minutosDesdeSegundos(estado.iniciadoHaceSegundos),
            }),
          })}
        </p>
      </div>
    );
  }

  // "estancado" o "error" — el pipeline ya no va a avanzar solo.
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg border border-error/40 bg-error/10 px-3.5 py-2.5 text-sm text-text-primary",
        className,
      )}
    >
      <TriangleAlertIcon className="size-4 shrink-0 text-error" aria-hidden />
      <p>
        <span className="font-semibold">
          {estado.estado === "estancado"
            ? t("analysisBannerStalledTitle")
            : t("analysisBannerErrorTitle")}
        </span>{" "}
        {t("analysisBannerFailBody")}
      </p>
    </div>
  );
}
