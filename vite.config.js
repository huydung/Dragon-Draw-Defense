import { readFile, writeFile } from "node:fs/promises";
import { defineConfig } from "vite";
import { replaceGestureTemplatesInConfig } from "./tools/configTemplateWriter.js";

const CONFIG_PATH = new URL("./src/config.js", import.meta.url);
const SAVE_TEMPLATES_ENDPOINT = "/__sandbox/save-templates";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        game: new URL("./index.html", import.meta.url).pathname,
        sandbox: new URL("./sandbox.html", import.meta.url).pathname
      }
    }
  },
  plugins: [sandboxConfigWriterPlugin()]
});

function sandboxConfigWriterPlugin() {
  return {
    name: "sandbox-config-writer",
    configureServer(server) {
      server.middlewares.use(SAVE_TEMPLATES_ENDPOINT, async (request, response) => {
        if (request.method !== "POST") {
          response.statusCode = 405;
          response.end(JSON.stringify({ ok: false, error: "POST required." }));
          return;
        }

        try {
          const body = await readRequestBody(request);
          const payload = JSON.parse(body);
          const configSource = await readFile(CONFIG_PATH, "utf8");
          const nextSource = replaceGestureTemplatesInConfig(configSource, payload.templates);
          await writeFile(CONFIG_PATH, nextSource);
          response.setHeader("Content-Type", "application/json");
          response.end(JSON.stringify({ ok: true }));
        } catch (error) {
          response.statusCode = 400;
          response.setHeader("Content-Type", "application/json");
          response.end(JSON.stringify({ ok: false, error: error.message }));
        }
      });
    }
  };
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}
