import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { resolve } from "node:path";

const scriptDirectory = resolve(import.meta.dirname, "..");
const gitEnvironment = { ...process.env };

for (const variable of [
  "GIT_DIR",
  "GIT_WORK_TREE",
  "GIT_COMMON_DIR",
  "GIT_INDEX_FILE",
  "GIT_OBJECT_DIRECTORY",
  "GIT_ALTERNATE_OBJECT_DIRECTORIES",
  "GIT_NAMESPACE",
  "GIT_SHALLOW_FILE",
  "GIT_GRAFT_FILE",
  "GIT_REPLACE_REF_BASE",
  "GIT_NO_REPLACE_OBJECTS",
  "GIT_DISCOVERY_ACROSS_FILESYSTEM",
  "GIT_CEILING_DIRECTORIES",
]) {
  delete gitEnvironment[variable];
}
gitEnvironment.GIT_NO_REPLACE_OBJECTS = "1";

function gitAt(directory, args, allowFailure = false) {
  try {
    return execFileSync("git", ["--no-replace-objects", "-C", directory, ...args], {
      encoding: "utf8",
      env: gitEnvironment,
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    if (allowFailure) return undefined;
    const detail = error.stderr?.toString().trim();
    throw new Error(`Git ${args.join(" ")} failed${detail ? `: ${detail}` : ""}`);
  }
}

const repository = realpathSync(gitAt(scriptDirectory, ["rev-parse", "--show-toplevel"]));
const git = (args, allowFailure = false) => gitAt(repository, args, allowFailure);
const assets = {
  "public/assets/intro/kurOpenVault.webm": {
    sha256: "4f012f5122de9f0288cbf678fa83b3628d7573d65b72a1ae0946a5985df554ac",
    minimumSize: 1024,
    isValid(buffer) {
      return buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))
        && buffer.subarray(0, 4096).includes(Buffer.from("webm"));
    },
  },
  "public/assets/intro/kurOpenVault-poster.webp": {
    sha256: "44296306b4912b37b06b53ddb0751c80a48a6f6e2720fa0e7fd4f4f840c40608",
    minimumSize: 128,
    isValid(buffer) {
      return buffer.subarray(0, 4).equals(Buffer.from("RIFF"))
        && buffer.subarray(8, 12).equals(Buffer.from("WEBP"))
        && ["VP8 ", "VP8L", "VP8X"].some((chunk) => buffer.subarray(12, 16).equals(Buffer.from(chunk)));
    },
  },
};

for (const [asset, expected] of Object.entries(assets)) {
  const path = resolve(repository, asset);
  if (!existsSync(path) || !statSync(path).isFile()) throw new Error(`Missing cinematic asset: ${asset}`);

  const buffer = readFileSync(path);
  if (buffer.length < expected.minimumSize) throw new Error(`Cinematic asset is too small: ${asset}`);
  if (!expected.isValid(buffer)) throw new Error(`Invalid cinematic asset signature: ${asset}`);
  if (createHash("sha256").update(buffer).digest("hex") !== expected.sha256) {
    throw new Error(`Unexpected cinematic asset SHA-256: ${asset}`);
  }

  if (git(["check-ignore", "--no-index", "-q", "--", asset], true) !== undefined) {
    throw new Error(`Ignored cinematic asset: ${asset}`);
  }

  const indexHash = git(["rev-parse", "--verify", "--quiet", `:${asset}`], true);
  if (indexHash === undefined) throw new Error(`Untracked cinematic asset: ${asset}`);

  const worktreeHash = git(["hash-object", "--no-filters", "--", asset]);
  if (indexHash !== worktreeHash) throw new Error(`Unstaged cinematic asset: ${asset}`);

  const headHash = git(["rev-parse", "--verify", "--quiet", `HEAD:${asset}`], true);
  if (headHash !== undefined && (headHash !== indexHash || headHash !== worktreeHash)) {
    throw new Error(`Unpublished cinematic asset: ${asset}`);
  }
  if (process.env.CI === "true" && (headHash === undefined || headHash !== indexHash || headHash !== worktreeHash)) {
    throw new Error(`CI requires published cinematic asset: ${asset}`);
  }
}

console.log("Cinematic assets are publishable.");
