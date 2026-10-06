"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge, Button, Textarea } from "@/components/ui";
import { apiMisTickets, apiResolverTicket, apiTicketsAdmin } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { TicketSoporte } from "@/types";

type ListaTicketsProps = {
  userId: string;
  esAdmin: boolean;
  recargarTrigger: number;
  className?: string;
};

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
}

function TarjetaTicket({
  ticket,
  esAdmin,
  userId,
  onResuelto,
}: {
  ticket: TicketSoporte;
  esAdmin: boolean;
  userId: string;
  onResuelto: () => void;
}) {
  const t = useTranslations("support");
  const tCommon = useTranslations("common");
  const [resumen, setResumen] = useState("");
  const [resolviendo, setResolviendo] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  async function resolver() {
    if (resumen.trim().length < 5) {
      toast.error(t("resolveMinLength"));
      return;
    }
    setResolviendo(true);
    try {
      await apiResolverTicket(ticket.id, userId, resumen.trim());
      toast.success(t("ticketResolvedToast", { id: ticket.ticket_id }), {
        description: t("ticketResolvedDesc"),
      });
      onResuelto();
    } catch (err) {
      toast.error(t("resolveFailed"), {
        description: err instanceof Error ? err.message : tCommon("tryAgain"),
      });
    } finally {
      setResolviendo(false);
    }
  }

  return (
    <div className="rounded-lg border border-border-default/40 bg-bg-base p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-text-primary">
            {ticket.ticket_id} · {ticket.subject}
          </p>
          <p className="mt-0.5 text-xs text-text-muted">{formatearFecha(ticket.created_at)}</p>
        </div>
        <Badge variante={ticket.status === "resuelto" ? "positivo" : "warning"}>
          {ticket.status === "resuelto" ? t("statusResolved") : t("statusOpen")}
        </Badge>
      </div>

      <p className="mt-3 text-sm text-text-secondary">{ticket.descripcion}</p>

      {ticket.status === "resuelto" && ticket.resolution_summary && (
        <div className="mt-3 rounded-lg border border-success/25 bg-success/5 px-3 py-2.5 text-sm text-text-secondary">
          <span className="font-semibold text-text-primary">
            {t("solutionLabel")}{" "}
          </span>
          {ticket.resolution_summary}
        </div>
      )}

      {esAdmin && ticket.status === "abierto" && (
        <div className="mt-3 border-t border-border-default/40 pt-3">
          {mostrarForm ? (
            <div className="flex flex-col gap-2">
              <Textarea
                rows={2}
                placeholder={t("resolveDescPlaceholder")}
                value={resumen}
                onChange={(e) => setResumen(e.target.value)}
                className="min-h-16"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={resolver} disabled={resolviendo}>
                  {resolviendo ? t("resolving") : t("confirmSolution")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setMostrarForm(false)} disabled={resolviendo}>
                  {tCommon("cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setMostrarForm(true)}>
              {t("markResolved")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function ListaTickets({ userId, esAdmin, recargarTrigger, className }: ListaTicketsProps) {
  const t = useTranslations("support");
  const [tickets, setTickets] = useState<TicketSoporte[] | null>(null);
  const [versionLocal, setVersionLocal] = useState(0);

  useEffect(() => {
    let cancelado = false;
    (esAdmin ? apiTicketsAdmin(userId) : apiMisTickets(userId)).then((datos) => {
      if (!cancelado) setTickets(datos);
    });
    return () => {
      cancelado = true;
    };
  }, [userId, esAdmin, recargarTrigger, versionLocal]);

  if (tickets === null) {
    return <p className={cn("text-sm text-text-muted", className)}>{t("ticketsLoading")}</p>;
  }

  if (tickets.length === 0) {
    return (
      <p className={cn("text-sm text-text-muted", className)}>
        {esAdmin ? t("noTicketsOrg") : t("noTicketsUser")}
      </p>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <h2 className="text-xs font-bold tracking-[0.12em] text-text-muted uppercase">
        {esAdmin ? t("orgTickets") : t("myTickets")}
      </h2>
      {tickets.map((t) => (
        <TarjetaTicket key={t.id} ticket={t} esAdmin={esAdmin} userId={userId} onResuelto={() => setVersionLocal((v) => v + 1)} />
      ))}
    </div>
  );
}
