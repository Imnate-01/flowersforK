import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, relative, resolve } from "node:path";

const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 8787);
const root = resolve(".");

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg"
};

createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${host}:${port}`);
  const requestPath = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
  const filePath = normalize(join(root, requestPath));

  const outsideRoot = relative(root, filePath).startsWith("..");

  if (outsideRoot) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const body = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": types[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}).listen(port, host, () => {
  console.log(`Sunflower garden available at http://${host}:${port}`);
});
