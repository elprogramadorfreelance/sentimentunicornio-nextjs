"use client";

import { StarIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { localeBcp47 } from "@/i18n/config";
import { cn } from "@/lib/utils";
import type { MétricasProyectoBenchmarking } from "@/types";

type MejorDirección = "mayor" | "menor";

type EtiquetaMétrica =
  | "metricTotalMentions"
  | "metricSocialMentions"
  | "metricOffSocialMentions"
  | "metricPositiveMentions"
  | "metricNegativeMentions"
  | "metricSocialReach"
  | "metricOffSocialReach"
  | "metricUgc";

type FilaMétrica = {
  etiquetaKey: EtiquetaMétrica;
  dirección: MejorDirección;
  valor: (m: MétricasProyectoBenchmarking) => number;
  formatear: (m: MétricasProyectoBenchmarking, bcp47: string) => string;
};

// Mismas filas que la referencia de Bruno, menos "Presence Score" y "AVE"
// (Advertising Value Equivalency) — son métricas de PR que requieren una
// fórmula propia o tarifas publicitarias reales que no tenemos.
const FILAS: FilaMétrica[] = [
  {
    etiquetaKey: "metricTotalMentions",
    dirección: "mayor",
    valor: (m) => m.mencionesTotales,
    formatear: (m, bcp47) => m.mencionesTotales.toLocaleString(bcp47),
  },
  {
    etiquetaKey: "metricSocialMentions",
    dirección: "mayor",
    valor: (m) => m.mencionesRedesSociales,
    formatear: (m, bcp47) => m.mencionesRedesSociales.toLocaleString(bcp47),
  },
  {
    etiquetaKey: "metricOffSocialMentions",
    dirección: "mayor",
    valor: (m) => m.mencionesFueraRedes,
    formatear: (m, bcp47) => m.mencionesFueraRedes.toLocaleString(bcp47),
  },
  {
    etiquetaKey: "metricPositiveMentions",
    dirección: "mayor",
    valor: (m) => m.mencionesPositivasPorcentaje,
    formatear: (m, bcp47) =>
      `${m.mencionesPositivasPorcentaje.toLocaleString(bcp47)}% (${m.mencionesPositivas.toLocaleString(bcp47)})`,
  },
  {
    etiquetaKey: "metricNegativeMentions",
    dirección: "menor",
    valor: (m) => m.mencionesNegativasPorcentaje,
    formatear: (m, bcp47) =>
      `${m.mencionesNegativasPorcentaje.toLocaleString(bcp47)}% (${m.mencionesNegativas.toLocaleString(bcp47)})`,
  },
  {
    etiquetaKey: "metricSocialReach",
    dirección: "mayor",
    valor: (m) => m.alcanceRedesSociales,
    formatear: (m, bcp47) => m.alcanceRedesSociales.toLocaleString(bcp47, { notation: "compact" }),
  },
  {
    etiquetaKey: "metricOffSocialReach",
    dirección: "mayor",
    valor: (m) => m.alcanceFueraRedes,
    formatear: (m, bcp47) => m.alcanceFueraRedes.toLocaleString(bcp47, { notation: "compact" }),
  },
  {
    etiquetaKey: "metricUgc",
    dirección: "mayor",
    valor: (m) => m.contenidoGeneradoUsuarios,
    formatear: (m, bcp47) => m.contenidoGeneradoUsuarios.toLocaleString(bcp47),
  },
];

function mejorÍndice(proyectos: MétricasProyectoBenchmarking[], fila: FilaMétrica): number | null {
  if (proyectos.length < 2) return null;
  let mejor = 0;
  for (let i = 1; i < proyectos.length; i++) {
    const actual = fila.valor(proyectos[i]);
    const previo = fila.valor(proyectos[mejor]);
    if ((fila.dirección === "mayor" && actual > previo) || (fila.dirección === "menor" && actual < previo)) {
      mejor = i;
    }
  }
  return mejor;
}

type TablaComparativaBenchmarkingProps = {
  proyectos: MétricasProyectoBenchmarking[];
};

export function TablaComparativaBenchmarking({ proyectos }: TablaComparativaBenchmarkingProps) {
  const t = useTranslations("benchmarking");
  const locale = useLocale();
  const bcp47 = localeBcp47(locale);

  return (
    <Card className="bg-bg-base p-4 shadow-widget">
      <CardHeader className="mb-3">
        <CardTitle className="font-semibold text-text-primary">{t("overviewTitle")}</CardTitle>
        <p className="mt-1 text-xs text-text-muted">{t("overviewHelp")}</p>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("colMetric")}</TableHead>
              {proyectos.map((proyecto) => (
                <TableHead key={proyecto.proyectoId}>
                  <span className="flex items-center gap-1.5 normal-case">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: proyecto.color }}
                      aria-hidden
                    />
                    <span className="truncate font-semibold text-text-secondary">{proyecto.nombre}</span>
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {FILAS.map((fila) => {
              const índiceMejor = mejorÍndice(proyectos, fila);
              return (
                <TableRow key={fila.etiquetaKey}>
                  <TableCell className="text-text-secondary">{t(fila.etiquetaKey)}</TableCell>
                  {proyectos.map((proyecto, índice) => (
                    <TableCell
                      key={proyecto.proyectoId}
                      className={cn(
                        "tabular-nums",
                        índice === índiceMejor ? "font-semibold text-text-primary" : "text-text-secondary",
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        {fila.formatear(proyecto, bcp47)}
                        {índice === índiceMejor && (
                          <StarIcon className="size-3 shrink-0 text-warning" aria-hidden />
                        )}
                      </span>
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
