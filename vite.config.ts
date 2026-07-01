import * as Vite from "vite"
import ChildProcess from "node:child_process";
import ReactPlugin from "@vitejs/plugin-react";
import TailwindPlugin from "@tailwindcss/vite";
import Path from "path";

function getCommitHash(): string {
  try {
    return ChildProcess.execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "N/A";
  }
}

export default Vite.defineConfig({
    plugins: [ReactPlugin(), TailwindPlugin()],

    server: {
        allowedHosts: ["0284ee47.sirplancake.dev"]
    },

    resolve: {
        alias: {
            "@": Path.resolve(__dirname, "./src"),
        },
    },

    define: {
        COMMIT_HASH: JSON.stringify(getCommitHash()),
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
});