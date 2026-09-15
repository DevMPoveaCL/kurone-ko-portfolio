import { spawnSync } from "node:child_process";
import { access, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const target = process.argv[2];
if (target !== "cloudflare" && target !== "github-pages") {
  throw new Error("Usage: node scripts/build-static.mjs <cloudflare|github-pages>");
}

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const result = spawnSync(command, ["exec", "next", "build"], {
  env: {
    ...process.env,
    DEPLOY_TARGET: target === "github-pages" ? "github-pages" : "root",
  },
  shell: process.platform === "win32",
  stdio: "inherit",
});

if (result.error !== undefined) throw result.error;
if ((result.status ?? 1) !== 0) process.exit(result.status ?? 1);

const requiredOutput = ["index.html", "portfolio/index.html", "404.html"];
for (const relativePath of requiredOutput) {
  await access(resolve("out", relativePath));
}

if (target === "github-pages") {
  await writeFile(resolve("out", ".nojekyll"), "", "utf8");
}

console.log(`Verified ${target} static export: ${requiredOutput.join(", ")}${target === "github-pages" ? ", .nojekyll" : ""}`);
