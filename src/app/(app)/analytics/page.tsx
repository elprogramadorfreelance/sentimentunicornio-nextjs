import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("stubs");
  return { title: t("analyticsTitle") };
}

export default async function AnalyticsPage() {
  const t = await getTranslations("stubs");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          {t("analyticsTitle")}
        </h1>
        <p className="text-sm text-text-muted mt-1">{t("analyticsSubtitle")}</p>
      </div>
    </div>
  );
}
