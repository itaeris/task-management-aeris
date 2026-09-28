import { createPool, type Pool, type RowDataPacket } from "mysql2/promise";
import { randomUUID } from "node:crypto";

type DbRow = Record<string, any>;
type QueryError = { message: string; code?: string };
type QueryResult<T = DbRow[]> = { data: T; error: QueryError | null; count?: number | null };

function toQueryError(error: unknown): QueryError {
  const message = error instanceof Error ? error.message : String(error);
  const code = error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code : undefined;
  return { message, code: code === "ER_DUP_ENTRY" ? "23505" : code };
}

const NO_ID_TABLES = new Set([
  "project_analyses",
  "presences",
  "google_calendar_connections",
  "file_blobs",
]);
const BOOLEAN_COLUMNS = new Set(["all_day"]);
const TIMESTAMP_COLUMNS = new Set([
  "created_at",
  "updated_at",
  "joined_at",
  "start_date",
  "due_date",
  "end_date",
  "token_expiry",
  "connected_at",
  "last_synced_at",
]);

type Filter =
  | { kind: "eq" | "neq" | "gte"; column: string; value: unknown }
  | { kind: "in"; column: string; value: unknown[] };

type Embed = { name: string; columns: string[] };

function quoteIdent(name: string) {
  return `\`${name.replace(/`/g, "``")}\``;
}

function parseDatabaseUrl(raw: string) {
  const parsed = new URL(raw);
  const ssl = parsed.searchParams.get("ssl") === "true" || parsed.searchParams.get("sslmode") === "require";
  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
    ssl: ssl ? { rejectUnauthorized: true } : undefined,
  };
}

const globalForDb = globalThis as unknown as { mysqlPool?: Pool; mysqlUrl?: string };

function pool(): Pool {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is not set in .env (mysql://user:pass@host:3306/dbname).");
  if (globalForDb.mysqlPool && globalForDb.mysqlUrl === url) return globalForDb.mysqlPool;
  if (globalForDb.mysqlPool) void globalForDb.mysqlPool.end().catch(() => undefined);
  globalForDb.mysqlUrl = url;
  globalForDb.mysqlPool = createPool({
    ...parseDatabaseUrl(url),
    waitForConnections: true,
    connectionLimit: 10,
    enableKeepAlive: true,
    dateStrings: true,
    charset: "utf8mb4",
  });
  return globalForDb.mysqlPool;
}

function toMysqlDate(value: unknown) {
  if (value instanceof Date) return value.toISOString().slice(0, 23).replace("T", " ");
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return value.replace("T", " ").replace("Z", "").replace(/\+[\d:]+$/, "").slice(0, 23);
  }
  return value;
}

function toIsoDate(value: unknown) {
  if (typeof value !== "string") return value;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(value)) {
    return `${value.replace(" ", "T")}${value.endsWith("Z") ? "" : "Z"}`;
  }
  return value;
}

function hydrate(row: Record<string, unknown>) {
  const next: Record<string, unknown> = {};
  const embeds = new Map<string, Record<string, unknown>>();
  for (const [key, raw] of Object.entries(row)) {
    const split = key.indexOf("__");
    if (split > 0) {
      const embed = key.slice(0, split);
      const column = key.slice(split + 2);
      const current = embeds.get(embed) ?? {};
      current[column] = BOOLEAN_COLUMNS.has(column)
        ? Boolean(raw)
        : TIMESTAMP_COLUMNS.has(column)
          ? toIsoDate(raw)
          : raw;
      embeds.set(embed, current);
      continue;
    }
    next[key] = BOOLEAN_COLUMNS.has(key) ? Boolean(raw) : TIMESTAMP_COLUMNS.has(key) ? toIsoDate(raw) : raw;
  }
  for (const [name, value] of embeds) {
    next[name] = Object.values(value).every((item) => item === null || item === undefined) ? null : value;
  }
  return next;
}

function parseSelect(select: string): { columns: string[] | "*"; embeds: Embed[] } {
  const embeds: Embed[] = [];
  const columns: string[] = [];
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of select) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) parts.push(current.trim());
  for (const part of parts) {
    const embed = part.match(/^([a-zA-Z_][\w]*)\s*\((.+)\)$/);
    if (embed) {
      embeds.push({
        name: embed[1],
        columns: embed[2].split(",").map((column) => column.trim()).filter(Boolean),
      });
      continue;
    }
    columns.push(part);
  }
  return { columns: columns.includes("*") || columns.length === 0 ? "*" : columns, embeds };
}

