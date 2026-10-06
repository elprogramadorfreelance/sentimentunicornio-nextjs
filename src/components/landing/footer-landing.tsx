import { getLocale, getTranslations } from "next-intl/server";
import { siWhatsapp } from "simple-icons";
import { BrandIcon } from "@/components/icons/brand-icon";
import { Bandera } from "@/components/tema";
import { Footer } from "@/components/ui";
import { esLocale } from "@/i18n/config";
import { WHATSAPP_POR_LOCALE } from "@/lib/contacto-landing";

export async function FooterLanding() {
  const t = await getTranslations("landing");
  const tCommon = await getTranslations("common");
  const locale = await getLocale();
  const localeActual = esLocale(locale) ? locale : "es";
  const whatsapp = WHATSAPP_POR_LOCALE[localeActual];

  return (
    <Footer
      tagline={t("footerTagline")}
      copyright={t("footerCopyright", { year: new Date().getFullYear() })}
      poweredByLabel={tCommon("poweredBy")}
      columns={[
        {
          label: t("footerColProduct"),
          links: [
            { title: t("navFeatures"), href: "#funciones" },
            { title: t("navServices"), href: "#servicios" },
            { title: t("navAudiences"), href: "#audiencias" },
            { title: t("navPlans"), href: "#planes" },
            { title: t("navFaq"), href: "#faq" },
            { title: t("ctaDemo"), href: "/demo" },
          ],
        },
        {
          label: t("footerColCompany"),
          links: [
            { title: t("navContact"), href: "#contacto" },
            { title: t("navLogin"), href: "/login" },
            { title: tCommon("privacyNotice"), href: "/privacy" },
            {
              title: t("footerBlog"),
              disabled: true,
              legend: t("footerComingSoon"),
            },
            {
              title: t("footerWebinars"),
              disabled: true,
              legend: t("footerComingSoon"),
            },
          ],
        },
        {
          label: t("footerColContact"),
          links: [
            {
              title: (
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <Bandera locale={localeActual} className="h-3 w-4" />
                  <BrandIcon icon={siWhatsapp} className="size-4 shrink-0" />
                  {whatsapp.numero}
                </span>
              ),
              href: whatsapp.href,
            },
            {
              title: t("footerEmailCta"),
              href: "mailto:contact@globalmediainvestment.com",
              icon: "mail",
            },
          ],
        },
      ]}
    />
  );
}
