import { useState, useEffect } from "react";
import Icon from "../components/ui/Icon.jsx";
import { useT } from "../lib/i18n.jsx";
import { api } from "../lib/api/client.js";

export default function MarketplaceAnalytics() {
  const t = useT();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await api.get("/lingo/analytics");
        setAnalytics(res);
      } catch (err) {
        console.error("Error loading analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !analytics) {
    return (
      <div className="flex justify-center items-center py-12">
        <Icon name="sync" className="animate-spin text-4xl text-[#E32652]" />
      </div>
    );
  }

  const { total_earnings, active_jobs, average_rating, top_services, revenue_history } = analytics;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b-2 border-black dark:border-stone-800 pb-6 gap-4">
        <div>
          <span className="text-[10px] tracking-widest font-black uppercase text-[#E32652] dark:text-[#f43f5e] font-label">
            {t("market.providerDashboard")}
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-black text-black dark:text-white uppercase leading-none tracking-tighter mt-1">
            {t("market.analyticsOverview")}
          </h1>
          <p className="text-gray-500 dark:text-stone-400 text-sm mt-2 max-w-xl font-sans font-medium">
            {t("market.analyticsDesc")}
          </p>
        </div>

        {/* Date scope picker */}
        <button className="px-4 py-2 border-2 border-black dark:border-stone-750 bg-white dark:bg-stone-800 text-black dark:text-stone-100 font-label text-xs uppercase font-bold shadow-[2px_2px_0px_#000000] flex items-center gap-2 hover:bg-[#FAF8F5]">
          <Icon name="calendar_month" className="text-sm" />
          {t("market.last30Days")} <Icon name="arrow_drop_down" />
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Earnings */}
        <div className="relative bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-800 p-6 shadow-[4px_4px_0px_#FDE2B6] dark:shadow-[4px_4px_0px_#8f7a5d] overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-gray-400 dark:text-stone-500 font-label uppercase tracking-widest">
              {t("market.price")}
            </span>
            <div className="w-8 h-8 rounded-full bg-[#FDE2B6] dark:bg-stone-800 flex items-center justify-center border border-black">
              <Icon name="payments" className="text-black dark:text-stone-300 text-sm" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-black dark:text-stone-100 font-mono mt-4">
            {total_earnings} TJS
          </h2>
        </div>

        {/* Active Jobs */}
        <div className="relative bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-800 p-6 shadow-[4px_4px_0px_#E32652] dark:shadow-[4px_4px_0px_#b11c42] overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-gray-400 dark:text-stone-500 font-label uppercase tracking-widest">
              {t("market.activeJobs")}
            </span>
            <div className="w-8 h-8 rounded-full bg-[#E32652] flex items-center justify-center border border-black">
              <Icon name="work" className="text-white text-sm" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-black dark:text-stone-100 font-mono mt-4">
            {active_jobs}
          </h2>
          <span className="text-[9px] text-gray-500 dark:text-stone-400 font-bold block mt-2">
            {t("market.awaitingDelivery")}
          </span>
        </div>

        {/* Rating */}
        <div className="relative bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-800 p-6 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#3a3a3a] overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-gray-400 dark:text-stone-500 font-label uppercase tracking-widest">
              {t("market.glossaRating")}
            </span>
            <div className="w-8 h-8 rounded-full bg-yellow-300 flex items-center justify-center border border-black">
              <Icon name="star" className="text-black text-sm" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-black dark:text-stone-100 font-mono mt-4">
            {Number(average_rating).toFixed(1)}
          </h2>
          <span className="text-[9px] text-gray-500 dark:text-stone-400 font-bold block mt-2">
            {t("market.basedOnReviews")}
          </span>
        </div>
      </div>

      {/* Main Charts & Top Services block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Revenue History (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-800 p-6 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#3a3a3a] flex flex-col gap-6">
          <div className="flex justify-between items-center border-b-2 border-black dark:border-stone-800 pb-3">
            <h3 className="font-label text-xs uppercase font-bold tracking-wider text-black dark:text-stone-200">
              {t("market.revenueHistory")}
            </h3>
            
            {/* Monthly / Weekly toggle */}
            <div className="flex border-2 border-black text-xs font-bold">
              <span className="px-3 py-1 bg-black text-white dark:bg-stone-200 dark:text-black">
                {t("market.monthly")}
              </span>
              <span className="px-3 py-1 bg-white dark:bg-stone-800 text-gray-400 dark:text-stone-650 border-l-2 border-black">
                {t("market.weekly")}
              </span>
            </div>
          </div>

          {/* Staggered neobrutalist alternating column bars (HTML/CSS layout) */}
          <div className="h-64 flex items-end justify-between px-4 pt-8 bg-[#FAF8F5] dark:bg-stone-950/20 border border-black dark:border-stone-800">
            {revenue_history.map((h, i) => {
              // Calculate height scale (assuming max is 1500 TJS)
              const maxAmount = 1500;
              const heightPercent = Math.min((Number(h.amount) / maxAmount) * 100, 100);
              
              // Alternating yellow/beige and red bars
              const barColorClass = i % 2 === 0 ? "bg-[#FDE2B6] dark:bg-stone-800" : "bg-[#E32652]";

              return (
                <div key={h.month} className="flex flex-col items-center gap-2 w-12 group relative">
                  {/* Tooltip on hover */}
                  <span className="absolute top-[-30px] left-[50%] -translate-x-1/2 bg-black text-white text-[9px] font-mono font-bold px-1.5 py-0.5 border border-black opacity-0 group-hover:opacity-100 transition-opacity">
                    {h.amount} TJS
                  </span>
                  
                  {/* The bar */}
                  <div 
                    className={`w-8 border-2 border-black shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#3a3a3a] transition-all duration-500 hover:-translate-y-0.5 ${barColorClass}`}
                    style={{ height: `${heightPercent}%` }}
                  />
                  
                  <span className="text-[10px] font-bold text-gray-400 dark:text-stone-500 font-mono">
                    {h.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Top Services (1 col) */}
        <div className="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-800 p-6 shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#3a3a3a] flex flex-col justify-between gap-6">
          <div className="border-b-2 border-black dark:border-stone-800 pb-3">
            <h3 className="font-label text-xs uppercase font-bold tracking-wider text-black dark:text-stone-200">
              {t("market.topServices")}
            </h3>
          </div>

          <div className="space-y-4 flex-1">
            {top_services.map((item, index) => (
              <div key={item.title} className="flex items-center gap-3 border border-black p-3 bg-[#FAF8F5] dark:bg-stone-800/50 shadow-[2px_2px_0px_#000000]">
                {/* Numeric index circle */}
                <div className="w-6 h-6 rounded-full border border-black bg-white dark:bg-stone-800 flex items-center justify-center font-bold text-xs text-black dark:text-stone-100">
                  {index + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-black dark:text-stone-200 truncate">
                    {item.title}
                  </h4>
                  <span className="px-1.5 py-0.5 text-[8px] font-black tracking-wider text-black border border-black bg-yellow-300 uppercase">
                    {item.category}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono text-xs font-black text-black dark:text-stone-100 block">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* VIEW FULL REPORT button */}
          <button className="w-full py-3 border-2 border-black bg-[#E32652] hover:bg-[#c11c42] text-white font-label text-xs uppercase font-bold shadow-[3px_3px_0px_#000] transition-transform hover:-translate-y-0.5 active:translate-y-0 shadow-[3px_3px_0px_#000000]">
            {t("market.viewFullReport")}
          </button>
        </div>
      </div>
    </div>
  );
}
