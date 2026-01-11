import { useEffect, useRef } from "react";
import { useSettingsStore } from "@/stores/settingsStore";

export function useTheme() {
  const theme = useSettingsStore((state) => state.theme);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = (withTransition = false) => {
      const systemTheme = mediaQuery.matches ? "dark" : "light";
      const effectiveTheme = theme === "system" ? systemTheme : theme;

      // Add transition class for smooth theme switching (skip on initial render)
      if (withTransition) {
        root.classList.add("theme-transition");
        // Remove class after transition completes to avoid affecting other animations
        setTimeout(() => {
          root.classList.remove("theme-transition");
        }, 350);
      }

      if (effectiveTheme === "dark") {
        root.setAttribute("data-theme", "dark");
      } else {
        root.removeAttribute("data-theme");
      }
    };

    // Apply initially without transition, subsequently with transition
    if (isFirstRender.current) {
      applyTheme(false);
      isFirstRender.current = false;
    } else {
      applyTheme(true);
    }

    // Listen for system changes if in system mode
    const listener = () => {
      if (theme === "system") {
        applyTheme(true);
      }
    };

    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, [theme]);
}
