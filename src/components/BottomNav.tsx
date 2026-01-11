import { NavLink } from "react-router-dom";
import { Home, Fish, Map as MapIcon, BarChart2, Settings } from "lucide-react";
import clsx from "clsx";
import "../styles/components/BottomNav.css";

export default function BottomNav() {
  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/log", icon: Fish, label: "Log" },
    { to: "/map", icon: MapIcon, label: "Map" },
    { to: "/stats", icon: BarChart2, label: "Stats" },
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => clsx("nav-item", { active: isActive })}
        >
          <Icon size={24} />
          <span className="nav-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
