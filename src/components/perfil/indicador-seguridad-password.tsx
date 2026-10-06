"use client";

import { CheckIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  evaluarPassword,
  type NivelSeguridadPassword,
  type RequisitoPassword,
} from "@/lib/validaciones/credenciales";

type IndicadorSeguridadPasswordProps = {
  password: string;
};

const COLORES_NIVEL: Record<
  Exclude<NivelSeguridadPassword, "vacía">,
  { barra: string; texto: string }
> = {
  débil: { barra: "bg-error", texto: "text-error" },
  media: { barra: "bg-warning", texto: "text-text-primary" },
  fuerte: { barra: "bg-success", texto: "text-success" },
};

const CLAVES_REQUISITO: Record<
  RequisitoPassword["id"],
  | "passwordMinLength"
  | "passwordUppercase"
  | "passwordNumber"
  | "passwordSpecial"
> = {
  longitud: "passwordMinLength",
  mayuscula: "passwordUppercase",
  numero: "passwordNumber",
  especial: "passwordSpecial",
};

const CLAVES_NIVEL: Record<
  Exclude<NivelSeguridadPassword, "vacía">,
  "passwordWeak" | "passwordMedium" | "passwordStrong"
> = {
  débil: "passwordWeak",
  media: "passwordMedium",
  fuerte: "passwordStrong",
};

export function IndicadorSeguridadPassword({
  password,
}: IndicadorSeguridadPasswordProps) {
  const t = useTranslations("perfil");
  const { requisitos, válidos, nivel } = evaluarPassword(password);

  if (!password) {
    return (
      <ul className="space-y-1.5 rounded-lg border border-border-default bg-bg-subtle px-3 py-2.5">
        {requisitos.map((req) => (
          <li
            key={req.id}
            className="flex items-center gap-2 text-xs text-text-muted"
          >
            <span className="size-3.5 rounded-full border border-border-default" />
            {t(CLAVES_REQUISITO[req.id])}
          </li>
        ))}
      </ul>
    );
  }

  const nivelVisible = nivel === "vacía" ? "débil" : nivel;
  const colores = COLORES_NIVEL[nivelVisible];

  return (
    <div className="space-y-2.5">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-text-muted">
            {t("passwordStrength")}
          </p>
          <p className={cn("text-xs font-semibold", colores.texto)}>
            {t(CLAVES_NIVEL[nivelVisible])}
          </p>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {(["seg-a", "seg-b", "seg-c", "seg-d"] as const).map((id, i) => (
            <div
              key={id}
              className={cn(
                "h-1.5 rounded-full bg-bg-muted transition-colors",
                i < válidos && colores.barra,
              )}
            />
          ))}
        </div>
      </div>

      <ul className="space-y-1.5 rounded-lg border border-border-default bg-bg-subtle px-3 py-2.5">
        {requisitos.map((req) => (
          <li
            key={req.id}
            className={cn(
              "flex items-center gap-2 text-xs",
              req.cumple ? "text-success" : "text-text-muted",
            )}
          >
            {req.cumple ? (
              <CheckIcon className="size-3.5 shrink-0" aria-hidden />
            ) : (
              <XIcon className="size-3.5 shrink-0" aria-hidden />
            )}
            {t(CLAVES_REQUISITO[req.id])}
          </li>
        ))}
      </ul>
    </div>
  );
}
