import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BusquedaVista } from "@/components/busqueda";
import { PaginaBloqueadaPlan } from "@/components/shared/pagina-bloqueada-plan";
import { obtenerSesión } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("searchPage");
  return { title: t("title") };
}

export default async function BusquedaPage() {
  // Pedido explícito del dueño (2026-10-01): cuentas plan "basic" (Demo) no
  // tienen Búsqueda disponible.
  const sesión = await obtenerSesión();
  if (sesión?.plan === "basic") {
    const t = await getTranslations("searchPage");
    return <PaginaBloqueadaPlan titulo={t("title")} />;
  }
  return <BusquedaVista />;
}
