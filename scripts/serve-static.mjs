import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, normalize, resolve } from "node:path";

const root = resolve(process.env.STATIC_ROOT ?? "out");
const basePath = process.env.STATIC_BASE_PATH ?? "";
const port = Number.parseInt(process.env.STATIC_PORT ?? "4173", 10);
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp4": "video/mp4",
  ".ogg": "audio/ogg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".vtt": "text/vtt; charset=utf-8",
  ".webm": "video/webm",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function getSafePath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split("?")[0] ?? "/");
  const mountedPath = basePath !== "" && (decodedPath === basePath || decodedPath.startsWith(`${basePath}/`))
    ? decodedPath.slice(basePath.length)
    : decodedPath;
  const relativePath = mountedPath.replace(/^\/+/, "");
  const filePath = resolve(root, normalize(relativePath));
  return filePath === root || filePath.startsWith(`${root}/`) || filePath.startsWith(`${root}\\`)
    ? filePath
    : null;
}

async function resolveFilePath(urlPath) {
  const requestedPath = getSafePath(urlPath);
  if (requestedPath === null) return null;

  const candidates = [
    requestedPath,
    resolve(requestedPath, "index.html"),
    `${requestedPath}.html`,
    resolve(root, "404.html"),
  ];
  for (const candidate of candidates) {
    try {
      if ((await stat(candidate)).isFile()) return candidate;
    } catch {
      // Continue to the next static-export candidate.
    }
  }
  return null;
}

const server = createServer(async (request, response) => {
  try {
    const filePath = await resolveFilePath(request.url ?? "/");
    if (filePath === null) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "cache-control": "no-cache",
      "content-type": contentTypes[extname(filePath).toLowerCase()] ?? "application/octet-stream",
    });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    response.end("Internal server error");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Static export preview: http://127.0.0.1:${port}`);
});
