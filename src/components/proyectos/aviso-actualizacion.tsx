"use client";

import { ClockIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { localeBcp47 } from "@/i18n/config";
import { apiEstadoAnalisis } from "@/lib/api";
import { cn } from "@/lib/utils";
import { AvisoFrecuenciaActualizacion } from "./aviso-frecuencia-actualizacion";

const INTERVALO_REFRESCO_MS = 120_000;

/**
 * "Hace X" real a partir de una fecha real — sin Intl.RelativeTimeFormat no
 * hay forma de decir "hace 3 horas" correctamente en ambos idiomas sin
 * armar el plural a mano.
 */
function haceRelativo(iso: string, locale: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const fmt = new Intl.RelativeTimeFormat(localeBcp47(locale), { numeric: "auto" });
  const minutos = Math.round(ms / 60_000);
  if (minutos < 1) return fmt.format(0, "minute");
  if (minutos < 60) return fmt.format(-minutos, "minute");
  const horas = Math.round(minutos / 60);
  if (horas < 24) return fmt.format(-horas, "hour");
  const días = Math.round(horas / 24);
  return fmt.format(-días, "day");
}

type AvisoActualizacionProps = {
  proyectoId: string;
  className?: string;
};

/**
 * Muestra la hora real del último análisis completado (no un número fijo
 * prometido) — y, junto a ella, el ícono de info con la leyenda literal que
 * pidió el cliente (ver AvisoFrecuenciaActualizacion) para quien sí quiera
 * ese detalle. La cadencia real del cron es cada 2h (server.js) y viene
 * completando sin fallos en producción, así que la leyenda ya no falta a la
 * verdad como cuando se evaluó por primera vez.
 */
export function AvisoActualizacion({ proyectoId, className }: AvisoActualizacionProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const [completadoEn, setCompletadoEn] = useState<string | null>(null);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    let cancelado = false;
    async function consultar() {
      try {
        const estado = await apiEstadoAnalisis(proyectoId);
        if (cancelado) return;
        setCompletadoEn("completadoEn" in estado ? estado.completadoEn : null);
      } finally {
        if (!cancelado) setCargado(true);
      }
    }
    consultar();
    const intervalo = setInterval(consultar, INTERVALO_REFRESCO_MS);
    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, [proyectoId]);

  if (!cargado || !completadoEn) return null;

  return (
    <p
      className={cn(
        "flex shrink-0 items-center gap-1.5 text-xs text-text-muted",
        className,
      )}
    >
      <ClockIcon className="size-3.5 shrink-0" aria-hidden />
      {t("lastUpdate", { time: haceRelativo(completadoEn, locale) })}
      <span className="text-text-muted/70">· {t("lastUpdateSupportNote")}</span>
      <AvisoFrecuenciaActualizacion />
    </p>
  );
}
