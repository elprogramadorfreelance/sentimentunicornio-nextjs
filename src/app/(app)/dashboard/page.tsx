import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { VistaProyectos } from "@/components/proyectos";
import { obtenerProyectosReales } from "@/lib/proyectos-backend";
import { obtenerSesión } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return { title: t("title") };
}

/** Listado CRUD de proyectos con métricas de sentimiento y alertas de crisis — pantalla de inicio. */
export default async function DashboardPage() {
  // true: esta es la lista de tarjetas — a diferencia del selector del panel
  // general (que se recalcula en cada cambio de proyecto), aquí sí vale la
  // pena traer la imagen real de una vez.
  const [{ proyectos, resumen }, sesión, tCommon] = await Promise.all([
    obtenerProyectosReales(true),
    obtenerSesión(),
    getTranslations("common"),
  ]);
  return (
    <VistaProyectos
      proyectosIniciales={proyectos}
      resumenInicial={resumen}
      nombreUsuario={sesión?.name ?? tCommon("userFallback")}
      // Pedido explícito del dueño (2026-10-02): "Analizar conversación"
      // crea un proyecto real saltándose las validaciones del wizard
      // completo — bloqueado para cuentas Demo, mismo criterio ya usado en
      // Búsqueda/Alertas/Facturación/Infografía/Benchmarking.
      esPlanDemo={sesión?.plan === "basic"}
    />
  );
}
