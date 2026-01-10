import { useEffect } from "react";
import { useSettingsStore } from "@/stores/settingsStore";

export function useTheme() {
  const theme = useSettingsStore((state) => state.theme);

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const systemTheme = mediaQuery.matches ? "dark" : "light";
      const effectiveTheme = theme === "system" ? systemTheme : theme;

      if (effectiveTheme === "dark") {
        root.setAttribute("data-theme", "dark");
      } else {
        root.removeAttribute("data-theme");
      }
    };

    // Apply initially
    applyTheme();

    // Listen for system changes if in system mode
    const listener = () => {
      if (theme === "system") {
        applyTheme();
      }
    };

    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, [theme]);
}
