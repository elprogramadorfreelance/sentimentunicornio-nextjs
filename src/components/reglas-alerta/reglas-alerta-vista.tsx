"use client";

import { Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Badge,
  Button,
  Card,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@/components/ui";
import {
  apiCrearReglaAlerta,
  apiEliminarReglaAlerta,
  apiReglasAlerta,
} from "@/lib/api";
import type { ReglaAlerta, TipoReglaAlerta } from "@/lib/alert-rules-backend";
import { guardarProyectoRecordado, leerProyectoRecordado } from "@/lib/proyecto-seleccionado";
import { ModalReglaAlerta } from "./modal-regla-alerta";

function formatearDía(iso: string): string {
  const [año, mes, día] = iso.split("-").map(Number);
  return new Date(año, mes - 1, día).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type ReglasAlertaVistaProps = {
  proyectos: { id: string; nombre: string }[];
  proyectoInicialId: string | null;
};

/**
 * CRUD real de alertas configuradas por el usuario ("avísame si aparece esta
 * palabra o narrativa") — guardadas en la tabla real `alert_rules`, evaluadas
 * de verdad por el motor de reglas en cada análisis, con correo real al
 * dispararse. Distinto de /alertas (solo lectura, reglas automáticas del
 * sistema) — esta pantalla es donde el usuario configura las suyas.
 */
export function ReglasAlertaVista({ proyectos, proyectoInicialId }: ReglasAlertaVistaProps) {
  const t = useTranslations("alerts");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [proyectoId, setProyectoId] = useState(proyectoInicialId ?? proyectos[0]?.id ?? null);
  const [reglas, setReglas] = useState<ReglaAlerta[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!proyectoId) return;
    let cancelado = false;
    setReglas(null);
    setError(null);
    apiReglasAlerta(proyectoId)
      .then((respuesta) => {
        if (!cancelado) setReglas(respuesta.reglas);
      })
      .catch((err: unknown) => {
        if (!cancelado) setError(err instanceof Error ? err.message : t("feedLoadError"));
      });
    return () => {
      cancelado = true;
    };
  }, [proyectoId]);

  function cambiarProyecto(valor: string) {
    setProyectoId(valor);
    guardarProyectoRecordado(valor);
    const params = new URLSearchParams();
    params.set("proyecto", valor);
    router.replace(`/monitoreo/alertas?${params.toString()}`, { scroll: false });
  }

  // Sin ?proyecto= explícito en la URL: hereda el último proyecto elegido en
  // cualquier página (en vez del primero de la lista, que era el fallback
  // fijo de antes) — solo cambia si el usuario vuelve a tocar el combo.
  useEffect(() => {
    if (proyectoInicialId) {
      guardarProyectoRecordado(proyectoInicialId);
      return;
    }
    const recordado = leerProyectoRecordado();
    if (recordado && proyectos.some((p) => p.id === recordado) && recordado !== proyectoId) {
      cambiarProyecto(recordado);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyectoInicialId]);

  async function crear(datos: { tipo: TipoReglaAlerta; valor: string; fechaInicio: string; fechaFin: string }) {
    if (!proyectoId) return;
    setGuardando(true);
    try {
      const { regla } = await apiCrearReglaAlerta({ proyectoId, ...datos });
      setReglas((previas) => [regla, ...(previas ?? [])]);
      toast.success(t("configured"), { description: t("configuredDesc") });
      setModalAbierto(false);
    } catch (err) {
      toast.error(t("saveFailedTitle"), {
        description: err instanceof Error ? err.message : tCommon("tryAgain"),
      });
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(regla: ReglaAlerta) {
    if (!proyectoId) return;
    try {
      await apiEliminarReglaAlerta(regla.id, proyectoId);
      setReglas((previas) => (previas ?? []).filter((r) => r.id !== regla.id));
      toast.success(t("deleted"));
    } catch (err) {
      toast.error(t("deleteFailedTitle"), {
        description: err instanceof Error ? err.message : tCommon("tryAgain"),
      });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t("title")}</h1>
          <p className="mt-1 text-sm text-text-muted">{t("rulesSubtitle")}</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end lg:w-auto">
          <div className="w-full sm:w-64">
            <label
              htmlFor="selector-proyecto-reglas"
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-text-muted"
            >
              {tCommon("monitoredProject")}
            </label>
            <Select value={proyectoId ?? undefined} onValueChange={cambiarProyecto}>
              <SelectTrigger id="selector-proyecto-reglas" className="h-10">
                <SelectValue placeholder={t("selectProjectPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {proyectos.map((proyecto) => (
                  <SelectItem key={proyecto.id} value={proyecto.id}>
                    {proyecto.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" disabled={!proyectoId} onClick={() => setModalAbierto(true)}>
            {t("newAlert")}
          </Button>
        </div>
      </header>

      {!proyectoId ? (
        <Card className="bg-bg-base py-8 text-center text-sm text-text-muted">
          {t("needProjectFirst")}
        </Card>
      ) : error ? (
        <Card className="border-error/30 bg-error/5 text-sm text-error">{error}</Card>
      ) : !reglas ? (
        <div className="space-y-3">
          {["a", "b", "c"].map((id) => (
            <Skeleton key={id} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : reglas.length === 0 ? (
        <Card className="bg-bg-base py-8 text-center text-sm text-text-muted">
          {t("emptyRules")}
        </Card>
      ) : (
        <ul className="space-y-2">
          {reglas.map((regla) => (
            <li key={regla.id}>
              <Card className="flex items-start justify-between gap-3 border-l-4 border-l-primary bg-bg-base p-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge variante="default">{regla.tipo === "narrativa" ? t("narrative") : t("keyword")}</Badge>
                    <Badge variante="positivo">{t("emailChannel")}</Badge>
                  </div>
                  <p className="text-sm font-semibold text-text-primary">{regla.valor}</p>
                  {regla.fechaInicio && regla.fechaFin && (
                    <p className="mt-1 text-xs text-text-muted">
                      {formatearDía(regla.fechaInicio)} — {formatearDía(regla.fechaFin)}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("deleteAria", { text: regla.valor })}
                  onClick={() => void eliminar(regla)}
                >
                  <Trash2Icon className="size-4 text-error" />
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <ModalReglaAlerta
        abierto={modalAbierto}
        onAbiertoChange={setModalAbierto}
        guardando={guardando}
        onGuardar={crear}
      />
    </div>
  );
}
