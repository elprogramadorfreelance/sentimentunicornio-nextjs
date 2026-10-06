"use client";

import { BanknoteIcon, FolderIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Textarea,
} from "@/components/ui";
import { apiSolicitarFacturación } from "@/lib/api";
import { useFacturación } from "@/lib/hooks/use-facturacion";

const PLANES_DISPONIBLES = ["basic", "pro", "enterprise"] as const;

export function VistaFacturación() {
  const t = useTranslations("billing");
  const tCommon = useTranslations("common");
  const NOMBRE_PLAN: Record<string, string> = {
    basic: t("planBasic"),
    pro: t("planPro"),
    enterprise: t("planEnterprise"),
  };
  const { datos, cargando, error, recargar } = useFacturación();
  const [modalCambiar, setModalCambiar] = useState(false);
  const [modalCancelar, setModalCancelar] = useState(false);
  const [planDeseado, setPlanDeseado] = useState<string>("");
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviarSolicitud(tipo: "cambiar_plan" | "cancelar") {
    setEnviando(true);
    try {
      const respuesta = await apiSolicitarFacturación({
        tipo,
        planDeseado: tipo === "cambiar_plan" ? planDeseado || undefined : undefined,
        comentario: comentario.trim() || undefined,
      });
      toast.success(respuesta.mensaje);
      setModalCambiar(false);
      setModalCancelar(false);
      setComentario("");
      setPlanDeseado("");
    } catch (err) {
      toast.error(
        t("requestFailed"),
        { description: err instanceof Error ? err.message : tCommon("tryAgain") },
      );
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) {
    return (
      <div className="space-y-4 p-1">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !datos) {
    return (
      <Card className="bg-bg-base">
        <CardContent className="py-10 text-center text-sm text-text-muted">
          {error ?? t("loadError")}
          <div className="mt-3">
            <Button type="button" variant="outline" size="sm" onClick={recargar}>
              {tCommon("retry")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const nombrePlan = NOMBRE_PLAN[datos.plan] ?? datos.plan;

  return (
    <div className="space-y-4 p-1">
      <Card className="bg-bg-base">
        <CardHeader className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              {t("planSection")}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-text-primary">{nombrePlan}</h2>
              <Badge variante="default">{datos.organización}</Badge>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setModalCambiar(true)}>
            {t("changePlan")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 rounded-xl border border-border-default bg-bg-subtle p-4 sm:grid-cols-2">
            <div className="flex gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FolderIcon className="size-5" aria-hidden />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  {t("activeProjects")}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-text-primary">
                  {datos.proyectosActivos} de {datos.maxProyectos}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BanknoteIcon className="size-5" aria-hidden />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  {t("onlineBilling")}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-text-primary">{t("notYetAvailable")}</p>
              </div>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-text-secondary">{t("noOnlinePaymentsBody")}</p>
        </CardContent>
      </Card>

      <Card className="bg-bg-base">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-text-primary">
            {t("cancelAccountTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-text-secondary">{t("cancelAccountBody")}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => setModalCancelar(true)}>
            {t("requestCancellation")}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={modalCambiar} onOpenChange={setModalCambiar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("changePlanModalTitle")}</DialogTitle>
            <DialogDescription>{t("changePlanModalDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={planDeseado} onValueChange={setPlanDeseado}>
              <SelectTrigger>
                <SelectValue placeholder={t("desiredPlanPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {PLANES_DISPONIBLES.map((id) => (
                  <SelectItem key={id} value={id}>
                    {NOMBRE_PLAN[id]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder={t("commentOptional")}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setModalCambiar(false)}>
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              disabled={enviando || !planDeseado}
              onClick={() => enviarSolicitud("cambiar_plan")}
            >
              {enviando ? tCommon("sending") : t("sendRequest")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modalCancelar} onOpenChange={setModalCancelar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("requestCancellation")}</DialogTitle>
            <DialogDescription>{t("cancelRequestModalDesc")}</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={t("whyCancelPlaceholder")}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setModalCancelar(false)}>
              {t("back")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={enviando}
              onClick={() => enviarSolicitud("cancelar")}
            >
              {enviando ? tCommon("sending") : t("requestCancellation")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
