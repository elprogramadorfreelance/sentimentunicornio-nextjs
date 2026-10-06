import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BenchmarkingVista } from "@/components/benchmarking";
import { obtenerProyectosReales } from "@/lib/proyectos-backend";
import { obtenerSesión } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("benchmarking");
  return { title: t("title") };
}

export const dynamic = "force-dynamic";

type BenchmarkingPageProps = {
  searchParams: Promise<{ proyectos?: string }>;
};

export default async function BenchmarkingPage({ searchParams }: BenchmarkingPageProps) {
  const { proyectos: proyectosParam } = await searchParams;
  const { proyectos: proyectosReales } = await obtenerProyectosReales();
  const proyectos = proyectosReales.map(({ id, nombre }) => ({ id, nombre }));
  // Cuentas plan "basic" (Demo) solo comparan contra 1 competidor (2
  // proyectos en total) — pedido explícito del dueño (2026-10-01).
  const sesión = await obtenerSesión();
  const máximoProyectos = sesión?.plan === "basic" ? 2 : null;

  const idsVálidos = new Set(proyectos.map((proyecto) => proyecto.id));
  const inicialesSinTope =
    proyectosParam === undefined
      ? proyectos.slice(0, 2).map((proyecto) => proyecto.id)
      : proyectosParam
          .split(",")
          .map((id) => id.trim())
          .filter((id) => idsVálidos.has(id));
  const iniciales =
    máximoProyectos != null ? inicialesSinTope.slice(0, máximoProyectos) : inicialesSinTope;

  return (
    <BenchmarkingVista
      proyectos={proyectos}
      proyectosIniciales={iniciales}
      máximoProyectos={máximoProyectos}
    />
  );
}
