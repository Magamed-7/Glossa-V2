import { Route, Routes } from "react-router-dom";
import Achievements from "./pages/Achievements.jsx";
import AuthorStudio from "./pages/AuthorStudio.jsx";
import Dashboard from "./pages/Dashboard.jsx";
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
import PublicProfile from "./pages/PublicProfile.jsx";
import Register from "./pages/Register.jsx";
import SearchResults from "./pages/SearchResults.jsx";
import Settings from "./pages/Settings.jsx";
import SpacedRepetition from "./pages/SpacedRepetition.jsx";
import StoriesCatalog from "./pages/StoriesCatalog.jsx";
import StoryEditor from "./pages/StoryEditor.jsx";
import StoryReader from "./pages/StoryReader.jsx";
import StripeReturn from "./pages/StripeReturn.jsx";
import TutorChat from "./pages/TutorChat.jsx";
import TutorScenarios from "./pages/TutorScenarios.jsx";
import UiKit from "./pages/UiKit.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import Wallet from "./pages/Wallet.jsx";
import WordDeck from "./pages/WordDeck.jsx";
import AppLayout from "./components/layout/AppLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import GuestRoute from "./components/GuestRoute.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/login/2fa" element={<Login2fa />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/password-reset" element={<PasswordReset />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<Onboarding />} />

        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/deck" element={<WordDeck />} />
          <Route path="/review" element={<SpacedRepetition />} />
          <Route path="/stories" element={<StoriesCatalog />} />
          <Route path="/stories/:id" element={<StoryReader />} />
          <Route path="/grammar" element={<GrammarHub />} />
          <Route path="/grammar/:id" element={<GrammarLesson />} />
          <Route path="/tutor" element={<TutorScenarios />} />
          <Route path="/tutor/chat" element={<TutorChat />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/marketplace/:id" element={<MarketplaceStory />} />
          <Route path="/studio" element={<AuthorStudio />} />
          <Route path="/studio/new" element={<StoryEditor />} />
          <Route path="/studio/:id/edit" element={<StoryEditor />} />
          <Route path="/profile" element={<MyProfile />} />
          <Route path="/profile/:userId" element={<PublicProfile />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/wallet/return" element={<StripeReturn />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/search" element={<SearchResults />} />
        </Route>
      </Route>

      <Route path="/ui-kit" element={<UiKit />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
