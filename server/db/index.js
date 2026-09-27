import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { config } from "../config.js";
import { SCHEMA } from "./schema.js";

let db = null;

export function getDb() {
  if (db) return db;

  if (config.dbPath !== ":memory:") {
    fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
  }

  db = new DatabaseSync(config.dbPath);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA busy_timeout = 5000;");
  db.exec("PRAGMA synchronous = NORMAL;");
  db.exec(SCHEMA);
  return db;
}

export function closeDb() {
  if (db) {
    try {
      db.close();
    } catch {
      /* already closed */
    }
    db = null;
  }
}

/** SELECT many rows. */
export const all = (sql, ...params) => getDb().prepare(sql).all(...params);

/** SELECT one row (undefined when none). */
export const get = (sql, ...params) => getDb().prepare(sql).get(...params);

/** INSERT / UPDATE / DELETE. */
export const run = (sql, ...params) => getDb().prepare(sql).run(...params);

/** Run fn inside a transaction (re-entrant: nested calls use SAVEPOINTs). */
let txDepth = 0;

export function transaction(fn) {
  const database = getDb();
  const outermost = txDepth === 0;
  const savepoint = `sp_${txDepth}`;

  database.exec(outermost ? "BEGIN" : `SAVEPOINT ${savepoint}`);
  txDepth += 1;

  try {
    const result = fn();
    txDepth -= 1;
    database.exec(outermost ? "COMMIT" : `RELEASE ${savepoint}`);
    return result;
  } catch (err) {
    txDepth -= 1;
    try {
      database.exec(outermost ? "ROLLBACK" : `ROLLBACK TO ${savepoint}; RELEASE ${savepoint}`);
    } catch {
      /* connection already unwound */
    }
    throw err;
  }
}

export const nowIso = () => new Date().toISOString();
