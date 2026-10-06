"use client";

import { CrownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { cn } from "@/lib/utils";

type AvisoLimitePlanProps = {
  días: number;
  className?: string;
};

/**
 * Aviso real (no decorativo) de que la cuenta plan "basic" solo ve los
 * últimos N días — el backend YA acotó los datos (ver
 * aplicarLímiteHistóricoPlan en lib/session.ts), esto solo explica por qué
 * al usuario en vez de dejarlo adivinar. Solo se renderiza cuando el
 * backend confirmó que de verdad aplicó el límite (`límiteHistórico.activo`
 * desde la respuesta real), nunca a priori por el plan solo — así cuentas
 * pro/enterprise nunca lo ven.
 */
export function AvisoLimitePlan({ días, className }: AvisoLimitePlanProps) {
  const t = useTranslations("common");

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-text-secondary",
        className,
      )}
    >
      <CrownIcon className="size-4 shrink-0 text-warning" aria-hidden />
      <p className="min-w-0 flex-1 leading-snug">
        {t("planLimitNotice", { days: días })}{" "}
        <Link
          href="/soporte"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          {t("planLimitCta")}
        </Link>
      </p>
    </div>
  );
}
