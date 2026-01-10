import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Log from "./pages/Log";
import MapPage from "./pages/Map";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import CatchDetail from "./pages/CatchDetail";

function App() {
  return (
    <BrowserRouter>
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
