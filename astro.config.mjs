// @ts-check
import { defineConfig, envField } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      // Add react-dom/server as an external module,
      // so it's not bundled during SSR
      // This can sometimes help with React 18+ SSR issues in non-node environments
      external: ["react-dom/server"],
      // Ensure that it's not treated as a CJS module if it does get processed
      noExternal: ["react-dom/server.browser"],
    },
  },
  adapter: cloudflare(),
  experimental: { session: true },
  env: {
    schema: {
      SUPABASE_URL: envField.string({ context: "server", access: "secret" }),
      SUPABASE_KEY: envField.string({ context: "server", access: "secret" }),
      PUBLIC_SUPABASE_URL: envField.string({ context: "client", access: "public" }),
      PUBLIC_SUPABASE_ANON_KEY: envField.string({ context: "client", access: "public" }),
      OPENROUTER_API_KEY: envField.string({ context: "server", access: "secret" }),
      SUPABASE_SERVICE_ROLE_KEY: envField.string({ context: "server", access: "secret" }),
      E2E_USERNAME_ID: envField.string({ context: "server", access: "secret", optional: true }),
      E2E_USERNAME: envField.string({ context: "server", access: "secret", optional: true }),
      E2E_PASSWORD: envField.string({ context: "server", access: "secret", optional: true }),
    },
  },
});
