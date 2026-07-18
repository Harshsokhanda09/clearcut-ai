import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import crypto from "crypto";

export default defineConfig(async () => {
  const SERVER_SESSION_ID = crypto.randomUUID();
  return {
    plugins: [
      tailwindcss({
        // @ts-expect-error - 'transform' is a valid option to disable lightningcss, not yet in types
        transform: false, // Disable lightningcss to avoid native module issues on Vercel
      }),
      tanstackStart({
        importProtection: {
          behavior: "error",
          client: {
            files: ["**/server/**"],
            specifiers: ["server-only"],
          },
        },
      }),
      nitro(),
      react(),
    ],
    define: {
      "import.meta.env.VITE_SERVER_SESSION_ID": JSON.stringify(SERVER_SESSION_ID),
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    server: {
      host: "0.0.0.0",
      port: 8080,
    },
  };
});
