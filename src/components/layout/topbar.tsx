"use client";

import { LogOutIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogoUnicornio } from "@/components/brand";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { BotonTema } from "@/components/tema";
import { cn } from "@/lib/utils";
import type { SesiónUsuario } from "@/types";
import { PanelNotificaciones } from "./panel-notificaciones";

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase() || "?";
}

// Plan real de la organización (columna organizations.plan) — reemplaza la
// idea de una leyenda/botón genérico de "versión demo": no existe un plan
// "demo" en el modelo de datos real, así que se muestra el plan que sí
// existe. Decisión explícita del dueño (2026-09-30).
const CLAVE_PLAN: Record<string, "planBasic" | "planPro" | "planEnterprise"> = {
  basic: "planBasic",
  pro: "planPro",
  enterprise: "planEnterprise",
};

function BadgePlan({ plan, t }: { plan: string | null; t: ReturnType<typeof useTranslations<"nav">> }) {
  const clave = plan ? CLAVE_PLAN[plan.toLowerCase()] : undefined;
  if (!clave) return null;
  return (
    <span className="hidden shrink-0 items-center rounded-full border border-border-default bg-bg-muted px-2.5 py-1 text-xs font-semibold text-text-secondary sm:inline-flex">
      {t(clave)}
    </span>
  );
}

function AvatarUsuario({ usuario, className }: { usuario: SesiónUsuario; className?: string }) {
  return (
    <Avatar size="default" className={cn("size-8 shrink-0 sm:size-9", className)}>
      <AvatarFallback className="bg-bg-muted text-xs font-semibold text-text-primary">
        {iniciales(usuario.name)}
      </AvatarFallback>
    </Avatar>
  );
}

export function Topbar({ usuario }: { usuario: SesiónUsuario }) {
  const t = useTranslations("nav");
  const tRoles = useTranslations("roles");
  const router = useRouter();

  async function cerrarSesión() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border-default bg-bg-base px-3 sm:h-16 sm:px-5 lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <SidebarTrigger className="text-text-primary" />

        <Link href="/dashboard" className="inline-flex min-w-0 lg:hidden">
          <LogoUnicornio className="h-7 w-auto sm:h-8" priority />
        </Link>
      </div>

      <div className="flex min-w-0 shrink items-center gap-2 sm:gap-4">
        <BadgePlan plan={usuario.plan} t={t} />
        <BotonTema />
        <PanelNotificaciones />

        <Separator orientation="vertical" className="h-8 bg-border-default" />

        <Popover>
          <PopoverTrigger
            aria-label={t("profileMenuAria")}
            className={cn(
              "flex min-w-0 cursor-pointer items-center gap-2 rounded-full sm:gap-3",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            )}
          >
            <AvatarUsuario usuario={usuario} />
            {/* Desktop (≥ lg): nombre + rol visibles junto al avatar */}
            <div className="hidden min-w-0 max-w-[14rem] text-left lg:block">
              <p className="truncate text-sm font-semibold leading-tight text-text-primary">
                {usuario.name}
              </p>
              <p className="truncate text-xs leading-tight text-text-muted">
                {tRoles(usuario.role)}
              </p>
            </div>
          </PopoverTrigger>
          <PopoverContent align="end" sideOffset={10} className="w-56 overflow-hidden p-0">
            <div className="border-b border-border-default/60 px-3 py-3">
              <p className="truncate text-sm font-semibold text-text-primary">{usuario.name}</p>
              <p className="truncate text-xs text-text-muted">{usuario.email}</p>
            </div>
            <Link
              href="/perfil"
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-text-primary transition-colors hover:bg-bg-muted focus-visible:bg-bg-muted focus-visible:outline-none"
            >
              <UserIcon className="size-4 shrink-0 text-text-muted" />
              {t("viewProfile")}
            </Link>
            <button
              type="button"
              onClick={cerrarSesión}
              className="flex w-full items-center gap-2 border-t border-border-default/60 px-3 py-2.5 text-left text-sm text-error transition-colors hover:bg-error/5 focus-visible:bg-error/5 focus-visible:outline-none"
            >
              <LogOutIcon className="size-4 shrink-0" />
              {t("signOut")}
            </button>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
