import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "electron-vite";
import { resolve } from "path";

export default defineConfig({
  root: resolve("src/browser"),
  build: {
    outDir: resolve("out/browser"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        ["webui"]: resolve("src/browser/webui.html"),
        ["new-tab"]: resolve("src/browser/new-tab.html"),
      },
    },
  },
  plugins: [tailwindcss(), solid()],
});
