"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import type { TipoReglaAlerta } from "@/lib/alert-rules-backend";

function hoyIso(): string {
  return new Date().toISOString().slice(0, 10);
}
function enUnMesIso(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

type ModalReglaAlertaProps = {
  abierto: boolean;
  onAbiertoChange: (abierto: boolean) => void;
  guardando: boolean;
  onGuardar: (datos: { tipo: TipoReglaAlerta; valor: string; fechaInicio: string; fechaFin: string }) => Promise<void>;
  /** Prellena el valor a vigilar (ej. desde una búsqueda ya hecha) — el usuario igual puede editarlo. */
  valorInicial?: string;
};

/**
 * Solo el canal de correo es real hoy (Brevo ya funciona) — no se ofrece
 * telegram/push como en la referencia de diseño porque prometer un canal que
 * no envía nada sería mentirle al usuario.
 */
export function ModalReglaAlerta({ abierto, onAbiertoChange, guardando, onGuardar, valorInicial = "" }: ModalReglaAlertaProps) {
  const t = useTranslations("alerts");
  const tCommon = useTranslations("common");
  const [tipo, setTipo] = useState<TipoReglaAlerta>("keyword");
  const [valor, setValor] = useState("");
  const [fechaInicio, setFechaInicio] = useState(hoyIso());
  const [fechaFin, setFechaFin] = useState(enUnMesIso());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!abierto) return;
    setTipo("keyword");
    setValor(valorInicial);
    setFechaInicio(hoyIso());
    setFechaFin(enUnMesIso());
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  async function guardar() {
    const texto = valor.trim();
    if (!texto) {
      setError(tipo === "narrativa" ? t("writeNarrative") : t("writeKeyword"));
      return;
    }
    if (fechaFin < fechaInicio) {
      setError(t("endBeforeStart"));
      return;
    }
    setError(null);
    await onGuardar({ tipo, valor: texto, fechaInicio, fechaFin });
  }

  return (
    <Dialog open={abierto} onOpenChange={onAbiertoChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("configureAlert")}</DialogTitle>
          <DialogDescription>{t("ruleModalDesc")}</DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tipo-regla-alerta">{t("type")}</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoReglaAlerta)}>
              <SelectTrigger id="tipo-regla-alerta" className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="keyword">{t("keyword")}</SelectItem>
                <SelectItem value="narrativa">{t("narrative")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="valor-regla-alerta">{tipo === "narrativa" ? t("narrative") : t("keyword")}</Label>
            <Input
              id="valor-regla-alerta"
              value={valor}
              onChange={(e) => {
                setValor(e.target.value);
                if (error) setError(null);
              }}
              placeholder={tipo === "narrativa" ? t("narrativePlaceholderOurs") : t("keywordPlaceholderOurs")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fecha-inicio-regla">{t("dateFrom")}</Label>
              <Input
                id="fecha-inicio-regla"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fecha-fin-regla">{t("dateTo")}</Label>
              <Input id="fecha-fin-regla" type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
            </div>
          </div>

          <p className="text-xs text-text-muted">{t("ruleActiveHint")}</p>

          {error && (
            <p className="text-sm text-error" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="mt-6 gap-2">
          <Button type="button" variant="outline" disabled={guardando} onClick={() => onAbiertoChange(false)}>
            {tCommon("cancel")}
          </Button>
          <Button type="button" disabled={guardando} onClick={() => void guardar()}>
            {guardando ? tCommon("saving") : t("saveAlert")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
