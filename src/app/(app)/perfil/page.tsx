import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { VistaPerfil } from "@/components/perfil";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("perfil");
  return {
    title: t("title"),
    description: t("pageDescription"),
  };
}

export default function PerfilPage() {
  return <VistaPerfil />;
}
