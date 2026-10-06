import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { VistaFacturación } from "@/components/facturacion";
import { PaginaBloqueadaPlan } from "@/components/shared/pagina-bloqueada-plan";
import { obtenerSesión } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("billing");
  return { title: t("title") };
}
export const dynamic = "force-dynamic";

export default async function FacturaciónPage() {
  // Pedido explícito del dueño (2026-10-01): cuentas plan "basic" (Demo) no
  // tienen Facturación disponible.
  const sesión = await obtenerSesión();
  if (sesión?.plan === "basic") {
    const t = await getTranslations("billing");
    return <PaginaBloqueadaPlan titulo={t("title")} />;
  }
  return <VistaFacturación />;
}
