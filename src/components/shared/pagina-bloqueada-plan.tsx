import { LockIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";

type PaginaBloqueadaPlanProps = {
  titulo: string;
};

/**
 * Página completa bloqueada para cuentas plan "basic" (Demo) — pedido
 * explícito del dueño: Alertas, Búsqueda y Facturación quedan marcadas "No
 * disponible" en cuentas demo. Mismo espíritu que PaginaEnConstruccion
 * (honesto, con CTA real a /facturacion en vez de solo un mensaje).
 */
export function PaginaBloqueadaPlan({ titulo }: PaginaBloqueadaPlanProps) {
  const t = useTranslations("common");
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-bg-subtle">
        <LockIcon className="size-7 text-text-muted" aria-hidden />
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
        {t("planLockedBadge")}
      </span>
      <h1 className="text-xl font-bold text-text-primary">{titulo}</h1>
      <p className="max-w-md text-sm text-text-muted">{t("planLockedBody")}</p>
      <Button asChild size="sm" className="mt-1">
        <Link href="/soporte">{t("planLockedCta")}</Link>
      </Button>
    </div>
  );
}
