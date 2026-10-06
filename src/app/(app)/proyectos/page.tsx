import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import {
  DashboardGeneralSkeleton,
  DashboardGeneralVista,
} from "@/components/dashboard-general";
import { obtenerProyectosReales } from "@/lib/proyectos-backend";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("projects");
  return { title: t("title") };
}

/** Panel general de métricas — agregado de todos los proyectos, filtrable vía el selector multi-proyecto del sidebar. */
export default async function ProyectosPage() {
  const { proyectos, resumen } = await obtenerProyectosReales();

  return (
    <Suspense fallback={<DashboardGeneralSkeleton />}>
      <DashboardGeneralVista proyectos={proyectos} resumen={resumen} />
    </Suspense>
  );
}