function fkColumn(embedName: string) {
  if (embedName === "users") return "user_id";
  if (embedName === "tasks") return "task_id";
  if (embedName.endsWith("s")) return `${embedName.slice(0, -1)}_id`;
  return `${embedName}_id`;
}

class QueryBuilder<TData = DbRow[]> implements PromiseLike<QueryResult<TData>> {
  private filters: Filter[] = [];
  private orderBy: { column: string; ascending: boolean } | null = null;
  private limitCount: number | null = null;
  private offsetCount: number | null = null;
  private op: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private selectSpec = "*";
  private selectOpts: { count?: string; head?: boolean } = {};
  private payload: Record<string, unknown> | Record<string, unknown>[] | null = null;
  private returning: string | null = null;
  private want: "many" | "single" | "maybe" = "many";

  constructor(private table: string) {}

  select(columns = "*", opts: { count?: string; head?: boolean } = {}) {
    if (this.op === "insert" || this.op === "update" || this.op === "upsert") {
      this.returning = columns;
      return this;
    }
    this.op = "select";
    this.selectSpec = columns;
    this.selectOpts = opts;
    return this;
  }

  insert(rows: Record<string, unknown> | Record<string, unknown>[]) {
    this.op = "insert";
    this.payload = rows;
    return this;
  }

  update(patch: Record<string, unknown>) {
    this.op = "update";
    this.payload = patch;
    return this;
  }

  upsert(row: Record<string, unknown>, _opts?: { onConflict?: string }) {
    this.op = "upsert";
    this.payload = row;
    return this;
  }

