import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { NarrativasVista } from "@/components/narrativas";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("narratives") };
}
export const dynamic = "force-dynamic";

export default function NarrativasPage() {
  return <NarrativasVista />;
}
