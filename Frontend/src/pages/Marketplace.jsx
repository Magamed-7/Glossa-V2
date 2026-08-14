import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import { useT, useI18n } from "../lib/i18n.jsx";
import { getLingoServices, createLingoProposal } from "../lib/api/lingo.js";

const CATEGORIES = ["ENGLISH", "RUSSIAN", "TAJIK", "TRANSLATION", "EDITING"];
const ITEMS_PER_PAGE = 5;

// Маппинг по реальным именам из БД → высококачественные фото
const PHOTO_MAP = {
  // Реальные тестовые провайдеры
  "ji-yoon k.": "/img/ji_yoon.png",
  "ji-yoon":    "/img/ji_yoon.png",
  "carlos s.":  "/img/carlos_m.png",
  "carlos m.":  "/img/carlos_m.png",
  "carlos":     "/img/carlos_m.png",
  "marc dubois":"/img/jean_luc.png",
  "jean-luc":   "/img/jean_luc.png",
  "jean luc":   "/img/jean_luc.png",
  "elena rossi":"/img/yuki_tanaka.png",
  "yunus":      "/img/Yunus.png",
  "ruslan":     "/img/Ruslan.jpg",
  "ruslanjon":  "/img/Ruslan.jpg",
  "osaf":       "/img/Osaf.jpg",
  "dilshod":    "/img/marketing/curator-yunus.png",
  "amir":       "/img/marketing/curator-osaf.webp",
  "bahriddin a.":"/img/marketing/curator-arthur.webp",
  "global tech inc.": "/img/marketing/curator-ruslan.webp",
};

function avatarUrl(service) {
  if (!service) return "/img/avatars/user-default.webp";
  if (service.provider_photo_url) return service.provider_photo_url;
  const name = (service.provider_name || "").toLowerCase().trim();
  if (PHOTO_MAP[name]) return PHOTO_MAP[name];
  // partial match fallback
  for (const [key, url] of Object.entries(PHOTO_MAP)) {
    if (name.includes(key) || key.includes(name)) return url;
  }
  const index = service.provider_id % 100;
  const gender = service.provider_id % 2 === 0 ? "men" : "women";
  return `https://randomuser.me/api/portraits/${gender}/${index}.jpg`;
}

function ServiceChips({ service }) {
  return (
    <div className="flex gap-2 flex-wrap">
      <span className="bg-tertiary-fixed-dim border-2 border-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-tertiary-fixed">
        {service.category}
      </span>
      {service.cefr_level && (
        <span className="bg-surface-container border-2 border-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
          {service.cefr_level}
        </span>
      )}
    </div>
  );
}

function FeaturedCard({ service, lang, t, onMessage }) {
  const title = service[`title_${lang}`] || service.title;
  const description = service[`description_${lang}`] || service.description;

  return (
    <article className="md:col-span-2 card-neo bg-surface-bright flex flex-col md:flex-row relative overflow-hidden">
      <div className="absolute top-0 right-0 bg-secondary text-on-secondary px-3 py-1 font-label-md text-label-md border-b-2 border-l-2 border-primary z-20">
        {t("market.topRated")}
      </div>
      <Link to={`/marketplace/services/${service.id}`} className="w-full md:w-2/5 border-b-2 md:border-b-0 md:border-r-2 border-primary relative h-64 md:h-auto block">
        <img alt="" className="w-full h-full object-cover grayscale-[20%]" src={avatarUrl(service)} />
        <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/60 to-transparent flex items-end">
          <div className="text-white">
            <p className="font-headline-md text-headline-md leading-tight drop-shadow-md">{service.provider_name}</p>
            <p className="font-label-md text-label-md opacity-90 flex items-center gap-1">
              <Icon name="star" filled className="text-sm" /> {Number(service.rating).toFixed(1)} ({t("market.reviewsCount", { n: service.reviews_count })})
            </p>
          </div>
        </div>
      </Link>
      <div className="w-full md:w-3/5 p-6 flex flex-col justify-between">
        <div>
          <div className="flex gap-2 mb-3 flex-wrap">
            <span className="chip-mustard px-2 py-0.5 text-xs font-bold uppercase tracking-wider border-2 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {service.category}
            </span>
            {service.cefr_level && (
              <span className="bg-surface-container border-2 border-primary px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-primary">
                {service.cefr_level}
              </span>
            )}
          </div>
          <Link to={`/marketplace/services/${service.id}`}>
            <h3 className="font-headline-lg text-headline-lg text-primary mb-2 leading-tight hover:text-secondary transition-colors">
              {title}
            </h3>
          </Link>
          <p className="font-body-md text-body-md text-on-surface-variant mb-4 line-clamp-2">{description}</p>
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase text-xs">{t("market.rate")}</span>
              {service.price ? (
                <span className="font-headline-md text-headline-md text-primary leading-tight">
                  {service.price} <span className="font-body-md text-base">{`${service.currency || "TJS"}/${service.pricing_type}`}</span>
                </span>
              ) : (
                <span className="font-headline-md text-headline-md text-secondary leading-tight">{t("market.priceFree")}</span>
              )}
            </div>
            <div className="w-px h-10 bg-primary" />
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase text-xs">{t("market.provider")}</span>
              <Link to={`/profile/${service.provider_id}`} className="font-body-md text-body-md text-primary font-medium hover:underline">
                {service.provider_name}
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => onMessage(service)}
            className="btn-primary-neo px-6 py-3 font-label-md text-label-md uppercase tracking-wider flex items-center gap-2"
          >
            {t("market.message")} <Icon name="arrow_forward" className="text-lg" />
          </button>
        </div>
      </div>
    </article>
  );
}

