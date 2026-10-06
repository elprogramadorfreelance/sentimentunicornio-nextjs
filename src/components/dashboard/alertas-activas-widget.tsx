"use client";

import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ModalEvidenciaAlerta } from "@/components/alertas";
import { ModalMencionesNarrativa } from "@/components/narrativas";
import { CardTitleBar } from "@/components/ui";
import type { AlertaPanel } from "@/lib/mock/metricas-panel";
import { cn } from "@/lib/utils";

type NivelAlerta = AlertaPanel["nivel"];

const ESTILO_NIVEL: Record<NivelAlerta, string> = {
  critica: "border-l-error",
  advertencia: "border-l-warning",
  info: "border-l-sky",
};

const ALERTAS_DEFAULT: AlertaPanel[] = [
  {
    id: "a1",
    nivel: "critica",
    mensaje: "Se han presentado 3 comentarios negativos",
  },
  {
    id: "a2",
    nivel: "advertencia",
    mensaje: "Se debe verificar la fuente de esta noticia",
  },
  {
    id: "a3",
    nivel: "info",
    mensaje: "El volumen de menciones superó el umbral diario",
  },
];

type AlertasActivasWidgetProps = {
  className?: string;
  alertas?: AlertaPanel[];
};

export function AlertasActivasWidget({
  className,
  alertas = ALERTAS_DEFAULT,
}: AlertasActivasWidgetProps) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const criticas = alertas.filter((a) => a.nivel === "critica").length;
  // Reintentado 2026-10-02 — ver comentario en alertas-vista.tsx: el backend
  // ya filtra, así que toda alerta de narrativa que llega aquí tiene
  // evidencia real.
  const [narrativaAbierta, setNarrativaAbierta] = useState<{ id: string; nombre: string } | null>(null);
  // "evidencia" (2026-10-02): el resto de tipos de alerta abren el modal
  // genérico — ver ModalEvidenciaAlerta.
  const [evidenciaAbierta, setEvidenciaAbierta] = useState<{ id: string; título: string } | null>(null);

  return (
    <section
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border-default/30 bg-bg-base p-2.5 shadow-widget sm:p-3",
        className,
      )}
      aria-label={t("repAlerts")}
    >
      <header className="mb-1.5 flex shrink-0 items-center justify-between gap-2">
        <CardTitleBar bleed="sm">{t("repAlerts")}</CardTitleBar>
        {criticas > 0 && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-error">
            <span
              className="size-1.5 shrink-0 rounded-full bg-error"
              aria-hidden
            />
            {t("criticalCount", { count: criticas })}
          </span>
        )}
      </header>

      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5">
        {alertas.map(({ id, nivel, mensaje, enlace }) => (
          <li
            key={id}
            className={cn(
              "shrink-0 rounded-md border-l-4 bg-bg-subtle px-2.5 py-1.5",
              ESTILO_NIVEL[nivel],
            )}
          >
            {enlace ? (
              <button
                type="button"
                onClick={() =>
                  enlace.destino === "narrativas"
                    ? setNarrativaAbierta({ id: enlace.id, nombre: mensaje })
                    : setEvidenciaAbierta({ id: enlace.id, título: mensaje })
                }
                className="block w-full text-left text-sm leading-snug text-text-primary hover:underline"
              >
                {mensaje}
              </button>
            ) : (
              <p className="text-sm leading-snug text-text-primary">{mensaje}</p>
            )}
          </li>
        ))}
      </ul>

      <Link
        href="/alertas"
        className="group mt-1.5 inline-flex w-fit shrink-0 items-center gap-1 rounded text-[11px] font-medium text-text-muted transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {tCommon("seeMore")}
        <ArrowRightIcon className="size-3 transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>

      <ModalMencionesNarrativa
        narrativaId={narrativaAbierta?.id ?? null}
        narrativaNombre={narrativaAbierta?.nombre ?? null}
        onOpenChange={(abierto) => {
          if (!abierto) setNarrativaAbierta(null);
        }}
      />
      <ModalEvidenciaAlerta
        alertaId={evidenciaAbierta?.id ?? null}
        alertaTítulo={evidenciaAbierta?.título ?? null}
        onOpenChange={(abierto) => {
          if (!abierto) setEvidenciaAbierta(null);
        }}
      />
    </section>
  );
}
