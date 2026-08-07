import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import { useT } from "../lib/i18n.jsx";
import { api } from "../lib/api/client.js";

export default function Marketplace() {
  const t = useT();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [levelGroup, setLevelGroup] = useState("ALL"); // 'ALL', 'A1-A2', 'B1-B2', 'C1-C2'
  const [priceGroup, setPriceGroup] = useState(""); // '', 'free', 'under50', '50-150', 'premium150'

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchServices = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (category) q.append("category", category);
      if (levelGroup !== "ALL") q.append("cefr_group", levelGroup);
      if (priceGroup) q.append("price_group", priceGroup);

      const res = await api.get(`/lingo/services?${q.toString()}`);
      setServices(res || []);
      setCurrentPage(1); // Reset page on filter changes
    } catch (err) {
      console.error("Error fetching services:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [category, levelGroup, priceGroup]);

  // Handle proposal message initiation
  const handleInitiateProposal = async (service) => {
    try {
      await api.post("/lingo/proposals", {
        service_id: service.id,
        price: service.price
      });
      // Redirect to Inbox
      navigate("/marketplace/inbox");
    } catch (err) {
      console.error("Proposal could not be created or already exists:", err);
      // Even if already exists, just redirect to Inbox
      navigate("/marketplace/inbox");
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(services.length / itemsPerPage) || 1;
  const paginatedServices = services.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b-2 border-black dark:border-stone-800 pb-6 gap-4">
        <div>
          <span className="text-[10px] tracking-widest font-black uppercase text-[#E32652] dark:text-[#f43f5e] font-label">
            {t("market.eyebrow")}
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-black text-black dark:text-white uppercase leading-none tracking-tighter mt-1">
            Glossa <span className="italic font-serif font-normal text-stone-600 dark:text-stone-400 lowercase">{t("market.titleAccent")}</span>
          </h1>
          <p className="text-gray-500 dark:text-stone-400 text-sm mt-2 max-w-xl font-sans font-medium">
            {t("market.subtitle")}
          </p>
        </div>
      </div>

      {/* Grid Layout containing Filters on left, and Services catalog list on right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Filter Panel */}
        <div className="space-y-6 bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-800 p-6 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#3a3a3a] h-fit">
          <div className="flex items-center gap-2 border-b-2 border-black dark:border-stone-800 pb-3">
            <Icon name="filter_alt" className="text-black dark:text-stone-300" />
            <h3 className="font-label text-xs uppercase font-bold tracking-wider text-black dark:text-stone-200">
              {t("market.filters")}
            </h3>
          </div>

          {/* LEVEL Filter */}
          <div className="space-y-2">
            <span className="text-[10px] font-black text-gray-400 dark:text-stone-500 font-label uppercase tracking-widest">
              {t("market.cefrLevel")}
            </span>
            <div className="flex flex-col gap-1.5">
              {["ALL", "A1-A2", "B1-B2", "C1-C2"].map((lvl) => (
                <label key={lvl} className="flex items-center gap-2 text-xs font-bold text-black dark:text-stone-300 cursor-pointer uppercase">
                  <input
                    type="radio"
                    name="level"
                    checked={levelGroup === lvl}
                    onChange={() => setLevelGroup(lvl)}
                    className="accent-[#E32652]"
                  />
                  {lvl === "ALL" ? t("market.allTypes") : lvl}
                </label>
              ))}
            </div>
          </div>

          {/* PRICE Filter */}
          <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-stone-800">
            <span className="text-[10px] font-black text-gray-400 dark:text-stone-500 font-label uppercase tracking-widest">
              {t("market.price")}
            </span>
            <div className="flex flex-col gap-1.5">
              {[
                { label: t("market.allStatuses") || "All Prices", val: "" },
                { label: "Free Services", val: "free" },
                { label: "Under 50 TJS", val: "under50" },
                { label: "50 - 150 TJS", val: "50-150" },
                { label: "Premium 150+ TJS", val: "premium150" }
              ].map((item) => (
                <label key={item.label} className="flex items-center gap-2 text-xs font-bold text-black dark:text-stone-300 cursor-pointer">
                  <input
                    type="radio"
                    name="price"
                    checked={priceGroup === item.val}
                    onChange={() => setPriceGroup(item.val)}
                    className="accent-[#E32652]"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-stone-800">
            <span className="text-[10px] font-black text-gray-400 dark:text-stone-500 font-label uppercase tracking-widest">
              {t("market.category")}
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs font-bold bg-[#FAF8F5] dark:bg-stone-800 border-2 border-black dark:border-stone-700 p-2 text-black dark:text-stone-200 focus:outline-none"
            >
              <option value="">{t("market.allTypes") || "All Categories"}</option>
              <option value="KOREAN">Korean</option>
              <option value="FRENCH">French</option>
              <option value="SPANISH">Spanish</option>
              <option value="TRANSLATION">Translation</option>
              <option value="EDITING">Editing & QA</option>
            </select>
          </div>
        </div>

        {/* Directory Listings Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-44 bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-800 animate-pulse" />
              ))}
            </div>
          ) : paginatedServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-stone-900 border-2 border-dashed border-black dark:border-stone-800 text-center">
              <Icon name="search_off" className="text-4xl text-gray-400 dark:text-stone-500 mb-2" />
              <p className="text-sm font-bold text-black dark:text-stone-200 uppercase tracking-wide">
                {t("market.noListings")}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {paginatedServices.map((svc) => (
                <div 
                  key={svc.id}
                  className="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-800 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#3a3a3a] flex flex-col md:flex-row transition-transform hover:-translate-y-0.5"
                >
                  {/* Left Color Block Accent */}
                  <div className="w-full md:w-48 bg-[#FAF8F5] dark:bg-stone-800 border-b-2 md:border-b-0 md:border-r-2 border-black dark:border-stone-800 p-6 flex flex-col justify-between min-h-[160px]">
                    <div>
                      <span className="px-2 py-1 text-[9px] font-black tracking-wider text-black border border-black bg-yellow-300 uppercase">
                        {svc.category}
                      </span>
                      {svc.cefr_level && (
                        <span className="ml-2 px-2 py-1 text-[9px] font-black tracking-wider text-white border border-black bg-[#E32652] uppercase">
                          CEFR {svc.cefr_level}
                        </span>
                      )}
                    </div>
                    <div className="mt-4">
                      <span className="text-[10px] text-gray-400 dark:text-stone-500 font-label uppercase tracking-widest block">
                        {t("market.providerInfo")}
                      </span>
                      <span className="text-xs font-bold text-black dark:text-stone-100 uppercase tracking-wider block">
                        {svc.provider_name || "Lingo Pro"}
                      </span>
                    </div>
                  </div>

                  {/* Service Core Info */}
                  <div className="flex-1 p-6 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex justify-between items-start">
                        <h2 className="font-serif font-black text-xl text-black dark:text-stone-100 hover:text-[#E32652] transition-colors leading-tight">
                          {svc.title}
                        </h2>
                        
                        {/* Rating Display */}
                        <div className="flex items-center gap-1 text-[#E32652]">
                          <Icon name="star" className="text-sm text-[#E32652]" />
                          <span className="text-xs font-bold font-sans">
                            {Number(svc.rating).toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-stone-400 font-sans mt-2 leading-relaxed">
                        {svc.description}
                      </p>
                    </div>

                    {/* Card Actions/Footer */}
                    <div className="flex justify-between items-center border-t border-gray-100 dark:border-stone-800 pt-4 mt-auto">
                      <div>
                        <span className="text-[9px] text-gray-400 dark:text-stone-500 font-label uppercase block leading-none">
                          {t("market.price")}
                        </span>
                        <span className="text-base font-black text-black dark:text-stone-100 font-mono">
                          {svc.price == 0 ? t("market.priceFree") : `${svc.price} TJS/${svc.pricing_type}`}
                        </span>
                      </div>
                      
                      <button 
                        onClick={() => handleInitiateProposal(svc)}
                        className="px-4 py-2 border-2 border-black dark:border-stone-700 bg-white dark:bg-stone-800 text-black dark:text-stone-200 font-label text-xs uppercase font-bold shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#3a3a3a] hover:bg-stone-50 dark:hover:bg-stone-700 transition-all active:translate-y-0.5 active:shadow-[1px_1px_0px_#000000]"
                      >
                        {t("market.message")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((c) => Math.max(c - 1, 1))}
                className="w-8 h-8 flex items-center justify-center border-2 border-black dark:border-stone-700 bg-white dark:bg-stone-800 disabled:opacity-40 shadow-[1.5px_1.5px_0px_#000000]"
              >
                <Icon name="arrow_back" className="text-black dark:text-stone-200 text-xs" />
              </button>
              
              <span className="font-mono text-xs font-bold text-black dark:text-stone-200">
                {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((c) => Math.min(c + 1, totalPages))}
                className="w-8 h-8 flex items-center justify-center border-2 border-black dark:border-stone-700 bg-white dark:bg-stone-800 disabled:opacity-40 shadow-[1.5px_1.5px_0px_#000000]"
              >
                <Icon name="arrow_forward" className="text-black dark:text-stone-200 text-xs" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