function StandardCard({ service, lang, t, onMessage }) {
  const title = service[`title_${lang}`] || service.title;
  const description = service[`description_${lang}`] || service.description;

  return (
    <article className="card-neo bg-surface-bright flex flex-col relative">
      <Link to={`/marketplace/services/${service.id}`} className="h-48 border-b-2 border-primary relative overflow-hidden block">
        <img alt="" className="w-full h-full object-cover" src={avatarUrl(service)} />
        <div className="absolute top-4 left-4">
          <span className="chip-mustard px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border-2 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {service.category}
          </span>
        </div>
      </Link>
      <div className="p-5 flex-grow flex flex-col">
        <div className="flex justify-between items-start gap-2 mb-2">
          <Link to={`/marketplace/services/${service.id}`} className="min-w-0">
            <h3 className="font-headline-md text-headline-md text-primary leading-tight line-clamp-2 hover:text-secondary transition-colors">
              {title}
            </h3>
          </Link>
          <div className="flex items-center gap-1 text-secondary font-bold shrink-0">
            <Icon name="star" filled className="text-sm" /> {Number(service.rating).toFixed(1)}
          </div>
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant mb-4 text-sm line-clamp-2 flex-grow">{description}</p>
        <div className="flex items-end justify-between mt-auto pt-4 border-t border-dashed border-outline-variant">
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase text-[10px] mb-1">{t("market.provider")}</p>
            <Link to={`/profile/${service.provider_id}`} className="font-body-md text-body-md font-medium text-primary hover:underline">
              {service.provider_name}
            </Link>
          </div>
          <div className="text-right">
            <p className={`font-headline-md text-headline-md leading-tight ${service.price ? "text-primary" : "text-secondary"}`}>
              {service.price ? service.price : t("market.priceFree")}{" "}
              {service.price ? <span className="font-body-md text-xs">{`${service.currency || "TJS"}/${service.pricing_type}`}</span> : null}
            </p>
          </div>
        </div>
        <button onClick={() => onMessage(service)} className="btn-outline-neo w-full mt-4 py-2 font-label-md text-label-md uppercase tracking-wider">
          {t("market.requestQuote")}
        </button>
      </div>
    </article>
  );
}

