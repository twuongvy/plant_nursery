import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const srcDir = fileURLToPath(new URL("./src", import.meta.url));
const zodEntry = fileURLToPath(
  new URL("./node_modules/zod/index.js", import.meta.url),
);

export default defineConfig({
  plugins: [
    {
      name: "resolve-zod",
      enforce: "pre",
      resolveId(id: string) {
        if (id === "zod") return zodEntry;
      },
    },
    react(),
    tailwindcss(),
  ],
  resolve: {
    conditions: ["import"],
    alias: {
      "@": srcDir,
      zod: zodEntry,
    },
  },
  optimizeDeps: {
    include: ["zod", "@hookform/resolvers/zod"],
  },
  server: {
    port: 5173,
  },
});
