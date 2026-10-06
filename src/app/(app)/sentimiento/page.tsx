import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SentimientoVista } from "@/components/sentimiento";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("sentimentPage");
  return { title: t("title") };
}

export const dynamic = "force-dynamic";

export default function SentimientoPage() {
  return <SentimientoVista />;
}
