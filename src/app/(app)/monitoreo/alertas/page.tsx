import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ReglasAlertaVista } from "@/components/reglas-alerta";
import { PaginaBloqueadaPlan } from "@/components/shared/pagina-bloqueada-plan";
import { obtenerProyectosReales } from "@/lib/proyectos-backend";
import { obtenerSesión } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("alerts") };
}
export const dynamic = "force-dynamic";

type AlertasMonitoreoPageProps = {
  searchParams: Promise<{ proyecto?: string }>;
};

export default async function AlertasMonitoreoPage({ searchParams }: AlertasMonitoreoPageProps) {
  // Pedido explícito del dueño (2026-10-01): cuentas plan "basic" (Demo) no
  // tienen Alertas disponible. El bloqueo original (E22) se puso en
  // /alertas (page.tsx), pero esa ruta está oculta del sidebar desde
  // 2026-08-19 — el link real que usan los usuarios es este,
  // "/monitoreo/alertas" (sección Monitoreo), que se quedó sin el gate
  // (bug real reportado por el cliente, 2026-10-01: una cuenta Demo podía
  // entrar y usar "Nueva alerta" con total normalidad).
  const sesión = await obtenerSesión();
  if (sesión?.plan === "basic") {
    const t = await getTranslations("nav");
    return <PaginaBloqueadaPlan titulo={t("alerts")} />;
  }

  const { proyecto: proyectoParam } = await searchParams;
  const { proyectos: proyectosReales } = await obtenerProyectosReales();
  const proyectos = proyectosReales.map(({ id, nombre }) => ({ id, nombre }));
  const proyectoInicialId =
    proyectoParam && proyectos.some((proyecto) => proyecto.id === proyectoParam)
      ? proyectoParam
      : null;

  return <ReglasAlertaVista proyectos={proyectos} proyectoInicialId={proyectoInicialId} />;
}
