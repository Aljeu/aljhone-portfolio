import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  build: {
    rolldownOptions: {
      input: {
        home: fileURLToPath(new URL("./index.html", import.meta.url)),
        journal: fileURLToPath(new URL("./journal.html", import.meta.url)),
        projects: fileURLToPath(new URL("./projects.html", import.meta.url)),
      },
    },
  },
});