function FreeExchangeCard({ service, lang, t, onMessage }) {
  const title = service[`title_${lang}`] || service.title;
  const description = service[`description_${lang}`] || service.description;

  return (
    <article className="card-neo bg-primary-fixed flex flex-col relative">
      <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-secondary border-2 border-primary z-10 flex items-center justify-center">
        <Icon name="sync_alt" className="text-white text-sm" />
      </div>
      <div className="p-5 flex flex-col h-full">
        <Link to={`/profile/${service.provider_id}`} className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 border-2 border-primary rounded-full overflow-hidden shrink-0 card-neo">
            <img alt="" className="w-full h-full object-cover" src={avatarUrl(service)} />
          </div>
          <div>
            <h4 className="font-body-lg text-body-lg font-bold text-primary hover:underline">{service.provider_name}</h4>
            <div className="mt-1 flex gap-1 flex-wrap">
              <span className="chip-mustard px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border border-primary shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                {service.category}
              </span>
              {service.cefr_level && (
                <span className="bg-surface-container border border-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                  {service.cefr_level}
                </span>
              )}
            </div>
          </div>
        </Link>
        <h3 className="font-headline-md text-headline-md text-primary mb-2 leading-tight">{title}</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6 text-sm flex-grow">{description}</p>
        <div className="bg-surface border-2 border-primary p-3 flex justify-between items-center mb-4">
          <span className="font-label-md text-label-md uppercase tracking-widest text-primary">{t("market.rate")}</span>
          <span className="font-headline-md text-headline-md text-secondary leading-tight">{t("market.priceFree")}</span>
        </div>
        <button onClick={() => onMessage(service)} className="btn-primary-neo w-full py-2 font-label-md text-label-md uppercase tracking-wider">
          {t("market.message")}
        </button>
      </div>
    </article>
  );
}

function OfferSkillCard({ t }) {
  return (
    <article className="card-neo bg-inverse-surface text-surface flex flex-col justify-center items-center p-8 text-center">
      <Icon name="post_add" className="text-4xl text-tertiary-fixed mb-4" />
      <h3 className="font-headline-lg text-headline-lg mb-2">{t("market.offerASkill")}</h3>
      <p className="font-body-md text-body-md text-surface-variant mb-6 opacity-80">{t("market.offerASkillDesc")}</p>
      <Link
        to="/marketplace/services/new"
        className="border-2 border-surface bg-transparent text-surface hover:bg-surface hover:text-inverse-surface px-6 py-2 font-label-md text-label-md uppercase tracking-wider transition-colors"
      >
        {t("market.createListing")}
      </Link>
    </article>
  );
}

