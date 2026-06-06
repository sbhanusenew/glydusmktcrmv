const http = require("http");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const port = Number(process.env.PORT || 4173);
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
};

function loadLocalEnv() {
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      return;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

function sendJson(response, payload) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

loadLocalEnv();

const server = http.createServer((request, response) => {
  const requestPath = decodeURIComponent((request.url || "/").split("?")[0]);

  if (requestPath === "/api/config") {
    sendJson(response, {
      supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      supabaseAnonKey:
        process.env.SUPABASE_ANON_KEY ||
        process.env.SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        "",
    });
    return;
  }

  const normalizedPath = path
    .normalize(requestPath)
    .replace(/^([.][.][\\/])+/, "");
  let filePath = path.join(
    root,
    normalizedPath === "/" ? "index.html" : normalizedPath.replace(/^[/\\]/, ""),
  );

  if (!filePath.startsWith(root)) {
    response.statusCode = 403;
    response.end("Forbidden");
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (!statError && stats.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    fs.readFile(filePath, (readError, fileBuffer) => {
      if (readError) {
        response.statusCode = 404;
        response.end("Not found");
        return;
      }

      response.setHeader(
        "Content-Type",
        mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      );
      response.end(fileBuffer);
    });
  });
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`Glydus CRM server running on http://127.0.0.1:${port}\n`);
});
