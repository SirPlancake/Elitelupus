import {defineConfig} from "vite";
import {execSync} from "node:child_process";
import React from "@vitejs/plugin-react";
import TailwindCSS from "@tailwindcss/vite";
import Path from "path";

export default defineConfig({
  plugins: [React(), TailwindCSS()],

  resolve: {
    alias: {
      "@": Path.resolve(__dirname, "./src"),
    },
  },

  define: {
    COMMIT_HASH: JSON.stringify(execSync("git rev-parse --short HEAD").toString().trim())
  },

  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(ID) {
          if (ID.includes("node_modules")) {
            const Parts = ID.split("node_modules/")[1];
            const Package = Parts.split("/")[0].startsWith("@") ? Parts.split("/").slice(0, 2).join("/") : Parts.split("/")[0];
            return `${Package}`;
          };
        },
      },
    },
  },
})