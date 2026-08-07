import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import { useT } from "../lib/i18n.jsx";
import { api } from "../lib/api/client.js";

export default function MarketplaceServices() {
  const t = useT();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchMyServices = async () => {
      setLoading(true);
      try {
        // Fetch only current user's services (provider_id handled by current_user token on backend list view)
        const res = await api.get("/lingo/services");
        setServices(res || []);
      } catch (err) {
        console.error("Error fetching provider services:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyServices();
  }, []);

  // Filter listings by search query
  const filtered = services.filter((svc) => {
    const term = searchQuery.toLowerCase();
    return (
      svc.title.toLowerCase().includes(term) ||
      svc.description.toLowerCase().includes(term) ||
      svc.category.toLowerCase().includes(term)
    );
  });

  // Calculate pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b-2 border-black dark:border-stone-800 pb-6 gap-4">
        <div>
          <span className="text-[10px] tracking-widest font-black uppercase text-[#E32652] dark:text-[#f43f5e] font-label">
            {t("market.providerWorkspace")}
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-black text-black dark:text-white uppercase leading-none tracking-tighter mt-1">
            {t("market.myListings")}
          </h1>
          <p className="text-gray-500 dark:text-stone-400 text-sm mt-2 max-w-xl font-sans font-medium">
            {t("market.myListingsDesc")}
          </p>
        </div>

        {/* Create new service button */}
        <Link
          to="/marketplace/services/new"
          className="px-5 py-3 border-2 border-black bg-[#E32652] hover:bg-[#c11c42] text-white font-label text-xs uppercase font-bold shadow-[3px_3px_0px_#000] transition-transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-1 shadow-[3px_3px_0px_#000000]"
        >
          <Icon name="add" className="text-sm text-white" />
          {t("market.createNew")}
        </Link>
      </div>

      {/* Filter and Search actions toolbar */}
      <div className="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-800 p-4 flex flex-col md:flex-row gap-4 justify-between items-center shadow-[3px_3px_0px_#000000] dark:shadow-[3px_3px_0px_#3a3a3a]">
        
        {/* Search Input bar */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={t("market.searchPlaceholder")}
            className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] dark:bg-stone-850 border-2 border-black dark:border-stone-700 text-black dark:text-stone-100 font-sans text-xs focus:outline-none focus:ring-1 focus:ring-[#E32652]"
          />
          <Icon name="search" className="absolute left-3.5 top-3.5 text-gray-400 dark:text-stone-500" />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select className="flex-1 md:flex-initial text-xs font-bold bg-[#FAF8F5] dark:bg-stone-800 border-2 border-black dark:border-stone-700 p-2 text-black dark:text-stone-200">
            <option>{t("market.allTypes")}</option>
          </select>
          <select className="flex-1 md:flex-initial text-xs font-bold bg-[#FAF8F5] dark:bg-stone-800 border-2 border-black dark:border-stone-700 p-2 text-black dark:text-stone-200">
            <option>{t("market.allStatuses")}</option>
          </select>
        </div>
      </div>

      {/* Neubrutalist Data Table List view */}
      <div className="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-800 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#3a3a3a] overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          
          {/* Header Row */}
          <thead>
            <tr className="border-b-2 border-black dark:border-stone-800 bg-[#FAF8F5] dark:bg-stone-950/40">
              <th className="p-4 text-[10px] font-black text-gray-400 dark:text-stone-500 font-label uppercase tracking-widest">
                {t("market.titleDetails")}
              </th>
              <th className="p-4 text-[10px] font-black text-gray-400 dark:text-stone-500 font-label uppercase tracking-widest">
                {t("market.type")}
              </th>
              <th className="p-4 text-[10px] font-black text-gray-400 dark:text-stone-500 font-label uppercase tracking-widest">
                {t("market.status")}
              </th>
              <th className="p-4 text-[10px] font-black text-gray-400 dark:text-stone-500 font-label uppercase tracking-widest">
                {t("market.price")}
              </th>
              <th className="p-4 text-[10px] font-black text-gray-400 dark:text-stone-500 font-label uppercase tracking-widest text-center">
                {t("market.actions")}
              </th>
            </tr>
          </thead>

          {/* Table Body rows */}
          <tbody className="divide-y-2 divide-black dark:divide-stone-850">
            {loading ? (
              [1, 2].map((n) => (
                <tr key={n}>
                  <td colSpan="5" className="p-4 h-16 bg-gray-50 dark:bg-stone-950/20 animate-pulse" />
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-12 text-center text-gray-450 uppercase tracking-wide text-xs">
                  {t("market.noListings")}
                </td>
              </tr>
            ) : (
              paginated.map((svc) => (
                <tr key={svc.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-950/10">
                  
                  {/* Title & last edited timestamp */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 border border-black bg-amber-100 flex items-center justify-center font-black text-xs text-black uppercase shrink-0">
                        {svc.category.substring(0, 3)}
                      </div>
                      
                      <div className="min-w-0">
                        <span className="font-serif font-black text-sm text-black dark:text-stone-100 block hover:text-[#E32652] cursor-pointer">
                          {svc.title}
                        </span>
                        <span className="text-[9px] text-gray-400 dark:text-stone-500 font-mono block mt-0.5">
                          {t("market.lastEdited")}: {new Date(svc.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Type badge */}
                  <td className="p-4">
                    <span className="px-2 py-0.5 text-[8px] font-black tracking-wider text-black dark:text-stone-200 border border-black bg-white dark:bg-stone-800 uppercase">
                      SERVICE
                    </span>
                  </td>

                  {/* Status Indicator */}
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <span className={`w-2.5 h-2.5 rounded-full border border-black ${
                        svc.status === "active"
                          ? "bg-green-500"
                          : svc.status === "draft"
                          ? "bg-amber-400"
                          : "bg-stone-400"
                      }`} />
                      <span className="text-black dark:text-stone-200 uppercase text-[10px]">
                        {svc.status === "active" ? t("market.activeStatus") : svc.status === "draft" ? t("market.draftStatus") : t("market.hiddenStatus")}
                      </span>
                    </div>
                  </td>

                  {/* Price Rate */}
                  <td className="p-4">
                    <span className="font-mono text-xs font-bold text-black dark:text-stone-200">
                      {svc.price == 0 ? t("market.priceFree") : `${svc.price} TJS/${svc.pricing_type}`}
                    </span>
                  </td>

                  {/* Action link Edit */}
                  <td className="p-4 text-center">
                    <Link
                      to={`/marketplace/services/${svc.id}/edit`}
                      className="px-3 py-1.5 border border-black bg-[#FAF8F5] dark:bg-stone-800 text-black dark:text-stone-200 font-label text-[10px] uppercase font-black shadow-[1.5px_1.5px_0px_#000000] hover:bg-stone-100 transition-all inline-flex items-center gap-1"
                    >
                      <Icon name="edit" className="text-xs" />
                      {t("market.edit")}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-2">
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
  );
}
