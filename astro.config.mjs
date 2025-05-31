// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap(), cloudflare()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: cloudflare(),
  experimental: { session: true },
});
