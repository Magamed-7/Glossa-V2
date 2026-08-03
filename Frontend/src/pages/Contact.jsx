import Icon from "../components/ui/Icon.jsx";
import PageHeader from "../components/layout/PageHeader.jsx";
import { useT } from "../lib/i18n.jsx";

export default function Contact() {
  const t = useT();

  return (
    <div className="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop pt-16 md:pt-20 pb-section-gap">
      <PageHeader
        eyebrow={t("legal.contact.eyebrow")}
        title={t("legal.contact.title")}
        accent={t("legal.contact.accent")}
        subtitle={t("legal.contact.description")}
      />
      <div className="border-2 border-tertiary bg-surface-container-low hard-shadow p-8 md:p-12 flex flex-col gap-8">
        <div className="flex items-start gap-4">
          <Icon name="mail" className="text-2xl text-secondary" />
          <div>
            <p className="font-label text-label-md uppercase tracking-widest text-on-surface-variant">{t("legal.contact.emailLabel")}</p>
            <p className="font-headline text-headline-md">{t("legal.contact.email")}</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <Icon name="schedule" className="text-2xl text-secondary" />
          <div>
            <p className="font-label text-label-md uppercase tracking-widest text-on-surface-variant">{t("legal.contact.hoursLabel")}</p>
            <p className="font-body text-body-md text-on-surface-variant">{t("legal.contact.hours")}</p>
          </div>
        </div>
        <hr className="border-tertiary opacity-20" />
        <p className="font-body text-body-md text-on-surface-variant italic">{t("legal.contact.cta")}</p>
      </div>
    </div>
  );
}
