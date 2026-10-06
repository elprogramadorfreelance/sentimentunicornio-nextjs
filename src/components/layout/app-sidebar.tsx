"use client";

import { BanknoteIcon, BellRingIcon, ChevronDownIcon, FolderIcon, LayoutGridIcon, LifeBuoyIcon, LogOutIcon, MessageSquareIcon, NewspaperIcon, PresentationIcon, ScaleIcon, SearchIcon, SettingsIcon, ShieldCheckIcon, SmileIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ComponentType, SVGProps } from "react";
import { useState } from "react";
import globalLogo from "@/assets/global-logo.webp";
import unicornioLogoMark from "@/assets/unicornio-logo.webp";
import { LogoUnicornio } from "@/components/brand";
import { SelectorProyectosSidebar } from "@/components/layout/selector-proyectos-sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { useTema } from "@/components/tema";
import { MagicBento } from "@/components/ui";

type IconoNav = ComponentType<
  SVGProps<SVGSVGElement> & { title?: string; titleId?: string }
>;

type ClaveEtiquetaNav =
  | "dashboard"
  | "projects"
  | "mentions"
  | "sentiment"
  | "search"
  | "alerts"
  | "narratives"
  | "benchmarking"
  | "infographic"
  | "billing"
  | "support"
  | "settings";

type ItemNav = {
  href: string;
  etiquetaKey: ClaveEtiquetaNav;
  Icono: IconoNav;
  /** Páginas que todavía viven en el sitio anterior (no en esta app Next) — requieren navegación completa, no el router de Next. */
  legado?: boolean;
};

type ClaveTituloSeccion =
  | "sectionHome"
  | "sectionProjects"
  | "sectionSentiment"
  | "sectionMonitoring"
  | "sectionPanorama";

// Rutas marcadas `legado` apuntan a páginas que Bruno aún no construyó en
// esta app — mientras tanto navegan al sitio anterior (mismo dominio, mismo
// backend real) para que ningún link del menú quede muerto.
const SECCIONES_NAV: { tituloKey: ClaveTituloSeccion; items: ItemNav[] }[] = [
  {
    tituloKey: "sectionHome",
    items: [
      { href: "/dashboard", etiquetaKey: "dashboard", Icono: LayoutGridIcon },
    ],
  },
  {
    tituloKey: "sectionProjects",
    items: [
      { href: "/proyectos", etiquetaKey: "projects", Icono: FolderIcon },
      {
        href: "/menciones",
        etiquetaKey: "mentions",
        Icono: MessageSquareIcon,
      },
      // Alertas y Amplificadores comentados del menú a partir de 2026-08-19
      // por decisión del producto (confirmado con el usuario: van a salir
      // de la app, coincide con que la referencia de diseño del 18-08-2026
      // ya no las incluye). Las rutas /alertas, /amplificadores y sus
      // páginas siguen intactas — solo se ocultó el link, nada se borró.
      // { href: "/alertas", etiquetaKey: "alerts", Icono: BellRingIcon },
      // { href: "/amplificadores", etiquetaKey: "amplifiers", Icono: MegaphoneIcon },
    ],
  },
  {
    tituloKey: "sectionSentiment",
    items: [
      { href: "/sentimiento", etiquetaKey: "sentiment", Icono: SmileIcon },
    ],
  },
  {
    tituloKey: "sectionMonitoring",
    items: [
      {
        href: "/monitoreo/busqueda",
        etiquetaKey: "search",
        Icono: SearchIcon,
      },
      {
        href: "/monitoreo/alertas",
        etiquetaKey: "alerts",
        Icono: BellRingIcon,
      },
      {
        href: "/monitoreo/narrativas",
        etiquetaKey: "narratives",
        Icono: NewspaperIcon,
      },
      {
        href: "/monitoreo/benchmarking",
        etiquetaKey: "benchmarking",
        Icono: ScaleIcon,
      },
    ],
  },
  {
    tituloKey: "sectionPanorama",
    items: [
      { href: "/panorama/infografia", etiquetaKey: "infographic", Icono: PresentationIcon },
    ],
  },
  // Sección "Orígenes y Filtros" (Fuentes conectadas, Palabras Clave)
  // comentada del menú a partir de 2026-09-02: la referencia de Bruno del
  // 01-09-2026 ya no la incluye. Las rutas /origenes/fuentes y
  // /origenes/palabras siguen intactas — solo se ocultó el link.
  // {
  //   tituloKey: "sectionOrigins",
  //   items: [
  //     {
  //       href: "/origenes/fuentes",
  //       etiquetaKey: "connectedSources",
  //       Icono: Square2StackIcon,
  //     },
  //     {
  //       href: "/origenes/palabras",
  //       etiquetaKey: "keywords",
  //       Icono: TagIcon,
  //     },
  //   ],
  // },
];

