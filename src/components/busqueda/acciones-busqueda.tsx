"use client";

import { BellRingIcon, SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";

type AccionesBusquedaProps = {
  puedeAnalizar: boolean;
  puedeCrearAlertas: boolean;
  generando: boolean;
  onAnalizar: () => void;
  onCrearAlerta: () => void;
};

export function AccionesBusqueda({ puedeAnalizar, puedeCrearAlertas, generando, onAnalizar, onCrearAlerta }: AccionesBusquedaProps) {
  const t = useTranslations("searchPage");
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border-default/60 pt-4">
      <Button type="button" onClick={onAnalizar} disabled={!puedeAnalizar || generando}>
        <SparklesIcon className="size-4" />
        {generando ? t("analyzingWithAi") : t("analyzeConversation")}
      </Button>

      <Button type="button" variant="outline" onClick={onCrearAlerta} disabled={!puedeCrearAlertas}>
        <BellRingIcon className="size-4" />
        {t("createAlert")}
      </Button>
    </div>
  );
}