  delete() {
    this.op = "delete";
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ kind: "eq", column, value });
    return this;
  }

  neq(column: string, value: unknown) {
    this.filters.push({ kind: "neq", column, value });
    return this;
  }

  gte(column: string, value: unknown) {
    this.filters.push({ kind: "gte", column, value });
    return this;
  }

  in(column: string, value: unknown[]) {
    this.filters.push({ kind: "in", column, value });
    return this;
  }

  order(column: string, opts: { ascending?: boolean } = {}) {
    this.orderBy = { column, ascending: opts.ascending !== false };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number) {
    this.offsetCount = from;
    this.limitCount = to - from + 1;
    return this;
  }

  maybeSingle(): QueryBuilder<TData extends (infer Item)[] ? Item | null : TData | null> {
    this.want = "maybe";
    this.limitCount = 1;
    return this as QueryBuilder<TData extends (infer Item)[] ? Item | null : TData | null>;
  }

  single(): QueryBuilder<TData extends (infer Item)[] ? Item : TData> {
    this.want = "single";
    this.limitCount = this.limitCount ?? 1;
    return this as QueryBuilder<TData extends (infer Item)[] ? Item : TData>;
  }

  then(): Promise<QueryResult<TData>>;
  then<TResult1, TResult2 = never>(
    onfulfilled: (value: QueryResult<TData>) => TResult1 | PromiseLike<TResult1>,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2>;
  then(
    onfulfilled?: ((value: QueryResult<TData>) => unknown) | null,
    onrejected?: ((reason: unknown) => unknown) | null,
  ): Promise<unknown> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private whereSql() {
    if (!this.filters.length) return { sql: "", params: [] as unknown[] };
    const parts: string[] = [];
    const params: unknown[] = [];
    const table = quoteIdent(this.table);
    for (const filter of this.filters) {
      const column = `${table}.${quoteIdent(filter.column)}`;
      if (filter.kind === "in") {
        if (!filter.value.length) {
          parts.push("1 = 0");
          continue;
        }
        parts.push(`${column} IN (${filter.value.map(() => "?").join(", ")})`);
        params.push(...filter.value.map(toMysqlDate));
        continue;
      }
      const op = filter.kind === "eq" ? "=" : filter.kind === "neq" ? "<>" : ">=";
      parts.push(`${column} ${op} ?`);
      params.push(toMysqlDate(filter.value));
    }
    return { sql: ` WHERE ${parts.join(" AND ")}`, params };
  }

  private normalizeRows(
    input: Record<string, unknown> | Record<string, unknown>[],
    opts: { generateId?: boolean } = {},
  ) {
    const generateId = opts.generateId !== false;
    const rows = Array.isArray(input) ? input : [input];
    return rows.map((row) => {
      const next = { ...row };
      if (generateId && !NO_ID_TABLES.has(this.table) && next.id == null) next.id = randomUUID();
      for (const [key, value] of Object.entries(next)) {
        if (BOOLEAN_COLUMNS.has(key) && typeof value === "boolean") next[key] = value ? 1 : 0;
        else next[key] = toMysqlDate(value);
      }
      return next;
    });
  }

  private pickReturning(row: Record<string, unknown>) {
    if (!this.returning || this.returning === "*") return hydrate(row);
    const columns = this.returning.split(",").map((column) => column.trim()).filter((column) => column && !column.includes("("));
    const picked: Record<string, unknown> = {};
    for (const column of columns) picked[column] = row[column];
    return hydrate(picked);
  }

  private async execute(): Promise<QueryResult<TData>> {
    try {
      if (this.op === "select") return (await this.executeSelect()) as QueryResult<TData>;
      if (this.op === "insert") return (await this.executeInsert()) as QueryResult<TData>;
      if (this.op === "update") return (await this.executeUpdate()) as QueryResult<TData>;
      if (this.op === "upsert") return (await this.executeUpsert()) as QueryResult<TData>;
      return (await this.executeDelete()) as QueryResult<TData>;
    } catch (error) {
      return { data: null, error: toQueryError(error) } as QueryResult<TData>;
    }
  }

  private async executeSelect(): Promise<QueryResult<any>> {
    const { sql: whereSql, params } = this.whereSql();
    const table = quoteIdent(this.table);
    if (this.selectOpts.head && this.selectOpts.count === "exact") {
      const [rows] = await pool().query<RowDataPacket[]>(`SELECT COUNT(*) AS count FROM ${table}${whereSql}`, params);
      const count = Number(rows[0]?.count ?? 0);
      return { data: null, error: null, count };
    }

    const parsed = parseSelect(this.selectSpec);
    const selectParts: string[] = [];
    if (parsed.columns === "*") selectParts.push(`${table}.*`);
    else {
      for (const column of parsed.columns) selectParts.push(`${table}.${quoteIdent(column)}`);
    }
    let joinSql = "";
    parsed.embeds.forEach((embed, index) => {
      const alias = `e${index}`;
      const fk = fkColumn(embed.name);
      joinSql += ` LEFT JOIN ${quoteIdent(embed.name)} ${alias} ON ${alias}.id = ${table}.${quoteIdent(fk)}`;
      for (const column of embed.columns) {
        selectParts.push(`${alias}.${quoteIdent(column)} AS ${quoteIdent(`${embed.name}__${column}`)}`);
      }
    });

    let sql = `SELECT ${selectParts.join(", ")} FROM ${table}${joinSql}${whereSql}`;
    if (this.orderBy) {
      sql += ` ORDER BY ${table}.${quoteIdent(this.orderBy.column)} ${this.orderBy.ascending ? "ASC" : "DESC"}`;
    }
    if (this.limitCount != null) sql += ` LIMIT ${this.limitCount}`;
    if (this.offsetCount != null) sql += ` OFFSET ${this.offsetCount}`;

    const [rows] = await pool().query<RowDataPacket[]>(sql, params);
    const data = rows.map((row) => hydrate(row as Record<string, unknown>));
    if (this.selectOpts.count === "exact") {
      const [countRows] = await pool().query<RowDataPacket[]>(`SELECT COUNT(*) AS count FROM ${table}${whereSql}`, params);
      return { data, error: null, count: Number(countRows[0]?.count ?? data.length) };
    }
    if (this.want === "maybe") return { data: data[0] ?? null, error: null };
    if (this.want === "single") {
      if (!data[0]) return { data: null, error: { message: "Row not found." } };
      return { data: data[0], error: null };
    }
    return { data, error: null };
  }

  private async executeInsert(): Promise<QueryResult<any>> {
    if (!this.payload) return { data: null, error: { message: "Nothing to insert." } };
    const rows = this.normalizeRows(this.payload);
    if (!rows.length) return { data: [], error: null };
    const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
    const placeholders = rows.map(() => `(${columns.map(() => "?").join(", ")})`).join(", ");
    const params = rows.flatMap((row) => columns.map((column) => (column in row ? row[column] : null)));
    await pool().query(
      `INSERT INTO ${quoteIdent(this.table)} (${columns.map(quoteIdent).join(", ")}) VALUES ${placeholders}`,
      params,
    );
    const returning = rows.map((row) => this.pickReturning(row));
    if (this.want === "single" || this.want === "maybe") return { data: returning[0] ?? null, error: null };
    return { data: Array.isArray(this.payload) ? returning : returning[0], error: null };
  }

  private async executeUpdate(): Promise<QueryResult<any>> {
    if (!this.payload || Array.isArray(this.payload)) return { data: null, error: { message: "Nothing to update." } };
    const patch = this.normalizeRows(this.payload, { generateId: false })[0];
    const columns = Object.keys(patch);
    if (!columns.length) return { data: null, error: { message: "Nothing to update." } };
    const { sql: whereSql, params } = this.whereSql();
    await pool().query(
      `UPDATE ${quoteIdent(this.table)} SET ${columns.map((column) => `${quoteIdent(column)} = ?`).join(", ")}${whereSql}`,
      [...columns.map((column) => patch[column]), ...params],
    );
    if (!this.returning) return { data: null, error: null };
    return this.selectAfterWrite();
  }

  private selectAfterWrite() {
    const select = new QueryBuilder(this.table);
    select.op = "select";
    select.selectSpec = this.returning ?? "*";
    select.filters = this.filters;
    select.want = this.want;
    return select.execute();
  }

  private async executeUpsert(): Promise<QueryResult<any>> {
    if (!this.payload || Array.isArray(this.payload)) return { data: null, error: { message: "Nothing to upsert." } };
    const row = this.normalizeRows(this.payload)[0];
    const columns = Object.keys(row);
    const updates = columns.filter((column) => column !== "id");
    const sql = `INSERT INTO ${quoteIdent(this.table)} (${columns.map(quoteIdent).join(", ")}) VALUES (${columns.map(() => "?").join(", ")}) AS new ON DUPLICATE KEY UPDATE ${updates.map((column) => `${quoteIdent(column)} = new.${quoteIdent(column)}`).join(", ")}`;
    await pool().query(sql, columns.map((column) => row[column]));
    return { data: this.pickReturning(row), error: null };
  }

  private async executeDelete(): Promise<QueryResult<any>> {
    const { sql: whereSql, params } = this.whereSql();
    await pool().query(`DELETE FROM ${quoteIdent(this.table)}${whereSql}`, params);
    return { data: null, error: null };
  }
}