const ITEMS_SECUNDARIOS: ItemNav[] = [
  { href: "/facturacion", etiquetaKey: "billing", Icono: BanknoteIcon },
  { href: "/soporte", etiquetaKey: "support", Icono: LifeBuoyIcon },
  { href: "/settings", etiquetaKey: "settings", Icono: SettingsIcon },
];

// Solo visible para rol "superadmin" — creación de usuarios y consumo real
// de IA por cuenta. Se arma aparte de SECCIONES_NAV porque no todos los
// usuarios deben verla. Sin traducir: la sección está oculta (ver más abajo)
// y no existe en la referencia de Bruno.
const SECCIÓN_ADMIN: { titulo: string; items: { href: string; etiqueta: string; Icono: IconoNav }[] } = {
  titulo: "Administración",
  items: [{ href: "/admin", etiqueta: "Super Usuario", Icono: ShieldCheckIcon }],
};

const GLOW_SKY = "27, 184, 225";
const GLOW_INDIGO = "99, 102, 241";

type AppSidebarProps = {
  rol?: "superadmin" | "admin" | "editor" | "viewer";
};

export function AppSidebar({ rol }: AppSidebarProps) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { resuelto } = useTema();
  const colapsado = state === "collapsed";
  const glowColor = resuelto === "dark" ? GLOW_INDIGO : GLOW_SKY;

  // Oculta temporalmente a partir de 2026-09-09 (pedido explícito) — la
  // ruta /admin y su protección por rol siguen intactas (ver page.tsx),
  // solo no aparece en el menú. Reactivar reemplazando la línea de abajo por:
  // const seccionesNav = rol === "superadmin" ? [...SECCIONES_NAV, SECCIÓN_ADMIN] : SECCIONES_NAV;
  const seccionesNav = SECCIONES_NAV;

  const [seccionesAbiertas, setSeccionesAbiertas] = useState<
    Record<string, boolean>
  >(() =>
    Object.fromEntries(seccionesNav.map((seccion) => [seccion.tituloKey, true])),
  );

  const esActivo = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  function cerrarMenuMobile() {
    if (isMobile) setOpenMobile(false);
  }

  async function cerrarSesion() {
    cerrarMenuMobile();
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/login");
  }
  return (
    <Sidebar collapsible="icon">
      <MagicBento
        textAutoHide
        enableStars
        enableSpotlight
        enableBorderGlow
        enableTilt={false}
        enableMagnetism={false}
        clickEffect
        spotlightRadius={400}
        particleCount={12}
        glowColor={glowColor}
        disableAnimations={isMobile}
      >
      <SidebarHeader className="gap-6 px-2 pt-4 pb-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2">
        <Link
          href="/dashboard"
          className="inline-flex w-fit items-center justify-center mx-auto"
          onClick={cerrarMenuMobile}
        >
          {/* Wordmark expandido: LogoUnicornio ya alterna claro/oscuro según
           * el tema — el sidebar sigue el fondo del tema (--color-bg-base),
           * ya no es navy fijo, así que forzar blanco aquí lo volvía
           * invisible en modo claro. Marca compacta al colapsar, a color. */}
          <span className="inline-flex group-data-[collapsible=icon]:hidden">
            <LogoUnicornio className="h-8 w-auto" priority />
          </span>
          <Image
            src={unicornioLogoMark}
            alt="Unicornio"
            className="hidden size-8 object-contain group-data-[collapsible=icon]:block"
            priority
          />
        </Link>
        <div className="w-full pt-5 group-data-[collapsible=icon]:mt-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
          <SelectorProyectosSidebar />
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0 px-2 py-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:overflow-y-auto group-data-[collapsible=icon]:px-2">
        {seccionesNav.map((seccion) => (
          <Collapsible
            key={seccion.tituloKey}
            open={colapsado ? true : seccionesAbiertas[seccion.tituloKey]}
            onOpenChange={(abierta) => {
              if (colapsado) return;
              setSeccionesAbiertas((prev) => ({
                ...prev,
                [seccion.tituloKey]: abierta,
              }));
            }}
            className="group/collapsible w-full group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center"
          >
            {/* Sin p-2 extra en icon mode: alinea con Soporte / Configuración / Cerrar sesión */}
            <SidebarGroup className="py-1 group-data-[collapsible=icon]:p-0">
              <SidebarGroupLabel
                asChild
                className="h-7 px-2 text-xs font-medium text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden"
              >
                <CollapsibleTrigger className="flex w-full items-center justify-between hover:text-sidebar-foreground">
                  {t(seccion.tituloKey)}
                  <ChevronDownIcon className="size-3.5 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu className="group-data-[collapsible=icon]:items-center">
                    {seccion.items.map(({ href, etiquetaKey, Icono, legado }) => {
                      const etiqueta = t(etiquetaKey);
                      const activo = esActivo(href);
                      return (
                        <SidebarMenuItem
                          key={href}
                          className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center"
                        >
                          <SidebarMenuButton
                            asChild
                            isActive={activo}
                            tooltip={etiqueta}
                            className="h-9 rounded-lg text-sm text-sidebar-foreground group-data-[collapsible=icon]:mx-auto"
                          >
                            {legado ? (
                              <a href={href} onClick={cerrarMenuMobile}>
                                <Icono className="size-4" />
                                <span>{etiqueta}</span>
                              </a>
                            ) : (
                              <Link href={href} onClick={cerrarMenuMobile}>
                                <Icono className="size-4" />
                                <span>{etiqueta}</span>
                              </Link>
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      <SidebarFooter className="gap-1 px-2 pb-3 group-data-[collapsible=icon]:items-center">
        <SidebarSeparator className="mx-0 my-2 bg-border-default/30 group-data-[collapsible=icon]:hidden" />
        <SidebarMenu className="group-data-[collapsible=icon]:items-center">
          {ITEMS_SECUNDARIOS.map(({ href, etiquetaKey, Icono, legado }) => {
            const etiqueta = t(etiquetaKey);
            return (
              <SidebarMenuItem
                key={href}
                className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center"
              >
                <SidebarMenuButton
                  asChild
                  isActive={esActivo(href)}
                  tooltip={etiqueta}
                  className="h-9 rounded-lg text-sm text-sidebar-foreground group-data-[collapsible=icon]:mx-auto"
                >
                  {legado ? (
                    <a href={href} onClick={cerrarMenuMobile}>
                      <Icono className="size-4" />
                      <span>{etiqueta}</span>
                    </a>
                  ) : (
                    <Link href={href} onClick={cerrarMenuMobile}>
                      <Icono className="size-4" />
                      <span>{etiqueta}</span>
                    </Link>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
          <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <SidebarMenuButton
              tooltip={t("signOut")}
              className="h-9 cursor-pointer rounded-lg text-sm text-error hover:bg-error/5 hover:text-error group-data-[collapsible=icon]:mx-auto"
              onClick={cerrarSesion}
            >
              <LogOutIcon className="size-4" />
              <span>{t("signOut")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator className="mx-0 my-2 bg-border-default/30 group-data-[collapsible=icon]:hidden" />

        <div className="flex items-center mx-auto gap-1.5 px-2 py-1 text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
          <span>{tCommon("poweredBy")}</span>
          <Image
            src={globalLogo}
            alt="Global"
            className="h-auto w-auto object-contain dark:brightness-0 dark:invert"
          />
        </div>
      </SidebarFooter>
      </MagicBento>

      <SidebarRail />
    </Sidebar>
  );
}
