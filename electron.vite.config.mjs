import solidPlugin from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import { resolve } from "path";

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
    build: {
      rollupOptions: {
        input: {
          controls: resolve(__dirname, "src/renderer/controls.html"),
          modal: resolve(__dirname, "src/renderer/modal.html"),
          navigation: resolve(__dirname, "src/renderer/navigation.html"),
        },
      },
    },
    plugins: [solidPlugin(), tailwindcss()],
  },
});
