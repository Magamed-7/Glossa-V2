import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Achievements from "./pages/Achievements.jsx";
import About from "./pages/About.jsx";
import AuthorStudio from "./pages/AuthorStudio.jsx";
import Contact from "./pages/Contact.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Faq from "./pages/Faq.jsx";
import Landing from "./pages/Landing.jsx";
import GrammarHub from "./pages/GrammarHub.jsx";
import GrammarLesson from "./pages/GrammarLesson.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import Login from "./pages/Login.jsx";
import Login2fa from "./pages/Login2fa.jsx";
import Marketplace from "./pages/Marketplace.jsx";
import MarketplaceStory from "./pages/MarketplaceStory.jsx";
import MyProfile from "./pages/MyProfile.jsx";
import NotFound from "./pages/NotFound.jsx";
import Notifications from "./pages/Notifications.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import PasswordReset from "./pages/PasswordReset.jsx";
import Pricing from "./pages/Pricing.jsx";
import Privacy from "./pages/Privacy.jsx";
import PublicProfile from "./pages/PublicProfile.jsx";
import Register from "./pages/Register.jsx";
import SearchResults from "./pages/SearchResults.jsx";
import Settings from "./pages/Settings.jsx";
import SpacedRepetition from "./pages/SpacedRepetition.jsx";
import StoriesCatalog from "./pages/StoriesCatalog.jsx";
import StripeReturn from "./pages/StripeReturn.jsx";
import Terms from "./pages/Terms.jsx";
import TutorScenarios from "./pages/TutorScenarios.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import Wallet from "./pages/Wallet.jsx";
import WordDeck from "./pages/WordDeck.jsx";
import AppLayout from "./components/layout/AppLayout.jsx";
import MarketplaceLayout from "./components/layout/MarketplaceLayout.jsx";
import MarketplaceInbox from "./pages/MarketplaceInbox.jsx";
import MarketplaceAnalytics from "./pages/MarketplaceAnalytics.jsx";
import MarketplaceServices from "./pages/MarketplaceServices.jsx";
import MarketplaceListingEditor from "./pages/MarketplaceListingEditor.jsx";
import PublicLayout from "./components/layout/PublicLayout.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import GuestRoute from "./components/GuestRoute.jsx";
import { RouteErrorBoundary } from "./components/ErrorBoundary.jsx";

// Тяжёлые страницы — отдельным чанком: редактор историй (крупная форма + загрузка
// обложки), читалка (клик по словам, попап перевода) и чат ИИ-тренажёра (WebSocket).
const StoryEditor = lazy(() => import("./pages/StoryEditor.jsx"));
const StoryReader = lazy(() => import("./pages/StoryReader.jsx"));
const TutorChat = lazy(() => import("./pages/TutorChat.jsx"));

// react-router-dom здесь работает в декларативном режиме (<BrowserRouter><Routes>),
// а не через createBrowserRouter/RouterProvider — только там существует errorElement.
// Та же изоляция сбоя одной страницы достигается оборачиванием каждого листового
// маршрута в свою собственную границу ошибок; Suspense — тот же полноэкранный
// кремовый экран, что и при старте приложения, для лениво загружаемых страниц выше.
function page(Component) {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
        <Component />
      </Suspense>
    </RouteErrorBoundary>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={page(Landing)} />
        <Route path="/about" element={page(About)} />
        <Route path="/faq" element={page(Faq)} />
        <Route path="/privacy" element={page(Privacy)} />
        <Route path="/terms" element={page(Terms)} />
        <Route path="/contact" element={page(Contact)} />
      </Route>

      <Route element={<GuestRoute />}>
        <Route path="/login" element={page(Login)} />
        <Route path="/login/2fa" element={page(Login2fa)} />
        <Route path="/register" element={page(Register)} />
      </Route>

      <Route path="/verify-email" element={page(VerifyEmail)} />
      <Route path="/password-reset" element={page(PasswordReset)} />

      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={page(Onboarding)} />

        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={page(Dashboard)} />
          <Route path="/deck" element={page(WordDeck)} />
          <Route path="/review" element={page(SpacedRepetition)} />
          <Route path="/stories" element={page(StoriesCatalog)} />
          <Route path="/stories/:id" element={page(StoryReader)} />
          <Route path="/grammar" element={page(GrammarHub)} />
          <Route path="/grammar/:id" element={page(GrammarLesson)} />
          <Route path="/tutor" element={page(TutorScenarios)} />
          <Route path="/tutor/chat" element={page(TutorChat)} />
          <Route path="/leaderboard" element={page(Leaderboard)} />
          <Route path="/marketplace/:id" element={page(MarketplaceStory)} />
          <Route path="/studio" element={page(AuthorStudio)} />
          <Route path="/studio/new" element={page(StoryEditor)} />
          <Route path="/studio/:id/edit" element={page(StoryEditor)} />
          <Route path="/profile" element={page(MyProfile)} />
          <Route path="/profile/:userId" element={page(PublicProfile)} />
          <Route path="/achievements" element={page(Achievements)} />
          <Route path="/pricing" element={page(Pricing)} />
          <Route path="/wallet" element={page(Wallet)} />
          <Route path="/wallet/return" element={page(StripeReturn)} />
          <Route path="/notifications" element={page(Notifications)} />
          <Route path="/settings" element={page(Settings)} />
          <Route path="/search" element={page(SearchResults)} />
        </Route>

        <Route element={<MarketplaceLayout />}>
          <Route path="/marketplace" element={page(Marketplace)} />
          <Route path="/marketplace/inbox" element={page(MarketplaceInbox)} />
          <Route path="/marketplace/analytics" element={page(MarketplaceAnalytics)} />
          <Route path="/marketplace/services" element={page(MarketplaceServices)} />
          <Route path="/marketplace/services/new" element={page(MarketplaceListingEditor)} />
          <Route path="/marketplace/services/:id/edit" element={page(MarketplaceListingEditor)} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
