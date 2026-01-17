import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Rss,
  Compass,
  MessageCircle,
  Fish,
  Map as MapIcon,
  BarChart2,
  Settings,
} from "lucide-react";
import clsx from "clsx";
import { useTranslation } from "@/i18n";
import "../styles/components/BottomNav.css";

/** Light haptic tap for navigation */
const triggerHaptic = () => {
  if ("vibrate" in navigator) {
    navigator.vibrate(15); // Very subtle tap
  }
};

export default function BottomNav() {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { to: "/", icon: Home, labelKey: "nav.home" },
    { to: "/feed", icon: Rss, labelKey: "nav.feed" },
    { to: "/discover", icon: Compass, labelKey: "nav.discover" },
    { to: "/messages", icon: MessageCircle, labelKey: "nav.messages" },
    { to: "/log", icon: Fish, labelKey: "nav.log" },
    { to: "/map", icon: MapIcon, labelKey: "nav.map" },
    { to: "/stats", icon: BarChart2, labelKey: "nav.stats" },
    { to: "/settings", icon: Settings, labelKey: "nav.settings" },
  ];

  // Calculate active index for sliding indicator
  const activeIndex = navItems.findIndex((item) => {
    if (item.to === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(item.to);
  });

  return (
    <nav className="bottom-nav">
      {/* Sliding indicator */}
      <div
        className="nav-indicator"
        style={{
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />

      {navItems.map(({ to, icon: Icon, labelKey }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => clsx("nav-item", { active: isActive })}
          onClick={triggerHaptic}
        >
          <Icon size={24} />
          <span className="nav-label">{t(labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
