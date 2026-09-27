/**
 * Production entry point: `npm start`.
 * Serves the API and the built SPA (npm run build) from one process.
 */
process.env.NODE_ENV = process.env.NODE_ENV || "production";

await import("./index.js");
