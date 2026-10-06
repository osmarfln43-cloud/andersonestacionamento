import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { validateSupabaseEnvironment } from "./scripts/validate-supabase-env.mjs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  validateSupabaseEnvironment(loadEnv(mode, process.cwd(), "VITE_"));
  return {
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  };
});
