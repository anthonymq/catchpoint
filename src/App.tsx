import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import { AuthProvider } from "./components/AuthProvider";
import { CloudSyncProvider } from "./components/CloudSyncProvider";
import { MigrationProvider } from "./components/MigrationProvider";
import { LikersModal } from "./components/LikersModal";
import { CommentsModal } from "./components/CommentsModal";
import { ShareModalContainer } from "./components/ShareModalContainer";
import Home from "./pages/Home";
import Feed from "./pages/Feed";
import Discover from "./pages/Discover";
import Notifications from "./pages/Notifications";
import Messages from "./pages/Messages";
import Chat from "./pages/Chat";
import Log from "./pages/Log";
import MapPage from "./pages/Map";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import CatchDetail from "./pages/CatchDetail";
import Profile from "./pages/Profile";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ForgotPassword from "./pages/auth/ForgotPassword";
import { useTheme } from "./hooks/useTheme";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import { syncService } from "./services/sync";

function App() {
  useTheme();
  const isOnline = useNetworkStatus();

  useEffect(() => {
    if (isOnline) {
      syncService.processWeatherQueue();
    }
  }, [isOnline]);

  const basename = import.meta.env.BASE_URL;

  return (
    <AuthProvider>
      <CloudSyncProvider>
        <MigrationProvider>
          <BrowserRouter basename={basename}>
            <Routes>
              <Route path="/auth/sign-in" element={<SignIn />} />
              <Route path="/auth/sign-up" element={<SignUp />} />
              <Route path="/auth/verify-email" element={<VerifyEmail />} />
              <Route
                path="/auth/forgot-password"
                element={<ForgotPassword />}
              />

              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/feed" element={<Feed />} />
                <Route path="/discover" element={<Discover />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/messages/:conversationId" element={<Chat />} />
                <Route path="/log" element={<Log />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/catch/:id" element={<CatchDetail />} />
                <Route path="/profile/:userId" element={<Profile />} />
              </Route>
            </Routes>
            <LikersModal />
            <CommentsModal />
            <ShareModalContainer />
          </BrowserRouter>
        </MigrationProvider>
      </CloudSyncProvider>
    </AuthProvider>
  );
}

export default App;
