import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { VistaDemo } from "@/components/demo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return {
    title: t("demoTitle"),
    description: t("demoMetaDescription"),
  };
}

export default function DemoPage() {
  return <VistaDemo />;
}
