"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";

/**
 * Mismo aviso que `AvisoMotoresIa` (mismo texto, punto 1 de los
 * requerimientos de plataforma) pero se abre solo, sin que nadie haga clic
 * en el ícono — pedido explícito del cliente: primero "que salte el
 * lightbox al iniciar", después "quiero que siempre se muestre en el
 * dashboard, siempre" (2026-09-29, repetido dos veces). Se monta solo en
 * `/dashboard` (VistaProyectos, la pantalla real a la que cae el usuario
 * justo después de iniciar sesión) y se abre en CADA visita a esa pantalla,
 * sin sessionStorage ni ningún otro recordatorio — a propósito, es lo que
 * pidió el cliente, no una elección de UX de esta app.
 */
export function AvisoMotoresIaInicio() {
  const t = useTranslations("common");
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    setAbierto(true);
  }, []);

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("aiDisclaimerTitle")}</DialogTitle>
          <DialogDescription>{t("aiDisclaimerBody")}</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
