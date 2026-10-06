"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LogoUnicornio } from "@/components/brand";
import { BotonTema, SelectorIdiomaBanderas } from "@/components/tema";
import {
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavBody,
  Navbar,
  NavbarButton,
  NavItems,
} from "@/components/ui";

const CLASE_SELECTOR_IDIOMA =
  "h-9 w-11 rounded-xl border-transparent bg-transparent hover:bg-bg-muted";

export function NavbarLanding() {
  const t = useTranslations("landing");
  const [menuAbierto, setMenuAbierto] = useState(false);

  const enlaces = [
    { name: t("navAudiences"), link: "#audiencias" },
    { name: t("navPlans"), link: "#planes" },
    { name: t("navAddons"), link: "#addons" },
    { name: t("navContact"), link: "#contacto" },
  ];

  return (
    <Navbar>
      <NavBody>
        <Link
          href="/"
          className="relative z-20 mr-4 inline-flex shrink-0 px-2 py-1"
        >
          <LogoUnicornio className="h-7 w-auto" priority />
        </Link>
        <NavItems items={enlaces} />
        <div className="relative z-20 flex items-center gap-1">
          <SelectorIdiomaBanderas className={CLASE_SELECTOR_IDIOMA} />
          <BotonTema />
          <NavbarButton href="/login" as={Link}>
            {t("navLogin")}
          </NavbarButton>
        </div>
      </NavBody>

      <MobileNav>
        <MobileNavHeader>
          <Link
            href="/"
            className="relative z-20 inline-flex shrink-0 px-2 py-1"
          >
            <LogoUnicornio className="h-7 w-auto" priority />
          </Link>
          <div className="flex items-center gap-1">
            <SelectorIdiomaBanderas className={CLASE_SELECTOR_IDIOMA} />
            <BotonTema />
            <MobileNavToggle
              isOpen={menuAbierto}
              onClick={() => setMenuAbierto((abierto) => !abierto)}
              openLabel={t("mobileMenuOpen")}
              closeLabel={t("mobileMenuClose")}
            />
          </div>
        </MobileNavHeader>
        <MobileNavMenu
          isOpen={menuAbierto}
          onClose={() => setMenuAbierto(false)}
        >
          {enlaces.map((enlace) => (
            <a
              key={enlace.link}
              href={enlace.link}
              className="w-full rounded-sm p-2 text-text-primary hover:bg-bg-muted hover:text-indigo-500 dark:hover:text-sky"
              onClick={() => setMenuAbierto(false)}
            >
              {enlace.name}
            </a>
          ))}
          <NavbarButton
            href="/login"
            as={Link}
            onClick={() => setMenuAbierto(false)}
            className="w-full"
          >
            {t("navLogin")}
          </NavbarButton>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}
