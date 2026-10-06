"use client";

import { ExternalLinkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from "@/components/ui";
import { apiMencionesHashtag } from "@/lib/api";
import type { MenciónNarrativa } from "@/types";

const VARIANTE_SENTIMIENTO: Record<string, "positivo" | "negativo" | "neutral"> = {
  positivo: "positivo",
  negativo: "negativo",
  neutral: "neutral",
};

function esUrlReal(url: string | null): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

type ModalMencionesHashtagProps = {
  hashtag: string | null;
  proyectoIds: string[];
  onOpenChange: (abierto: boolean) => void;
};

/**
 * Menciones reales del mismo análisis que generó este hashtag (el hashtag es
 * un dato a nivel de análisis, no de publicación — ver server.js). Cuando el
 * filtro es "todos los proyectos" se consulta uno por proyecto y se combinan,
 * igual que en la lista de hashtags de arriba.
 */
export function ModalMencionesHashtag({
  hashtag,
  proyectoIds,
  onOpenChange,
}: ModalMencionesHashtagProps) {
  const t = useTranslations("narratives");
  const tDashboard = useTranslations("dashboard");
  const [menciones, setMenciones] = useState<MenciónNarrativa[] | null>(null);

  useEffect(() => {
    if (!hashtag) {
      setMenciones(null);
      return;
    }
    let cancelado = false;
    setMenciones(null);
    Promise.all(proyectoIds.map((id) => apiMencionesHashtag(id, hashtag))).then((listas) => {
      if (!cancelado) setMenciones(listas.flat());
    });
    return () => {
      cancelado = true;
    };
  }, [hashtag, proyectoIds]);

  return (
    <Dialog open={!!hashtag} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("usagePhrase", { term: hashtag ?? "" })}</DialogTitle>
        </DialogHeader>

        {menciones === null ? (
          <div className="space-y-2">
            {["a", "b", "c"].map((id) => (
              <Skeleton key={id} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : menciones.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-muted">
            {t("modalNoEvidenceHashtag")}
          </p>
        ) : (
          <ul className="space-y-2">
            {menciones.map((mención) => (
              <li
                key={mención.id}
                className="rounded-lg border border-border-default/40 bg-bg-base p-3"
              >
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  {mención.sentiment && (
                    <Badge variante={VARIANTE_SENTIMIENTO[mención.sentiment] ?? "default"}>
                      {mención.sentiment}
                    </Badge>
                  )}
                  <span className="text-xs font-medium text-text-secondary">
                    {mención.source_name || t("unknownSource")}
                  </span>
                  {mención.published_at && (
                    <span className="text-[10px] text-text-muted">
                      {new Date(mención.published_at).toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-text-primary">
                  {mención.title || t("untitled")}
                </p>
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
