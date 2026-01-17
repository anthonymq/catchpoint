import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import { AuthProvider } from "./components/AuthProvider";
import Home from "./pages/Home";
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
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/auth/sign-in" element={<SignIn />} />
          <Route path="/auth/sign-up" element={<SignUp />} />
          <Route path="/auth/verify-email" element={<VerifyEmail />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />

          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/log" element={<Log />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/catch/:id" element={<CatchDetail />} />
            <Route path="/profile/:userId" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
