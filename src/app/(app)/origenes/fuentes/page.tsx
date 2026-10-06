import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PaginaEnConstruccion } from "@/components/shared/pagina-en-construccion";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("origins");
  return { title: t("sourcesTitle") };
}

export default async function FuentesConectadasPage() {
  const t = await getTranslations("origins");

  return (
    <PaginaEnConstruccion
      titulo={t("sourcesTitle")}
      descripcion={t("sourcesDescription")}
    />
  );
}
