import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import NotFound from "./pages/NotFound.jsx";
import AppLayout from "./components/layout/AppLayout.jsx";
import MarketplaceLayout from "./components/layout/MarketplaceLayout.jsx";
import PublicLayout from "./components/layout/PublicLayout.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import GuestRoute from "./components/GuestRoute.jsx";
import { RouteErrorBoundary } from "./components/ErrorBoundary.jsx";

// Каждая страница — отдельный чанк: раньше все ~40 страниц лежали в одном входном
// бандле (1.16 МБ до gzip), и он целиком грузился прежде, чем отрисуется хоть один
// маршрут, вплоть до страницы логина. lazy() грузит только тот код, который реально
// нужен для текущего маршрута.
const Achievements = lazy(() => import("./pages/Achievements.jsx"));
const About = lazy(() => import("./pages/About.jsx"));
const AuthorStudio = lazy(() => import("./pages/AuthorStudio.jsx"));
const Contact = lazy(() => import("./pages/Contact.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Faq = lazy(() => import("./pages/Faq.jsx"));
const Landing = lazy(() => import("./pages/Landing.jsx"));
const GrammarHub = lazy(() => import("./pages/GrammarHub.jsx"));
const GrammarLesson = lazy(() => import("./pages/GrammarLesson.jsx"));
const Leaderboard = lazy(() => import("./pages/Leaderboard.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Login2fa = lazy(() => import("./pages/Login2fa.jsx"));
const Marketplace = lazy(() => import("./pages/Marketplace.jsx"));
const Messenger = lazy(() => import("./pages/Messenger.jsx"));
const MarketplaceStory = lazy(() => import("./pages/MarketplaceStory.jsx"));
const MarketplaceStories = lazy(() => import("./pages/MarketplaceStories.jsx"));
const MyProfile = lazy(() => import("./pages/MyProfile.jsx"));
const Notifications = lazy(() => import("./pages/Notifications.jsx"));
const Onboarding = lazy(() => import("./pages/Onboarding.jsx"));
const PasswordReset = lazy(() => import("./pages/PasswordReset.jsx"));
const People = lazy(() => import("./pages/People.jsx"));
const Pricing = lazy(() => import("./pages/Pricing.jsx"));
const Privacy = lazy(() => import("./pages/Privacy.jsx"));
const PublicProfile = lazy(() => import("./pages/PublicProfile.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const Roadmap = lazy(() => import("./pages/Roadmap.jsx"));
const CourseUnitDetail = lazy(() => import("./pages/CourseUnitDetail.jsx"));
const UnitTest = lazy(() => import("./pages/UnitTest.jsx"));
const LevelTest = lazy(() => import("./pages/LevelTest.jsx"));
const TestsHub = lazy(() => import("./pages/TestsHub.jsx"));
const VocabSizeTest = lazy(() => import("./pages/VocabSizeTest.jsx"));
const GenerateStoryPage = lazy(() => import("./pages/GenerateStoryPage.jsx"));
const PracticeTestRun = lazy(() => import("./pages/PracticeTestRun.jsx"));
const StoryTestRun = lazy(() => import("./pages/StoryTestRun.jsx"));
const SearchResults = lazy(() => import("./pages/SearchResults.jsx"));
const Settings = lazy(() => import("./pages/Settings.jsx"));
const SpacedRepetition = lazy(() => import("./pages/SpacedRepetition.jsx"));
const StoriesCatalog = lazy(() => import("./pages/StoriesCatalog.jsx"));
const StripeReturn = lazy(() => import("./pages/StripeReturn.jsx"));
const Terms = lazy(() => import("./pages/Terms.jsx"));
const TutorScenarios = lazy(() => import("./pages/TutorScenarios.jsx"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail.jsx"));
const Wallet = lazy(() => import("./pages/Wallet.jsx"));
const WordDeck = lazy(() => import("./pages/WordDeck.jsx"));
const Missions = lazy(() => import("./pages/Missions.jsx"));
const MarketplaceInbox = lazy(() => import("./pages/MarketplaceInbox.jsx"));
const MarketplaceAnalytics = lazy(() => import("./pages/MarketplaceAnalytics.jsx"));
const MarketplaceServices = lazy(() => import("./pages/MarketplaceServices.jsx"));
const MarketplaceServiceDetail = lazy(() => import("./pages/MarketplaceServiceDetail.jsx"));
const MarketplaceListingEditor = lazy(() => import("./pages/MarketplaceListingEditor.jsx"));
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
          <Route path="/roadmap" element={page(Roadmap)} />
          <Route path="/roadmap/units/:id" element={page(CourseUnitDetail)} />
          <Route path="/roadmap/units/:id/test" element={page(UnitTest)} />
          <Route path="/roadmap/level-test/:level/:type" element={page(LevelTest)} />
          <Route path="/deck" element={page(WordDeck)} />
          <Route path="/missions" element={page(Missions)} />
          <Route path="/review" element={page(SpacedRepetition)} />
          <Route path="/stories" element={page(StoriesCatalog)} />
          <Route path="/stories/:id" element={page(StoryReader)} />
          <Route path="/grammar" element={page(GrammarHub)} />
          <Route path="/grammar/:id" element={page(GrammarLesson)} />
          <Route path="/tests" element={page(TestsHub)} />
          <Route path="/tests/vocab-size" element={page(VocabSizeTest)} />
          <Route path="/vocabulary/generate-story" element={page(GenerateStoryPage)} />
          <Route path="/tests/practice/run" element={page(PracticeTestRun)} />
          <Route path="/tests/story/:storyId/run" element={page(StoryTestRun)} />
          <Route path="/tutor" element={page(TutorScenarios)} />
          <Route path="/tutor/chat" element={page(TutorChat)} />
          <Route path="/leaderboard" element={page(Leaderboard)} />
          <Route path="/messenger" element={page(Messenger)} />
          <Route path="/messenger/:conversationId" element={page(Messenger)} />
          <Route path="/people" element={page(People)} />
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
          <Route path="/marketplace/stories" element={page(MarketplaceStories)} />
          <Route path="/marketplace/inbox" element={page(MarketplaceInbox)} />
          <Route path="/marketplace/pricing" element={page(Pricing)} />
          <Route path="/marketplace/analytics" element={page(MarketplaceAnalytics)} />
          <Route path="/marketplace/services" element={page(MarketplaceServices)} />
          <Route path="/marketplace/services/new" element={page(MarketplaceListingEditor)} />
          <Route path="/marketplace/services/:id/edit" element={page(MarketplaceListingEditor)} />
          <Route path="/marketplace/services/:id" element={page(MarketplaceServiceDetail)} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
