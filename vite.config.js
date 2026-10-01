import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const page = (name) => fileURLToPath(new URL(`./${name}.html`, import.meta.url));

// Inlines <!-- include: name --> with partials/name.html so the nav, page
// transition and footer live in one place across every page.
const htmlPartials = () => ({
  name: "html-partials",
  transformIndexHtml: {
    order: "pre",
    handler: (html) =>
      html.replace(/<!--\s*include:\s*([\w-]+)\s*-->/g, (_, name) =>
        readFileSync(`${root}partials/${name}.html`, "utf8")
      ),
  },
  handleHotUpdate({ file, server }) {
    if (file.includes("/partials/")) server.ws.send({ type: "full-reload" });
  },
});

export default defineConfig({
  plugins: [htmlPartials()],
  build: {
    rollupOptions: {
      input: {
        main: page("index"),
        portfolio: page("portfolio"),
        team: page("team"),
        contact: page("contact"),
      },
    },
  },
});
