import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createConnection } from "mysql2/promise";

const here = dirname(fileURLToPath(import.meta.url));

function loadEnvFile(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

loadEnvFile(join(process.cwd(), ".env"));
loadEnvFile(join(process.cwd(), "apps/api/.env"));

const COLUMNS = [
  ["users", "username", "username VARCHAR(191) DEFAULT NULL"],
  ["users", "password_hash", "password_hash TEXT"],
  ["users", "role", "role VARCHAR(32) NOT NULL DEFAULT 'member'"],
  ["projects", "access", "access VARCHAR(32) NOT NULL DEFAULT 'personal'"],
  ["projects", "group_id", "group_id VARCHAR(36) DEFAULT NULL"],
  ["project_members", "source", "source VARCHAR(32) NOT NULL DEFAULT 'invite'"],
  ["tasks", "start_date", "start_date DATETIME(3) DEFAULT NULL"],
  ["tasks", "all_day", "all_day TINYINT(1) NOT NULL DEFAULT 1"],
  ["tasks", "`rank`", "`rank` DOUBLE NOT NULL DEFAULT 0"],
  ["google_calendar_connections", "last_synced_at", "last_synced_at DATETIME(3) DEFAULT NULL"],
];

function parseDatabaseUrl(raw) {
  const parsed = new URL(raw);
  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, "") || "task_management",
  };
}

function sqlPath() {
  const candidates = [join(here, "mysql/migrate.sql"), join(here, "../mysql/migrate.sql")];
  const found = candidates.find((file) => existsSync(file));
  if (!found) throw new Error("mysql/migrate.sql not found");
  return found;
}

async function columnExists(conn, database, table, column) {
  const name = column.replace(/`/g, "");
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [database, table, name],
  );
  return Array.isArray(rows) && rows.length > 0;
}

async function tableExists(conn, database, table) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? LIMIT 1`,
    [database, table],
  );
  return Array.isArray(rows) && rows.length > 0;
}

function seedPath() {
  const candidates = [join(here, "mysql/seed.sql"), join(here, "../mysql/seed.sql")];
  return candidates.find((file) => existsSync(file));
}

function mysqlDateTimes(sql) {
  return sql.replace(
    /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})(?:\.(\d+))?(?:[Zz]|[+-][\d:]*)?/g,
    (_full, stamp, frac = "") => `${stamp}.${(frac + "000").slice(0, 3)}`,
  );
}

function seedStatements(sql) {
  return mysqlDateTimes(sql)
    .split(/;\s*(?:\r?\n|$)/)
    .map((part) =>
      part
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim(),
    )
    .filter(Boolean);
}

async function countRows(conn, table) {
  const [rows] = await conn.query(`SELECT COUNT(*) AS c FROM \`${table}\``);
  return Number(rows[0]?.c ?? 0);
}

async function seedIfEmpty(conn) {
  const projects = await countRows(conn, "projects");
  const analyses = await countRows(conn, "project_analyses");
  if (projects > 0 && analyses > 0) {
    console.log("skip seed (data already present)");
    return;
  }
  const file = seedPath();
  if (!file) {
    console.log("skip seed (mysql/seed.sql not found)");
    return;
  }

  const statements = seedStatements(readFileSync(file, "utf8"));
  await conn.beginTransaction();
  try {
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");
    if (projects > 0 || analyses === 0) {
      console.log("incomplete seed detected; wiping partial rows");
      for (const table of [
        "project_analyses",
        "activities",
        "daily_logs",
        "attachments",
        "comments",
        "task_assignees",
        "tasks",
        "sprints",
        "project_pins",
        "project_members",
        "projects",
      ]) {
        await conn.query(`DELETE FROM \`${table}\``);
      }
    }
    await conn.query(
      "DELETE FROM users WHERE email IN ('it@aerisbeaute.com', 'dwiki@aerisbeaute.com', 'leonardo@aerisbeaute.com')",
    );
    for (const statement of statements) {
      await conn.query(statement);
    }
    await conn.query("SET FOREIGN_KEY_CHECKS = 1");
    await conn.commit();
    console.log("seed imported");
  } catch (error) {
    await conn.rollback();
    await conn.query("SET FOREIGN_KEY_CHECKS = 1").catch(() => {});
    throw error;
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");
  const cfg = parseDatabaseUrl(databaseUrl);
  const conn = await createConnection({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    multipleStatements: true,
    charset: "utf8mb4",
  });

  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${cfg.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await conn.query(`USE \`${cfg.database}\``);
  await conn.query(readFileSync(sqlPath(), "utf8"));

  for (const [table, column, definition] of COLUMNS) {
    if (!(await tableExists(conn, cfg.database, table))) continue;
    if (await columnExists(conn, cfg.database, table, column)) {
      console.log(`skip ${table}.${column.replace(/`/g, "")}`);
      continue;
    }
    await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN ${definition}`);
    console.log(`added ${table}.${column.replace(/`/g, "")}`);
  }

  await seedIfEmpty(conn);
  await conn.end();
  console.log("migrate ok");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