export default function Marketplace() {
  const t = useT();
  const { lang } = useI18n();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [levelGroup, setLevelGroup] = useState("ALL");
  const [priceGroup, setPriceGroup] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    getLingoServices({
      category: category || undefined,
      cefrGroup: levelGroup !== "ALL" ? levelGroup : undefined,
      priceGroup: priceGroup || undefined,
    })
      .then((res) => {
        setServices(res || []);
        setCurrentPage(1);
      })
      .catch((err) => console.error("Error fetching services:", err))
      .finally(() => setLoading(false));
  }, [category, levelGroup, priceGroup]);

  const handleMessage = async (service) => {
    try {
      await createLingoProposal(service.id, service.price || 0);
    } catch (err) {
      console.error("Proposal could not be created or already exists:", err);
    } finally {
      navigate("/marketplace/inbox");
    }
  };

  const totalPages = Math.ceil(services.length / ITEMS_PER_PAGE) || 1;
  const pageItems = services.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const cards = useMemo(() => {
    return pageItems.map((service, i) => {
      const isFeatured = currentPage === 1 && i === 0;
      const isFree = !service.price;
      if (isFeatured) return { type: "featured", service };
      if (isFree) return { type: "free", service };
      return { type: "standard", service };
    });
  }, [pageItems, currentPage]);

  return (
    <div className="relative">
      {/* Header section spanning full width to prevent overlaps and line intersections */}
      <div className="border-b-2 border-primary pb-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary uppercase tracking-tighter leading-none">
              {t("market.directoryHeadline")}
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant italic font-serif mt-2">
              {t("market.directoryIssue")}
            </p>
          </div>
          <div className="flex justify-between items-center w-full md:w-auto md:gap-8 grow md:grow-0 border-t-2 md:border-t-0 border-primary pt-4 md:pt-0">
            <span className="font-body-md text-body-md text-on-surface-variant">
              {t("market.servicesFound", { n: services.length })}
            </span>
            <div className="flex items-center gap-2 font-label-md text-label-md">
              <span className="text-on-surface-variant">{t("market.sortBy")}</span>
              <span className="text-primary font-bold border-b border-primary border-dashed pb-0.5">{t("market.relevance")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Filter Bar */}
      <div className="card-neo bg-surface-container-lowest p-6 mb-8 border-2 border-primary">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Main filter controls */}
          <div className="flex flex-wrap items-center gap-6">
            
            {/* Category Dropdown */}
            <div className="flex flex-col min-w-[200px]">
              <span className="font-label-md text-[10px] text-primary uppercase tracking-widest mb-1.5 font-bold flex items-center gap-1">
                <Icon name="translate" className="text-xs" />
                {t("market.serviceType")}
              </span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs font-bold bg-surface border-2 border-primary p-2 text-primary focus:outline-none focus:ring-1 focus:ring-secondary"
              >
                <option value="">{t("market.allTypes")}</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* CEFR Level Segmented Controls */}
            <div className="flex flex-col">
              <span className="font-label-md text-[10px] text-primary uppercase tracking-widest mb-1.5 font-bold flex items-center gap-1">
                <Icon name="bar_chart" className="text-xs" />
                {t("market.cefrLevel")}
              </span>
              <div className="flex flex-wrap gap-1">
                {["ALL", "A1-A2", "B1-B2", "C1-C2"].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLevelGroup(lvl)}
                    className={`px-3 py-2 border-2 border-primary font-label-md text-[10px] uppercase transition-colors font-bold ${
                      levelGroup === lvl ? "bg-secondary text-on-secondary" : "bg-surface hover:bg-surface-container-high text-primary"
                    }`}
                  >
                    {lvl === "ALL" ? t("market.allTypes") : lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Price compensation radio buttons */}
            <div className="flex flex-col">
              <span className="font-label-md text-[10px] text-primary uppercase tracking-widest mb-1.5 font-bold flex items-center gap-1">
                <Icon name="payments" className="text-xs" />
                {t("market.rateCompensation")}
              </span>
              <div className="flex items-center gap-4 py-2 text-xs font-bold text-primary">
                {[
                  { label: t("market.anyRate"), val: "" },
                  { label: t("market.priceFree"), val: "free" },
                  { label: t("market.pricePaid"), val: "under50" },
                ].map((item) => (
                  <label key={item.val} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="price"
                      checked={priceGroup === item.val}
                      onChange={() => setPriceGroup(item.val)}
                      className="w-4 h-4 border-2 border-primary accent-secondary cursor-pointer"
                    />
                    <span className="group-hover:text-secondary transition-colors">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* Neo decoration block */}
          <div className="hidden lg:flex items-center gap-4 bg-surface-container border-2 border-primary p-3 h-12 relative overflow-hidden">
            <span className="font-label-md text-[10px] font-black uppercase text-secondary tracking-widest">Glossa Market Hub</span>
            <div className="w-px h-full bg-primary" />
            <span className="font-mono text-xs text-primary/40 font-bold">V.2.0</span>
          </div>

        </div>
      </div>

      {/* Directory content (Spanning full width) */}
      <div className="w-full">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter lg:gap-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-64 bg-surface-container animate-pulse border-2 border-primary" />
            ))}
          </div>
        ) : pageItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-surface-bright border-2 border-dashed border-primary text-center">
            <Icon name="search_off" className="text-4xl text-on-surface-variant mb-2" />
            <p className="font-label-md text-label-md text-primary uppercase">{t("market.noListings")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter lg:gap-8">
            {cards.map(({ type, service }) =>
              type === "featured" ? (
                <FeaturedCard key={service.id} service={service} lang={lang} t={t} onMessage={handleMessage} />
              ) : type === "free" ? (
                <FreeExchangeCard key={service.id} service={service} lang={lang} t={t} onMessage={handleMessage} />
              ) : (
                <StandardCard key={service.id} service={service} lang={lang} t={t} onMessage={handleMessage} />
              )
            )}
            {currentPage === 1 && <OfferSkillCard t={t} />}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-16 flex justify-center items-center gap-4">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((c) => Math.max(c - 1, 1))}
              className="w-10 h-10 border-2 border-primary flex items-center justify-center hover:bg-primary hover:text-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="arrow_back" />
            </button>
            <div className="flex gap-2 font-label-md text-label-md">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-10 h-10 border-2 border-primary flex items-center justify-center font-bold transition-colors ${
                    p === currentPage ? "bg-primary text-surface" : "hover:bg-surface-container"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((c) => Math.min(c + 1, totalPages))}
              className="w-10 h-10 border-2 border-primary flex items-center justify-center hover:bg-primary hover:text-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="arrow_forward" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
