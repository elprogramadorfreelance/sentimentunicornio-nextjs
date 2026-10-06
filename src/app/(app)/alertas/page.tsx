import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AlertasVista } from "@/components/alertas";
import { PaginaBloqueadaPlan } from "@/components/shared/pagina-bloqueada-plan";
import { obtenerSesión } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("alerts") };
}
export const dynamic = "force-dynamic";

export default async function AlertasPage() {
  // Pedido explícito del dueño (2026-10-01): cuentas plan "basic" (Demo) no
  // tienen Alertas disponible.
  const sesión = await obtenerSesión();
  if (sesión?.plan === "basic") {
    const t = await getTranslations("nav");
    return <PaginaBloqueadaPlan titulo={t("alerts")} />;
  }
  // AlertasVista usa useSearchParams (?resaltar=<id>, desde las
  // notificaciones reales) — Next.js exige un límite Suspense alrededor de
  // cualquier client component que lo use, aunque la página ya sea dinámica.
  return (
    <Suspense fallback={null}>
      <AlertasVista />
    </Suspense>
  );
}
