import { Outlet, Link } from "react-router-dom";
import MarketplaceSideNavBar from "./MarketplaceSideNavBar.jsx";
import LanguageSwitcher from "./LanguageSwitcher.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import Icon from "../ui/Icon.jsx";
import { useAuth } from "../../lib/auth/AuthContext.jsx";
import { useEffect, useState } from "react";
import { api } from "../../lib/api/client.js";
import { useT } from "../../lib/i18n.jsx";

export default function MarketplaceLayout() {
  const t = useT();
  const { user } = useAuth();
  const [balance, setBalance] = useState("0.00");

  const fetchBalance = async () => {
    try {
      const res = await api.get("/wallet/balance");
      setBalance(res?.balance || "0.00");
    } catch (err) {
      console.error("Error fetching balance:", err);
    }
  };

  useEffect(() => {
    fetchBalance();
    
    // Add event listener to refresh balance on payment confirmations
    window.addEventListener("balance_update", fetchBalance);
    return () => {
      window.removeEventListener("balance_update", fetchBalance);
    };
  }, []);

  return (
    <>
      {/* Marketplace Navigation Sidebar */}
      <MarketplaceSideNavBar />

      {/* Main Container */}
      <main className="md:ml-64 min-h-screen relative overflow-hidden bg-[#FAF8F5] dark:bg-[#151311] transition-colors duration-300">
        
        {/* Neubrutalist Dot Grid Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.4] dark:opacity-[0.1]" 
          style={{
            backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        />

        {/* Backdrop Glow Decoration */}
        <div className="absolute right-[-10%] top-[-10%] w-[500px] h-[500px] rounded-full bg-[#FDE2B6] dark:bg-stone-800 opacity-30 dark:opacity-10 blur-[120px] pointer-events-none" />

        {/* Minimalist Top Nav Header */}
        <header className="relative z-30 border-b border-black dark:border-stone-800 bg-white/70 dark:bg-stone-900/70 backdrop-blur-md px-6 py-4 flex justify-between items-center">
          
          {/* Logo only for mobile viewport */}
          <div className="md:hidden flex items-center gap-2 text-[#E32652]">
            <Icon name="storefront" className="text-xl" />
            <span className="font-display text-lg font-black uppercase tracking-tight">
              Glossa <span className="italic font-serif font-normal text-black dark:text-white lowercase">Market</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <span className="text-xs font-bold font-sans uppercase tracking-widest text-gray-500 dark:text-stone-400">
              {t("market.providerDashboard")}
            </span>
          </div>

          {/* Right Header actions */}
          <div className="flex items-center gap-4">
            
            {/* Wallet Balance widget */}
            <Link 
              to="/wallet" 
              className="flex items-center gap-2 px-3 py-1.5 border-2 border-black dark:border-stone-700 bg-white dark:bg-stone-800 shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#3a3a3a]"
            >
              <Icon name="account_balance_wallet" className="text-black dark:text-stone-200" />
              <span className="text-xs font-bold text-black dark:text-stone-100 font-mono">
                {balance} TJS
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Main Content Workspace viewport */}
        <div id="main-content" className="max-w-7xl mx-auto px-6 py-10 relative z-10">
          <Outlet />
        </div>
      </main>
    </>
  );
}
