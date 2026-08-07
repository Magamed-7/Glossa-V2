import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useApi } from "../lib/useApi.js";
import { getLingoService, createLingoProposal } from "../lib/api/lingo.js";
import { useT, useI18n } from "../lib/i18n.jsx";

const PHOTO_MAP = {
  "ji-yoon k.": "/img/ji_yoon.png",
  "ji-yoon":    "/img/ji_yoon.png",
  "carlos s.":  "/img/carlos_m.png",
  "carlos m.":  "/img/carlos_m.png",
  "carlos":     "/img/carlos_m.png",
  "marc dubois":"/img/jean_luc.png",
  "jean-luc":   "/img/jean_luc.png",
  "jean luc":   "/img/jean_luc.png",
  "elena rossi":"/img/ji_yoon.png",
  "yunus":      "/img/Yunus.png",
  "ruslan":     "/img/Ruslan.jpg",
  "ruslanjon":  "/img/Ruslan.jpg",
  "osaf":       "/img/Osaf.jpg",
  "dilshod":    "/img/yuki_tanaka.png",
  "amir":       "/img/jean_luc.png",
  "bahriddin a.":"/img/carlos_m.png",
  "global tech inc.": "/img/ji_yoon.png",
};

function avatarUrl(service) {
  if (!service) return "/img/avatars/user-default.webp";
  if (service.provider_photo_url) return service.provider_photo_url;
  const name = (service.provider_name || "").toLowerCase().trim();
  if (PHOTO_MAP[name]) return PHOTO_MAP[name];
  for (const [key, url] of Object.entries(PHOTO_MAP)) {
    if (name.includes(key) || key.includes(name)) return url;
  }
  const index = service.provider_id % 100;
  const gender = service.provider_id % 2 === 0 ? "men" : "women";
  return `https://randomuser.me/api/portraits/${gender}/${index}.jpg`;
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
    <div className="max-w-5xl mx-auto space-y-8 py-6">
      {/* Top Navigation Links */}
      <div className="flex flex-wrap justify-between items-center gap-4 border-b-2 border-primary pb-4">
        <Link 
          to="/marketplace" 
          className="btn-outline-neo px-4 py-2 font-label-md text-label-md uppercase tracking-wider flex items-center gap-2"
        >
          <Icon name="arrow_back" className="text-lg" />
          {t("common.goBack") || "Back to Marketplace"}
        </Link>
        <Link 
          to="/" 
          className="btn-outline-neo px-4 py-2 font-label-md text-label-md uppercase tracking-wider bg-amber-100 hover:bg-amber-200 flex items-center gap-2"
        >
          <Icon name="home" className="text-lg" />
          {t("market.return") || "Return to Glossa"}
        </Link>
      </div>

      {/* Main Container Card */}
      <div className="card-neo bg-surface-bright grid grid-cols-1 md:grid-cols-12 gap-8 p-6 md:p-10 overflow-hidden">
        
        {/* Left Column: Provider Info Profile */}
        <div className="md:col-span-4 flex flex-col items-center text-center border-b-2 md:border-b-0 md:border-r-2 border-primary pb-8 md:pb-0 md:pr-8">
          <div className="w-36 h-36 border-2 border-primary rounded-full overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6 shrink-0">
            <img alt={service.provider_name} className="w-full h-full object-cover grayscale-[10%]" src={avatarUrl(service)} />
          </div>
          
          <h2 className="font-headline-md text-headline-md text-primary font-bold tracking-tight">
            {service.provider_name}
          </h2>
          
          <div className="flex items-center gap-1 text-secondary font-bold mt-2 bg-white px-3 py-1 border-2 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Icon name="star" filled className="text-base" />
            <span className="font-mono text-sm">{Number(service.rating).toFixed(1)}</span>
            <span className="text-gray-400 font-sans font-normal text-xs ml-1">
              ({service.reviews_count || 1})
            </span>
          </div>

          <div className="w-full mt-8 pt-6 border-t border-dashed border-outline-variant text-left space-y-4">
            <div>
              <h3 className="font-label-md text-label-md text-primary uppercase tracking-widest mb-1.5">
                {t("market.aboutProvider") || "About Provider"}
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Professional linguistic expert verified by Glossa Editorial team. Specializes in language teaching, custom editing, and cultural localization services.
              </p>
            </div>

            <div className="space-y-1 text-xs font-mono text-gray-500">
              <p className="flex items-center gap-2">
                <Icon name="mail" className="text-sm" />
                <span className="truncate">{service.provider_email || `${service.provider_name.toLowerCase().replace(/\s+/g, '')}@glossa.tj`}</span>
              </p>
              <p className="flex items-center gap-2">
                <Icon name="verified_user" className="text-sm text-green-600" />
                <span className="uppercase text-[9px] font-bold text-green-700">Verified Educator</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Service Description & Booking Details */}
        <div className="md:col-span-8 flex flex-col justify-between">
          <div className="space-y-6">
            
            {/* Category / Level Badges */}
            <div className="flex gap-2 flex-wrap">
              <span className="chip-mustard px-3 py-1 text-xs font-bold uppercase tracking-wider border-2 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {service.category}
              </span>
              {service.cefr_level && (
                <span className="bg-surface-container border-2 border-primary px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                  {service.cefr_level}
                </span>
              )}
            </div>

            {/* Service Title */}
            <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary leading-tight font-black tracking-tight">
              {title}
            </h1>

            {/* Description Text */}
            <div className="space-y-2">
              <h3 className="font-label-md text-label-md text-primary uppercase tracking-widest">
                {t("market.aboutService") || "Service Description"}
              </h3>
              <p className="font-body-lg text-body-lg text-on-surface-variant border-l-4 border-primary pl-4 py-3 bg-surface-container-low leading-relaxed italic font-serif">
                {description}
              </p>
            </div>

            {/* Price Info Banner */}
            <div className="bg-surface border-2 border-primary p-4 flex justify-between items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="font-label-md text-label-md uppercase tracking-widest text-primary font-bold">
                {t("market.rate") || "Standard Rate"}
              </span>
              <span className="font-headline-md text-headline-md text-secondary font-black">
                {service.price ? (
                  <>
                    {service.price} <span className="font-body-md text-base font-normal text-primary">{`TJS/${service.pricing_type}`}</span>
                  </>
                ) : (
                  t("market.priceFree") || "FREE EXCHANGE"
                )}
              </span>
            </div>
          </div>

          {/* Action CTA Button */}
          <div className="mt-8">
            <button
              onClick={handleMessage}
              disabled={sending}
              className="btn-primary-neo w-full py-4 font-label-md text-label-md uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {t("market.message") || "Message Provider"} 
              <Icon name="arrow_forward" className="text-lg" />
            </button>
          </div>
          
        </div>

      </div>
    </div>
  );
}
