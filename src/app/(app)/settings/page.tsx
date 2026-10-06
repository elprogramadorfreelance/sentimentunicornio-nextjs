import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SelectorApariencia } from "@/components/configuracion/selector-apariencia";
import { SelectorIdioma } from "@/components/configuracion/selector-idioma";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings");
  return { title: t("title") };
}

export default async function SettingsPage() {
  const t = await getTranslations("settings");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t("title")}</h1>
        <p className="text-sm text-text-muted mt-1">{t("pageIntro")}</p>
      </div>
      <SelectorIdioma />
      <SelectorApariencia />
    </div>
  );
}
