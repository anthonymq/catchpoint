import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Log from "./pages/Log";
import MapPage from "./pages/Map";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import CatchDetail from "./pages/CatchDetail";
import { useTheme } from "./hooks/useTheme";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import { syncService } from "./services/sync";

function App() {
  useTheme();
  const isOnline = useNetworkStatus();

  // Trigger weather sync when coming back online
  useEffect(() => {
    if (isOnline) {
      syncService.processWeatherQueue();
    }
  }, [isOnline]);

  // Use Vite's BASE_URL for GitHub Pages deployment
  const basename = import.meta.env.BASE_URL;

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/log" element={<Log />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/catch/:id" element={<CatchDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
