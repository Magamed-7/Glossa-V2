import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useApi } from "../lib/useApi.js";
import { getLingoService, createLingoProposal } from "../lib/api/lingo.js";
import { useT, useI18n } from "../lib/i18n.jsx";

function avatarUrl(service) {
  return service.provider_photo_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${service.provider_id}`;
}

export default function MarketplaceServiceDetail() {
  const t = useT();
  const { lang } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const { data: service, loading, error, reload } = useApi(() => getLingoService(id), [id]);

  const handleMessage = async () => {
    setSending(true);
    try {
      await createLingoProposal(service.id, service.price || 0);
    } catch (err) {
      console.error("Proposal could not be created or already exists:", err);
    } finally {
      setSending(false);
      navigate("/marketplace/inbox");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-8 w-1/2" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }

  const title = service[`title_${lang}`] || service.title;
  const description = service[`description_${lang}`] || service.description;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link to="/marketplace" className="inline-flex items-center gap-2 font-label text-label-md text-on-surface-variant hover:text-secondary transition-colors">
        <Icon name="arrow_back" className="text-lg" />
        {t("common.goBack")}
      </Link>

      <div className="card-neo bg-surface-bright grid grid-cols-1 md:grid-cols-12 gap-gutter p-6 md:p-10">
        {/* Provider column */}
        <div className="md:col-span-4 flex flex-col items-center text-center border-b-2 md:border-b-0 md:border-r-2 border-primary pb-6 md:pb-0 md:pr-8">
          <div className="w-32 h-32 border-2 border-primary rounded-full overflow-hidden card-neo mb-4">
            <img alt="" className="w-full h-full object-cover" src={avatarUrl(service)} />
          </div>
          <h2 className="font-headline text-headline-md text-primary">{service.provider_name}</h2>
          <div className="flex items-center gap-1 text-secondary font-bold mt-2">
            <Icon name="star" filled className="text-base" />
            {Number(service.rating).toFixed(1)}
            <span className="text-on-surface-variant font-body font-normal ml-1">
              ({t("market.reviewsCount", { n: service.reviews_count })})
            </span>
          </div>

          <div className="w-full mt-6 pt-6 border-t border-dashed border-outline-variant text-left">
            <h3 className="font-label text-label-md text-primary uppercase tracking-widest mb-2">{t("market.aboutProvider")}</h3>
            <p className="font-body text-body-md text-on-surface-variant">
              {t("market.provider")}: <span className="text-primary font-medium">{service.provider_name}</span>
            </p>
          </div>
        </div>

        {/* Service column */}
        <div className="md:col-span-8 flex flex-col">
          <div className="flex gap-2 flex-wrap mb-3">
            <span className="bg-tertiary-fixed-dim border-2 border-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-tertiary-fixed">
              {service.category}
            </span>
            {service.cefr_level && (
              <span className="bg-surface-container border-2 border-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                {service.cefr_level}
              </span>
            )}
          </div>

          <h1 className="font-headline text-headline-lg text-primary mb-4 leading-tight">{title}</h1>

          <div className="mb-6">
            <h3 className="font-label text-label-md text-primary uppercase tracking-widest mb-2">{t("market.aboutService")}</h3>
            <p className="font-body text-body-lg text-on-surface-variant border-l-4 border-primary pl-4 py-2 bg-surface-container-low">
              {description}
            </p>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex flex-col">
              <span className="font-label text-label-md text-on-surface-variant uppercase text-xs">{t("market.rate")}</span>
              <span className="font-headline text-headline-lg text-primary leading-none">
                {service.price ? (
                  <>
                    {service.price} <span className="font-body text-base">{`TJS/${service.pricing_type}`}</span>
                  </>
                ) : (
                  <span className="text-secondary">{t("market.priceFree")}</span>
                )}
              </span>
            </div>
          </div>

          <button
            onClick={handleMessage}
            disabled={sending}
            className="btn-primary-neo px-8 py-4 font-label text-label-md uppercase tracking-wider flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-60"
          >
            {t("market.message")} <Icon name="arrow_forward" className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
}
