import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const int = (value, fallback) => {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const list = (value, fallback) =>
  (value ?? fallback)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const env = process.env.NODE_ENV || "development";
const isProd = env === "production";

const dbPath = process.env.DATABASE_PATH || path.join(ROOT, "data", "app.db");
const dataDir = dbPath === ":memory:" ? null : path.dirname(dbPath);

const DEV_SECRET = "dev-only-insecure-secret-change-me-0123456789";

/**
 * Resolution order: JWT_SECRET env var -> persisted per-install secret -> dev default.
 * Production never falls back to a hard-coded value: a random secret is generated
 * and stored next to the database (0600) on first run.
 */
function resolveJwtSecret() {
  const fromEnv = process.env.JWT_SECRET?.trim();
  if (fromEnv) {
    if (isProd && fromEnv.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters long in production.");
    }
    return { secret: fromEnv, source: "env" };
  }

  if (!dataDir) return { secret: DEV_SECRET, source: "dev-default" };

  const file = path.join(dataDir, ".jwt-secret");
  try {
    if (fs.existsSync(file)) {
      const existing = fs.readFileSync(file, "utf8").trim();
      if (existing.length >= 32) return { secret: existing, source: "file" };
    }
    fs.mkdirSync(dataDir, { recursive: true });
    const generated = randomBytes(48).toString("base64url");
    fs.writeFileSync(file, generated, { mode: 0o600 });
    return { secret: generated, source: "generated" };
  } catch (err) {
    if (isProd) {
      throw new Error(`Unable to persist a JWT secret — set JWT_SECRET explicitly. (${err.message})`);
    }
    return { secret: DEV_SECRET, source: "dev-default" };
  }
}

const jwt = resolveJwtSecret();

export const config = {
  env,
  isProd,
  isTest: env === "test",
  host: process.env.HOST || "0.0.0.0",
  port: int(process.env.PORT, 3000),

  dbPath,
  dataDir,
  distDir: process.env.STATIC_DIR || path.join(ROOT, "dist"),

  jwt: {
    secret: jwt.secret,
    secretSource: jwt.source,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  corsOrigins: list(
    process.env.CORS_ORIGINS,
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173"
  ),

  rateLimit: {
    windowMs: int(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: int(process.env.RATE_LIMIT_MAX, 300),
    authMax: int(process.env.AUTH_RATE_LIMIT_MAX, 25),
  },

  ai: {
    provider: (process.env.AI_PROVIDER || "mock").toLowerCase(),
    apiKey: process.env.AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim() || "",
    model: process.env.AI_MODEL || "gpt-4o-mini",
    baseUrl: process.env.AI_BASE_URL || "https://api.openai.com/v1",
    systemPrompt:
      process.env.AI_SYSTEM_PROMPT ||
      "You are the UU Student Hub study assistant for Uttara University students. Answer clearly, concisely and accurately. Format answers with Markdown.",
    maxTokens: int(process.env.AI_MAX_TOKENS, 700),
  },

  seed: process.env.SEED_DEMO_DATA !== "false",
  log: process.env.LOG_LEVEL !== "silent" && env !== "test",
};
