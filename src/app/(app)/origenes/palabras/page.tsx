import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PalabrasClaveVista } from "@/components/origenes/palabras-clave-vista";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("origins");
  return { title: t("keywordsTitle") };
}

export default function PalabrasClavePage() {
  return <PalabrasClaveVista />;
}
