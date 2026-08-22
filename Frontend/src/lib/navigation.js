export const NAV_ITEMS = [
  { to: "/dashboard", labelKey: "nav.home", icon: "home" },
  { to: "/roadmap", labelKey: "nav.roadmap", icon: "route" },
  { to: "/deck", labelKey: "nav.library", icon: "library_books" },
  { to: "/stories", labelKey: "nav.stories", icon: "auto_stories" },
  { to: "/grammar", labelKey: "nav.grammar", icon: "menu_book" },
  { to: "/tests", labelKey: "nav.tests", icon: "quiz" },
  { to: "/tutor", labelKey: "nav.tutor", icon: "smart_toy" },
  { to: "/messenger", labelKey: "nav.messenger", icon: "chat" },
  { to: "/people", labelKey: "nav.people", icon: "group" },
  { to: "/marketplace", labelKey: "nav.market", icon: "storefront" },
  { to: "/leaderboard", labelKey: "nav.ranking", icon: "leaderboard" },
];

// Те же разделы, что и в боковой панели маркета — для выдвижного меню на телефоне.
export const MARKET_NAV_ITEMS = [
  { to: "/marketplace", labelKey: "market.directory", icon: "storefront", end: true },
  { to: "/marketplace/stories", labelKey: "market.storiesNav", icon: "auto_stories" },
  { to: "/marketplace/analytics", labelKey: "market.analytics", icon: "analytics" },
  { to: "/marketplace/services", labelKey: "market.myServices", icon: "work" },
  { to: "/marketplace/inbox", labelKey: "market.inbox", icon: "inbox" },
  { to: "/marketplace/pricing", labelKey: "market.pricing", icon: "payments" },
  { to: "/dashboard", labelKey: "market.return", icon: "arrow_back" },
];
