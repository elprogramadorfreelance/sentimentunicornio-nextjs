import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AmplificadoresVista } from "@/components/amplificadores";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("amplifiers");
  return { title: t("title") };
}
export const dynamic = "force-dynamic";

export default function AmplificadoresPage() {
  return <AmplificadoresVista />;
}
