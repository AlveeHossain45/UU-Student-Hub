import { all, get, nowIso, run } from "../db/index.js";
import { notFound } from "./errors.js";
import { rowId } from "./tokens.js";

/**
 * Small, generic repository for the user-owned collections (courses, routine,
 * assignments, exams, notifications, CGPA rows). Column names are taken from
 * the zod schema shape, so arbitrary keys can never reach SQL.
 */
export function makeCollection({ table, schema, idPrefix = "", timestamps = true }) {
  // `createdAt` is always accepted (some tables have no `updatedAt` column);
  // both are auto-filled only when `timestamps` is on.
  const allowed = new Set([
    ...Object.keys(schema.shape),
    "id",
    "userId",
    "position",
    "createdAt",
    ...(timestamps ? ["updatedAt"] : []),
  ]);

  const pick = (data) =>
    Object.fromEntries(
      Object.entries(data ?? {})
        .filter(([key, value]) => allowed.has(key) && value !== undefined)
        // node:sqlite only binds null / number / bigint / string / Uint8Array.
        .map(([key, value]) => [key, typeof value === "boolean" ? (value ? 1 : 0) : value])
    );

  const strip = (row) => {
    if (!row) return row;
    const { userId, passwordHash, ...rest } = row;
    void userId;
    void passwordHash;
    return rest;
  };

  return {
    list(userId, { where = "1=1", params = [], order = timestamps ? "createdAt DESC" : "rowid DESC" } = {}) {
      return all(`SELECT * FROM ${table} WHERE userId = ? AND ${where} ORDER BY ${order}`, userId, ...params).map(strip);
    },

    get(userId, id) {
      const row = get(`SELECT * FROM ${table} WHERE id = ? AND userId = ?`, id, userId);
      if (!row) throw notFound("That item no longer exists.");
      return strip(row);
    },

    findOne(userId, where, ...params) {
      const row = get(`SELECT * FROM ${table} WHERE userId = ? AND ${where}`, userId, ...params);
      return row ? strip(row) : null;
    },

    count(userId, where = "1=1", ...params) {
      return get(`SELECT COUNT(*) AS n FROM ${table} WHERE userId = ? AND ${where}`, userId, ...params)?.n ?? 0;
    },

    create(userId, data) {
      const ts = nowIso();
      const fields = { id: rowId(idPrefix), userId, ...pick(data) };
      if (timestamps) {
        fields.createdAt = ts;
        fields.updatedAt = ts;
      }
      const keys = Object.keys(fields);
      run(
        `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`,
        ...keys.map((k) => fields[k])
      );
      return strip(get(`SELECT * FROM ${table} WHERE id = ?`, fields.id));
    },

    update(userId, id, patch) {
      const existing = get(`SELECT * FROM ${table} WHERE id = ? AND userId = ?`, id, userId);
      if (!existing) throw notFound("That item no longer exists.");

      const fields = pick(patch);
      if (timestamps) fields.updatedAt = nowIso();
      const keys = Object.keys(fields);
      if (keys.length === 0) return strip(existing);

      run(
        `UPDATE ${table} SET ${keys.map((k) => `${k} = ?`).join(", ")} WHERE id = ? AND userId = ?`,
        ...keys.map((k) => fields[k]),
        id,
        userId
      );
      return strip(get(`SELECT * FROM ${table} WHERE id = ?`, id));
    },

    remove(userId, id) {
      const result = run(`DELETE FROM ${table} WHERE id = ? AND userId = ?`, id, userId);
      if (result.changes === 0) throw notFound("That item no longer exists.");
      return { id };
    },

    /** Bulk replace — used by "reset demo data". */
    replaceAll(userId, rows) {
      run(`DELETE FROM ${table} WHERE userId = ?`, userId);
      rows.forEach((row, index) => {
        const ts = nowIso();
        const fields = { id: row.id || rowId(idPrefix), userId, ...pick(row) };
        if (timestamps) {
          fields.createdAt = row.createdAt || ts;
          fields.updatedAt = row.updatedAt || ts;
        }
        if (fields.position === undefined && typeof index === "number" && allowed.has("position")) fields.position = index;
        const keys = Object.keys(fields);
        run(
          `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`,
          ...keys.map((k) => fields[k])
        );
      });
    },
  };
}
