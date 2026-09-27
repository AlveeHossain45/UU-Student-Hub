import { config } from "./config.js";
import { getDb, closeDb } from "./db/index.js";
import { seedIfEmpty } from "./db/seed.js";
import { createApp } from "./app.js";

function bootstrap() {
  getDb();
  const seeded = config.seed ? seedIfEmpty() : false;

  const app = createApp();
  const server = app.listen(config.port, config.host, () => {
    if (config.log) {
      console.log("");
      console.log("  UU Student Hub API");
      console.log(`  ├─ env      ${config.env}`);
      console.log(`  ├─ api      http://localhost:${config.port}/api`);
      console.log(`  ├─ health   http://localhost:${config.port}/api/health`);
      console.log(`  ├─ database ${config.dbPath}`);
      console.log(`  ├─ ai       ${config.ai.provider}${config.ai.provider === "openai" ? ` (${config.ai.model})` : ""}`);
      console.log(`  └─ seed     ${seeded ? "demo data created" : "already present"}`);
      console.log("");
    }
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${config.port} is already in use. Set PORT=<other> and try again.`);
      process.exit(1);
    }
    throw err;
  });

  const shutdown = (signal) => {
    if (config.log) console.log(`\n${signal} received, shutting down…`);
    server.close(() => {
      closeDb();
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 5000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("unhandledRejection", (reason) => {
    console.error("[unhandledRejection]", reason);
  });

  return server;
}

bootstrap();