function storage() {
  return {
    from(_bucket: string) {
      return {
        async upload(storedName: string, body: Buffer, opts?: { contentType?: string; upsert?: boolean }) {
          try {
            const mime = opts?.contentType || "application/octet-stream";
            if (opts?.upsert) {
              await pool().query(
                `INSERT INTO file_blobs (stored_name, mime_type, size, data) VALUES (?, ?, ?, ?) AS new ON DUPLICATE KEY UPDATE mime_type = new.mime_type, size = new.size, data = new.data`,
                [storedName, mime, body.length, body],
              );
            } else {
              await pool().query(
                `INSERT INTO file_blobs (stored_name, mime_type, size, data) VALUES (?, ?, ?, ?)`,
                [storedName, mime, body.length, body],
              );
            }
            return { data: { path: storedName }, error: null };
          } catch (error) {
            return { data: null, error: { message: error instanceof Error ? error.message : String(error) } };
          }
        },
        async download(storedName: string) {
          try {
            const [rows] = await pool().query<RowDataPacket[]>(
              `SELECT mime_type, data FROM file_blobs WHERE stored_name = ? LIMIT 1`,
              [storedName],
            );
            const row = rows[0] as { mime_type: string; data: Buffer } | undefined;
            if (!row) return { data: null, error: { message: "Missing file" } };
            const blob = new Blob([new Uint8Array(row.data)], { type: row.mime_type });
            return { data: blob, error: null };
          } catch (error) {
            return { data: null, error: { message: error instanceof Error ? error.message : String(error) } };
          }
        },
        async remove(names: string[]) {
          if (!names.length) return { data: [], error: null };
          try {
            await pool().query(`DELETE FROM file_blobs WHERE stored_name IN (${names.map(() => "?").join(", ")})`, names);
            return { data: names, error: null };
          } catch (error) {
            return { data: null, error: { message: error instanceof Error ? error.message : String(error) } };
          }
        },
      };
    },
  };
}

export const db = {
  from(table: string) {
    return new QueryBuilder<DbRow[]>(table);
  },
  storage: storage(),
};

export function unwrap<T>(result: { data: T; error: QueryError | null }) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
