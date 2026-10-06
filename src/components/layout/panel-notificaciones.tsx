"use client";

import { BellIcon, CheckIcon, XIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui";
import { localeBcp47 } from "@/i18n/config";
import { formatoTiempoRelativo } from "@/lib/formato-tiempo";
import { apiAlertas } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Notificacion } from "@/types";

// Alertas reales (abiertas, de todos los proyectos accesibles) mapeadas a
// notificaciones — antes esto era 100% mock (NOTIFICACIONES_MOCK), por eso
// el click no llevaba a ningún lado: no había un id real detrás. href real
// apunta a /alertas con el id a resaltar (ver alertas-vista.tsx).
const LÍMITE_NOTIFICACIONES = 10;

export function PanelNotificaciones() {
  const t = useTranslations("notifications");
  const tDates = useTranslations("dates");
  const locale = useLocale();
  const router = useRouter();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    let cancelado = false;
    apiAlertas()
      .then(({ alertas }) => {
        if (cancelado) return;
        const reales: Notificacion[] = alertas
          .filter((a) => a.estado === "abierta")
          .slice(0, LÍMITE_NOTIFICACIONES)
          .map((a) => ({
            id: a.id,
            tipo: "alerta",
            título: `${a.proyecto} · ${a.riesgo}`,
            mensaje: a.mensaje,
            creadaEn: a.creadaEn,
            leida: false,
            href: `/alertas?resaltar=${a.id}`,
          }));
        setNotificaciones(reales);
      })
      .catch(() => {
        if (!cancelado) setNotificaciones([]);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const haySinLeer = useMemo(
    () => notificaciones.some((n) => !n.leida),
    [notificaciones],
  );
  const hayNotificaciones = notificaciones.length > 0;
  const sinLeer = useMemo(
    () => notificaciones.filter((n) => !n.leida).length,
    [notificaciones],
  );

  function marcarTodasComoVistas() {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
  }

  function eliminarNotificacion(id: string) {
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));
  }

  function marcarComoVista(id: string) {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n)),
    );
  }

  function abrirNotificación(n: Notificacion) {
    marcarComoVista(n.id);
    if (n.href) {
      setAbierto(false);
      router.push(n.href);
    }
  }

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger
        aria-label={
          haySinLeer ? t("ariaUnread", { count: sinLeer }) : t("title")
        }
        className={cn(
          "relative flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-text-primary transition-colors",
          "hover:bg-bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          "data-[state=open]:bg-bg-muted",
        )}
      >
        <BellIcon className="size-5" />
        {haySinLeer && (
          <span
            className="absolute top-1.5 right-1.5 size-2 rounded-full bg-error ring-2 ring-bg-base"
            aria-hidden
          />
        )}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={10}
        className="flex w-[min(100vw-1.5rem,22rem)] flex-col overflow-hidden p-0 sm:w-[22rem]"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border-default/60 px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-text-primary">
              {t("title")}
            </h2>
            <p className="mt-0.5 text-xs text-text-muted">
              {hayNotificaciones
                ? haySinLeer
                  ? t("unreadCount", { count: sinLeer })
                  : t("allRead")
                : t("emptyHeader")}
            </p>
          </div>
          {haySinLeer && (
            <button
              type="button"
              onClick={marcarTodasComoVistas}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <CheckIcon className="size-3.5" aria-hidden />
              {t("markAll")}
            </button>
          )}
        </header>

        {hayNotificaciones ? (
          <ul className="max-h-[min(24rem,60vh)] divide-y divide-border-default/50 overflow-y-auto">
            {notificaciones.map((n) => (
              <li key={n.id}>
                <article
                  className={cn(
                    "group relative flex gap-3 px-4 py-3 transition-colors",
                    n.leida ? "bg-bg-base" : "bg-primary/[0.04]",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => abrirNotificación(n)}
                    className="min-w-0 flex-1 cursor-pointer text-left focus-visible:outline-none"
                  >
                    <div className="flex items-start gap-2 pr-6">
                      {!n.leida && (
                        <span
                          className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                          aria-hidden
                        />
                      )}
                      <div className={cn("min-w-0", n.leida && "pl-3.5")}>
                        <p
                          className={cn(
                            "text-sm leading-snug text-text-primary",
                            !n.leida && "font-semibold",
                          )}
                        >
                          {n.título}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-text-secondary">
                          {n.mensaje}
                        </p>
                        <p className="mt-1.5 text-[11px] text-text-muted">
                          {formatoTiempoRelativo(
                            n.creadaEn,
                            {
                              now: tDates("now"),
                              minutes: (count) => tDates("minutes", { count }),
                              hours: (count) => tDates("hours", { count }),
                              yesterday: tDates("yesterday"),
                              days: (count) => tDates("days", { count }),
                            },
                            localeBcp47(locale),
                          )}
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    aria-label={t("deleteAria", { title: n.título })}
                    onClick={() => eliminarNotificacion(n.id)}
                    className={cn(
                      "absolute top-2.5 right-2.5 flex size-7 cursor-pointer items-center justify-center rounded-md text-text-muted transition-colors",
                      "hover:bg-bg-muted hover:text-text-primary",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                      "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100",
                    )}
                  >
                    <XIcon className="size-4" />
                  </button>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
            <BellIcon className="size-8 text-text-muted/50" aria-hidden />
            <p className="text-sm font-medium text-text-secondary">
              {t("emptyTitle")}
            </p>
            <p className="text-xs text-text-muted">{t("emptyBody")}</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
