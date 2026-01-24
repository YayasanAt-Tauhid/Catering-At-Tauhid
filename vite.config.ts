import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(
      Boolean,
    ),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Define env variables to be replaced in HTML
    define: {
      "import.meta.env.VITE_MIDTRANS_CLIENT_KEY": JSON.stringify(
        env.VITE_MIDTRANS_CLIENT_KEY || "SB-Mid-client-8LumxhWCUi6hVWMv",
      ),
    },
  };
});
