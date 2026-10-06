import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { VitePWA } from "vite-plugin-pwa";

// PRIMARY production build = normal multi-file Vite build + installable PWA.
// The old single-file HTML build is kept ONLY as an optional secondary/export
// target, activated explicitly with `BUILD_SINGLEFILE=true npm run build`.
// It is never combined with the PWA plugin (a single inlined HTML file
// cannot host a separate manifest.webmanifest / service worker).
const singleFileBuild = process.env.BUILD_SINGLEFILE === "true";

export default defineConfig({
  plugins: [
    react(),
    ...(singleFileBuild
      ? [viteSingleFile()]
      : [
          VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["icons/icon-192.png", "icons/icon-512.png"],
            manifest: {
              name: "BioVerse",
              short_name: "BioVerse",
              description:
                "BioVerse — Karnataka PU Biology e-learning platform for KCET/NEET preparation, with a Virtual Biology Lab, Diagram Learning Center, and AI Tutor.",
              start_url: "/",
              scope: "/",
              display: "standalone",
              background_color: "#0A1628",
              theme_color: "#10B981",
              orientation: "portrait-primary",
              icons: [
                {
                  src: "/icons/icon-192.png",
                  sizes: "192x192",
                  type: "image/png",
                  purpose: "any",
                },
                {
                  src: "/icons/icon-512.png",
                  sizes: "512x512",
                  type: "image/png",
                  purpose: "any",
                },
                {
                  src: "/icons/maskable-icon-192.png",
                  sizes: "192x192",
                  type: "image/png",
                  purpose: "maskable",
                },
                {
                  src: "/icons/maskable-icon-512.png",
                  sizes: "512x512",
                  type: "image/png",
                  purpose: "maskable",
                },
              ],
            },
            workbox: {
              // Only precache/serve built static app assets. Never let the
              // service worker intercept or cache Supabase, auth, or AI
              // Tutor network calls — those must always hit the network.
              globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
              navigateFallbackDenylist: [/^\/functions\//],
              // The default 2 MiB workbox limit no longer covers the main
              // bundle now that DG10's data/SVG pushed it just over that
              // line (real added content, not bloat). Raised with a small
              // headroom margin so the next diagram or two don't require
              // touching this again immediately.
              maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
              runtimeCaching: [
                {
                  urlPattern: ({ url }: { url: URL }) =>
                    url.hostname.endsWith("supabase.co"),
                  handler: "NetworkOnly",
                },
              ],
            },
            devOptions: { enabled: false },
          }),
        ]),
  ],
  build: {
    // The app is intentionally one large main chunk (~2.1 MB: React + Three.js
    // Virtual Lab + all diagram data) plus a ~1.1 MB pdf.js worker. These are
    // expected, so the default 500 kB warning is raised just above them.
    chunkSizeWarningLimit: 2500,
  },
  server: { port: 5173 },
});
