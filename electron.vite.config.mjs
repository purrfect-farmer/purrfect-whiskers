import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import { resolve } from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills";

function forceExternalOverride(external) {
  return {
    name: "force-external-override",
    config(config, { command }) {
      if (!config.build) config.build = {};
      if (!config.build.rollupOptions) config.build.rollupOptions = {};

      config.build.rollupOptions.external = external;
    },
  };
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin(), forceExternalOverride(["electron"])],
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
      },
    },
    plugins: [
      /** Plugins */
      react(),
      tailwindcss(),
      nodePolyfills({
        globals: {
          Buffer: false,
        },
      }),
    ],
  },
});
