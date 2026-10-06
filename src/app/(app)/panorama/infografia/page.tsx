import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { InfografiaVista } from "@/components/infografia";
import { obtenerSesión } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("infografia");
  return { title: t("title") };
}

export const dynamic = "force-dynamic";

export default async function InfografiaPage() {
  // Cuentas plan "basic" (Demo) solo pueden elegir "Últimos 7 días" — pedido
  // explícito del dueño (2026-10-01).
  const sesión = await obtenerSesión();
  return <InfografiaVista soloSieteDías={sesión?.plan === "basic"} />;
}
