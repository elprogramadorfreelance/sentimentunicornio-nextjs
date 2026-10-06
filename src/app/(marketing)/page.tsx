import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { preload } from "react-dom";
import {
  AudienciasLanding,
  CtaFinalLanding,
  FaqLanding,
  FooterLanding,
  FuncionesLanding,
  HeroLanding,
  IaSimplificaLanding,
  NavbarLanding,
  PlanesLanding,
  PruebaSocialLanding,
  ServiciosLanding,
} from "@/components/landing";
import {
  VIDEO_HERO_DASHBOARD,
  videoServiciosLanding,
} from "@/lib/video-landing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function LandingPage() {
  const locale = await getLocale();
  const video = videoServiciosLanding(locale);
  preload(VIDEO_HERO_DASHBOARD.src, {
    as: "video",
    type: VIDEO_HERO_DASHBOARD.type,
  });
  preload(video.src, { as: "video", type: video.type });

  return (
    <div className="min-h-dvh bg-bg-base">
      <main>
        <NavbarLanding />
        <HeroLanding />
        <FuncionesLanding />
        <ServiciosLanding />
        <PruebaSocialLanding />
        <AudienciasLanding />
        <IaSimplificaLanding />
        <PlanesLanding />
        <FaqLanding />
        <CtaFinalLanding />
      </main>
      <FooterLanding />
    </div>
  );
}
