import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages deployment: set base to repo name if GITHUB_PAGES env is set
  // For custom domain or root deployment, leave as '/'
  base: process.env.GITHUB_PAGES ? "/catchpoint/" : "/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      includeAssets: ["icons/icon.svg"],
      manifest: {
        name: "Catchpoint",
        short_name: "Catchpoint",
        description: "Offline-first fishing log",
        theme_color: "#0f3460",
        background_color: "#ffffff",
        display: "standalone",
        start_url: process.env.GITHUB_PAGES ? "/catchpoint/" : "/",
        icons: [
          {
            src: "icons/icon.svg",
            sizes: "192x192 512x512",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
