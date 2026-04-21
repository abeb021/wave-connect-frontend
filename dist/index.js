// server/index.ts
import express from "express";
import { createServer } from "http";
import { Readable } from "stream";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
async function startServer() {
  const app = express();
  const server = createServer(app);
  const apiTarget = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8080").replace(/\/+$/, "");
  app.use("/api", async (req, res) => {
    try {
      const upstreamUrl = new URL(req.originalUrl, `${apiTarget}/`);
      const headers = new Headers();
      Object.entries(req.headers).forEach(([key, value]) => {
        if (value === void 0) return;
        if (Array.isArray(value)) {
          value.forEach((item) => headers.append(key, item));
          return;
        }
        headers.set(key, value);
      });
      headers.set("host", new URL(apiTarget).host);
      const upstream = await fetch(upstreamUrl, {
        method: req.method,
        headers,
        body: ["GET", "HEAD"].includes(req.method) ? void 0 : Readable.toWeb(req),
        duplex: "half"
      });
      res.status(upstream.status);
      upstream.headers.forEach((value, key) => {
        if (key.toLowerCase() === "transfer-encoding") return;
        res.setHeader(key, value);
      });
      if (!upstream.body) {
        res.end();
        return;
      }
      Readable.fromWeb(upstream.body).pipe(res);
    } catch (error) {
      console.error("API proxy error:", error);
      res.status(502).json({ error: "Unable to reach API gateway", target: apiTarget });
    }
  });
  const staticPath = process.env.NODE_ENV === "production" ? path.resolve(__dirname, "public") : path.resolve(__dirname, "..", "dist", "public");
  app.use(express.static(staticPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });
  const port = process.env.PORT || 3e3;
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
