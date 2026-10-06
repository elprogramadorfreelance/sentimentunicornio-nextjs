"use client";

import { InfoIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const STORAGE_KEY = "unicornio.disclaimer-data-historica";

export function DisclaimerDataHistorica() {
  const t = useTranslations("dates");
  const tCommon = useTranslations("common");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(window.localStorage.getItem(STORAGE_KEY) !== "1");
  }, []);

  function cerrar() {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="mb-3 flex items-start gap-2 rounded-md border border-border-default/40 bg-bg-muted/80 px-3 py-2 text-xs text-text-secondary">
      <InfoIcon
        className="mt-0.5 size-4 shrink-0 text-text-muted"
        aria-hidden
      />
      <p className="min-w-0 flex-1 leading-snug">
        {t("historicalDisclaimer")}{" "}
        <Link
          href="/soporte"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          {t("historicalDisclaimerCta")}
        </Link>
      </p>
      <button
        type="button"
        onClick={cerrar}
        className="shrink-0 rounded-md p-0.5 text-text-muted hover:bg-bg-base hover:text-text-primary"
        aria-label={t("historicalDisclaimerDismiss")}
      >
        <XIcon className="size-4" />
        <span className="sr-only">{tCommon("close")}</span>
      </button>
    </div>
  );
}
