import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const distDir = resolve(import.meta.dirname, "../dist");
const indexFile = resolve(distDir, "index.html");
const fallbackFile = resolve(distDir, "404.html");

if (!existsSync(indexFile)) {
  throw new Error("Cannot create SPA fallback because dist/index.html does not exist.");
}

copyFileSync(indexFile, fallbackFile);
