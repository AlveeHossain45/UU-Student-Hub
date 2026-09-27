import fs from "node:fs";
import path from "node:path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config.js";
import { errorHandler, notFoundHandler } from "./lib/errors.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { createApiRouter } from "./routes/index.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.set("log", config.log);
  app.disable("x-powered-by");

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          "default-src": ["'self'"],
          // The production bundle is inlined into index.html by vite-plugin-singlefile.
          "script-src": ["'self'", "'unsafe-inline'"],
          "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
          "img-src": ["'self'", "data:", "blob:"],
          "connect-src": ["'self'"],
          "object-src": ["'none'"],
          "frame-ancestors": ["'none'"],
          "base-uri": ["'self'"],
          "form-action": ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      // Avatars are uploaded as data: URLs and the SPA is served from another origin in dev.
      crossOriginResourcePolicy: { policy: "cross-origin" },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    })
  );

  app.use((req, res, next) =>
    cors({
      // Same-origin requests (the SPA served by this server) always send an
      // Origin header on POST — allow them explicitly, then the allowlist.
      // Disallowed origins simply get no CORS headers instead of a 500.
      origin(origin, callback) {
        if (!origin) return callback(null, true);

        const self = `${req.protocol}://${req.headers.host}`;
        const allowed = config.corsOrigins.includes("*") || config.corsOrigins.includes(origin) || origin === self;

        if (!allowed && config.log) console.warn(`[cors] blocked origin ${origin}`);
        callback(null, allowed);
      },
      credentials: false,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      exposedHeaders: ["X-Session-Expires", "RateLimit", "RateLimit-Remaining", "RateLimit-Reset", "Retry-After"],
      maxAge: 600,
    })(req, res, next)
  );

  app.use(express.json({ limit: "4mb" }));

  if (config.log && !config.isTest) {
    app.use((req, res, next) => {
      if (!req.path.startsWith("/api")) return next();
      const started = Date.now();
      res.on("finish", () => {
        if (res.statusCode >= 500) return;
        console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - started}ms`);
      });
      next();
    });
  }

  app.use("/api", apiLimiter, createApiRouter());
  app.use("/api", notFoundHandler);

  // Serve the built SPA (npm run build) from the same origin as the API.
  if (fs.existsSync(path.join(config.distDir, "index.html"))) {
    app.use(
      express.static(config.distDir, {
        index: false,
        maxAge: config.isProd ? "1y" : 0,
        setHeaders(res, filePath) {
          if (filePath.endsWith("index.html")) res.setHeader("Cache-Control", "no-cache");
        },
      })
    );
    app.get("*", (req, res, next) => {
      if (req.method !== "GET") return next();
      res.sendFile(path.join(config.distDir, "index.html"));
    });
  } else {
    app.get("/", (req, res) => {
      res
        .status(200)
        .type("text/plain")
        .send("UU Student Hub API is running. Build the frontend with `npm run build` to serve it from here.");
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
