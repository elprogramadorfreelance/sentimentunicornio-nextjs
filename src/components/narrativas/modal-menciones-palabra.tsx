"use client";

import { ExternalLinkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import type { MenciónEditorial } from "@/types";

const VARIANTE_SENTIMIENTO: Record<string, "positivo" | "negativo" | "neutral"> = {
  positivo: "positivo",
  negativo: "negativo",
  neutral: "neutral",
};

function esUrlReal(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

type ModalMencionesPalabraProps = {
  palabra: string | null;
  menciones: MenciónEditorial[];
  /** true mientras el llamador trae las menciones bajo demanda (ej. "Principales temas" en /proyectos) — evita que el estado vacío real ("no hay menciones") parpadee como mensaje durante la carga. */
  cargando?: boolean;
  onOpenChange: (abierto: boolean) => void;
};

/** Menciones reales cuyo título o extracto contiene la palabra clave elegida — sin API extra, ya vienen cargadas en la página. */
export function ModalMencionesPalabra({
  palabra,
  menciones,
  cargando = false,
  onOpenChange,
}: ModalMencionesPalabraProps) {
  const t = useTranslations("narratives");
  const tDashboard = useTranslations("dashboard");
  const tMentions = useTranslations("mentions");
  return (
    <Dialog open={!!palabra} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("mentionsWithTerm", { term: palabra ?? "" })}</DialogTitle>
        </DialogHeader>

        {cargando ? (
          <p className="py-6 text-center text-sm text-text-muted">
            {t("modalLoadingMentions")}
          </p>
        ) : menciones.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-muted">
            {t("modalNoMentionsWord")}
          </p>
        ) : (
          <ul className="space-y-2">
            {menciones.slice(0, 30).map((mención) => (
              <li
                key={mención.id}
                className="rounded-lg border border-border-default/40 bg-bg-base p-3"
              >
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge variante={VARIANTE_SENTIMIENTO[mención.sentimiento] ?? "default"}>
                    {mención.sentimiento}
                  </Badge>
                  <span className="text-xs font-medium text-text-secondary">
                    {mención.fuente}
                  </span>
                  <span
                    className="text-[10px] text-text-muted"
                    title={mención.fechaEstimada ? tMentions("estimatedDateTooltip") : undefined}
                  >
                    {mención.fechaEstimada && (
                      <span aria-hidden className="mr-0.5">
                        ~
                      </span>
                    )}
                    {new Date(mención.publicadaEn).toLocaleDateString("es-MX", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                </div>
                <p className="text-sm font-medium text-text-primary">{mención.título}</p>
                {esUrlReal(mención.url) && (
                  <a
                    href={mención.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    {tDashboard("viewOriginal")}
                    <ExternalLinkIcon className="size-3" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
