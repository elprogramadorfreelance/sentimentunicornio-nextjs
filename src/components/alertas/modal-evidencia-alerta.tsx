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
import { apiEvidenciaAlerta } from "@/lib/api";
import type { MenciónNarrativa } from "@/types";

const VARIANTE_SENTIMIENTO: Record<string, "positivo" | "negativo" | "neutral"> = {
  positivo: "positivo",
  negativo: "negativo",
  neutral: "neutral",
};

// La IA a veces pone el nombre de la fuente ("MILENIO") en vez de una URL
// real en este campo — mostrar eso como link sería engañoso.
function esUrlReal(url: string | null): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

type ModalEvidenciaAlertaProps = {
  alertaId: string | null;
  alertaTítulo: string | null;
  onOpenChange: (abierto: boolean) => void;
};

/**
 * Notas reales detrás de cualquier alerta automática que no sea de narrativa
 * (ver ModalMencionesNarrativa para esas) — sentiment_drop, negative_spike,
 * critical_keywords, sensitive_source, high_risk_amplifier. El backend
 * despacha por el tipo real de la alerta (getAlertEvidence en db.js), así
 * que un resultado chico o vacío es honesto, no un error.
 */
export function ModalEvidenciaAlerta({
  alertaId,
  alertaTítulo,
  onOpenChange,
}: ModalEvidenciaAlertaProps) {
  const t = useTranslations("alerts");
  const tDashboard = useTranslations("dashboard");
  const tNarrativas = useTranslations("narratives");
  const [menciones, setMenciones] = useState<MenciónNarrativa[] | null>(null);

  useEffect(() => {
    if (!alertaId) {
      setMenciones(null);
      return;
    }
    let cancelado = false;
    setMenciones(null);
    apiEvidenciaAlerta(alertaId).then((datos) => {
      if (!cancelado) setMenciones(datos);
    });
    return () => {
      cancelado = true;
    };
  }, [alertaId]);

  return (
    <Dialog open={!!alertaId} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{alertaTítulo ?? t("evidenceTitle")}</DialogTitle>
        </DialogHeader>

        {menciones === null ? (
          <div className="space-y-2">
            {["a", "b", "c"].map((id) => (
              <Skeleton key={id} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : menciones.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-muted">
            {t("modalNoEvidenceGeneral")}
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
                    {mención.source_name || tNarrativas("unknownSource")}
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
                  {mención.title || tNarrativas("untitled")}
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
