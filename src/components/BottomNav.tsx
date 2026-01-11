import { NavLink, useLocation } from "react-router-dom";
import { Home, Fish, Map as MapIcon, BarChart2, Settings } from "lucide-react";
import clsx from "clsx";
import "../styles/components/BottomNav.css";

/** Light haptic tap for navigation */
const triggerHaptic = () => {
  if ("vibrate" in navigator) {
    navigator.vibrate(15); // Very subtle tap
  }
};

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/log", icon: Fish, label: "Log" },
  { to: "/map", icon: MapIcon, label: "Map" },
  { to: "/stats", icon: BarChart2, label: "Stats" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function BottomNav() {
  const location = useLocation();

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

      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => clsx("nav-item", { active: isActive })}
          onClick={triggerHaptic}
        >
          <Icon size={24} />
          <span className="nav-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
