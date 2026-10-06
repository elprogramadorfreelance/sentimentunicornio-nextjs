"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { ModalEliminarCuenta } from "./modal-eliminar-cuenta";
import { ModalTraspasarCuenta } from "./modal-traspasar-cuenta";

type SeccionZonaRiesgoProps = {
  nombreUsuario: string;
  emailActual: string;
};

export function SeccionZonaRiesgo({ nombreUsuario, emailActual }: SeccionZonaRiesgoProps) {
  const t = useTranslations("perfil");
  const [eliminarAbierto, setEliminarAbierto] = useState(false);
  const [traspasarAbierto, setTraspasarAbierto] = useState(false);

  return (
    <>
      <Card className="border-error/20 bg-bg-base">
        <CardHeader className="mb-3">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-error">
            {t("dangerSection")}
          </CardTitle>
          <h2 className="text-lg font-bold text-text-primary">
            {t("dangerTitle")}
          </h2>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-3 rounded-xl border border-border-default bg-bg-subtle p-4">
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {t("transferTitle")}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                {t("transferBody")}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setTraspasarAbierto(true)}
            >
              {t("transferCta")}
            </Button>
          </div>

          <div className="space-y-3 rounded-xl border border-error/25 bg-error/5 p-4">
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {t("deleteTitle")}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                {t("deleteBody")}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="border-error/40 text-error hover:bg-error/5 hover:text-error"
              onClick={() => setEliminarAbierto(true)}
            >
              {t("deleteCta")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ModalTraspasarCuenta
        abierto={traspasarAbierto}
        onAbiertoChange={setTraspasarAbierto}
        nombreUsuario={nombreUsuario}
        emailActual={emailActual}
      />
      <ModalEliminarCuenta
        abierto={eliminarAbierto}
        onAbiertoChange={setEliminarAbierto}
        nombreUsuario={nombreUsuario}
        emailActual={emailActual}
      />
    </>
  );
}
