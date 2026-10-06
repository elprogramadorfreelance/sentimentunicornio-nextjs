"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import type { ConsumoUsuario } from "@/types";

type TablaConsumoProps = {
  consumo: ConsumoUsuario[];
};

export function TablaConsumo({ consumo }: TablaConsumoProps) {
  const t = useTranslations("admin");
  const totalEventos = consumo.reduce((s, c) => s + c.eventos, 0);
  const totalEntrada = consumo.reduce((s, c) => s + c.tokens_entrada, 0);
  const totalSalida = consumo.reduce((s, c) => s + c.tokens_salida, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t("aiCallsTotal")}
          </p>
          <p className="mt-1 text-2xl font-bold text-text-primary">
            {totalEventos.toLocaleString("es-MX")}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t("tokensIn")}
          </p>
          <p className="mt-1 text-2xl font-bold text-text-primary">
            {totalEntrada.toLocaleString("es-MX")}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t("tokensOut")}
          </p>
          <p className="mt-1 text-2xl font-bold text-text-primary">
            {totalSalida.toLocaleString("es-MX")}
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("userHeader")}</TableHead>
              <TableHead>{t("email")}</TableHead>
              <TableHead className="text-right">{t("aiCalls")}</TableHead>
              <TableHead className="text-right">{t("tokensInShort")}</TableHead>
              <TableHead className="text-right">{t("tokensOutShort")}</TableHead>
              <TableHead>{t("lastUsed")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consumo.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-text-muted">
                  {t("noUsageData")}
                </TableCell>
              </TableRow>
            ) : (
              consumo.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-text-primary">{c.name}</TableCell>
                  <TableCell className="text-text-secondary">{c.email}</TableCell>
                  <TableCell className="text-right tabular-nums text-text-primary">
                    {c.eventos.toLocaleString("es-MX")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-text-secondary">
                    {c.tokens_entrada.toLocaleString("es-MX")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-text-secondary">
                    {c.tokens_salida.toLocaleString("es-MX")}
                  </TableCell>
                  <TableCell className="text-text-muted">
                    {c.ultimo_uso
                      ? new Date(c.ultimo_uso).toLocaleString("es-MX", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : t("neverUsed")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
