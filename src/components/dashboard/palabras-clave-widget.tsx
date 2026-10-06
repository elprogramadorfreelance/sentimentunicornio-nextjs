"use client";

import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { CardTitleBar } from "@/components/ui/card-title-bar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type SentimientoPalabra = "Positivo" | "Neutro" | "Negativo";

const SENTIMIENTO_BADGE: Record<
  SentimientoPalabra,
  "positivo" | "neutral" | "negativo"
> = {
  Positivo: "positivo",
  Neutro: "neutral",
  Negativo: "negativo",
};

export type PalabraClaveWidgetItem = {
  palabra: string;
  efectividad: SentimientoPalabra;
};

/** Hardcoded: palabras clave del proyecto actual. */
const PALABRAS_CLAVE_MOCK: PalabraClaveWidgetItem[] = [
  { palabra: "Liderazgo", efectividad: "Positivo" },
  { palabra: "Dirección", efectividad: "Neutro" },
  { palabra: "Apoyo", efectividad: "Negativo" },
  { palabra: "Bienestar", efectividad: "Positivo" },
];

type PalabrasClaveWidgetProps = {
  className?: string;
  palabras?: PalabraClaveWidgetItem[];
};

export function PalabrasClaveWidget({
  className,
  palabras = PALABRAS_CLAVE_MOCK,
}: PalabrasClaveWidgetProps) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");

  const etiquetaSentimiento: Record<SentimientoPalabra, string> = {
    Positivo: tCommon("positive"),
    Neutro: tCommon("neutralShort"),
    Negativo: tCommon("negative"),
  };

  return (
    <section
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border-default/30 bg-bg-base p-2.5 shadow-widget sm:p-3",
        className,
      )}
      aria-label={t("keywords")}
    >
      <CardTitleBar bleed="sm">{t("keywords")}</CardTitleBar>

      <div className="mt-1.5 min-h-0 flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-7">{t("keyword")}</TableHead>
              <TableHead className="h-7 text-right">
                {tCommon("sentiment")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {palabras.map(({ palabra, efectividad }) => (
              <TableRow key={palabra}>
                <TableCell className="py-1.5 text-xs text-text-primary">
                  {palabra}
                </TableCell>
                <TableCell className="py-1.5 text-right">
                  <Badge variante={SENTIMIENTO_BADGE[efectividad]}>
                    {etiquetaSentimiento[efectividad]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Link
        href="/origenes/palabras"
        className="group mt-1.5 inline-flex w-fit shrink-0 items-center gap-1 rounded text-[11px] font-medium text-text-muted transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {tCommon("seeMore")}
        <ArrowRightIcon className="size-3 transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>
    </section>
  );
}
