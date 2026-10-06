import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MencionesVista } from "@/components/menciones";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("mentions");
  return { title: t("title") };
}

export const dynamic = "force-dynamic";

export default function MencionesPage() {
  return <MencionesVista />;
}
