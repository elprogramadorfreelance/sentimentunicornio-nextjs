import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MencionesDetalleVista } from "@/components/menciones";
import { obtenerProyectosReales } from "@/lib/proyectos-backend";
import type { CategoríaSentimiento } from "@/types";

export const dynamic = "force-dynamic";

type MencionesDetallePageProps = {
  searchParams: Promise<{ proyecto?: string; sentimiento?: string }>;
};

export async function generateMetadata({
  searchParams,
}: MencionesDetallePageProps): Promise<Metadata> {
  const { sentimiento } = await searchParams;
  const t = await getTranslations("mentions");
  const título =
    sentimiento === "positivo"
      ? t("detailTitlePositive")
      : sentimiento === "negativo"
        ? t("detailTitleNegative")
        : t("detailTitle");
  return { title: título };
}

export default async function MencionesDetallePage({
  searchParams,
}: MencionesDetallePageProps) {
  const { proyecto: proyectoParam, sentimiento: sentimientoParam } =
    await searchParams;
  const { proyectos: proyectosReales } = await obtenerProyectosReales();
  const proyectos = proyectosReales.map(({ id, nombre }) => ({
    id,
    nombre,
  }));
  const proyectoInicialId =
    proyectoParam && proyectos.some((proyecto) => proyecto.id === proyectoParam)
      ? proyectoParam
      : null;
  const sentimientoInicial =
    sentimientoParam &&
    ["positivo", "neutral", "negativo"].includes(sentimientoParam)
      ? (sentimientoParam as CategoríaSentimiento)
      : null;

  return (
    <MencionesDetalleVista
      proyectos={proyectos}
      proyectoInicialId={proyectoInicialId}
      sentimientoInicial={sentimientoInicial}
    />
  );
}
