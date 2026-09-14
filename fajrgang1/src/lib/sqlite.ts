import fs from "fs";
import path from "path";
import type { Database as SqlJsDatabase, Statement as SqlJsStatement } from "sql.js";

// Native better-sqlite3 cannot run on Netlify. sql.js (asm) is pure JS.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const initSqlJs = require("sql.js/dist/sql-asm.js") as (opts?: object) => Promise<{
  Database: new (data?: ArrayLike<number> | Buffer | null) => SqlJsDatabase;
}>;

const LOCAL_DB_PATH = path.join(process.cwd(), "data", "fajrgang.db");
const BLOB_STORE = "fajrgang";
const BLOB_KEY = "database";

export function isNetlify() {
  return Boolean(process.env.NETLIFY || process.env.NETLIFY_DEV);
}

function rowFromStmt(stmt: SqlJsStatement): Record<string, unknown> {
  return stmt.getAsObject() as Record<string, unknown>;
}

function userCount(engine: SqlJsDatabase): number {
  try {
    const stmt = engine.prepare(
      "SELECT COUNT(*) AS c FROM users WHERE status IS NULL OR status != 'REMOVED'"
    );
    try {
      if (!stmt.step()) return 0;
      return Number((stmt.getAsObject() as { c?: number }).c || 0);
    } finally {
      stmt.free();
    }
  } catch {
    return 0;
  }
}

function countFromBytes(bytes: Uint8Array, SQL: { Database: new (data?: ArrayLike<number>) => SqlJsDatabase }) {
  try {
    const temp = new SQL.Database(bytes);
    const n = userCount(temp);
    temp.close();
    return n;
  } catch {
    return 0;
  }
}

export class SqliteStatement {
  constructor(
    private engine: SqlJsDatabase,
    private sql: string,
    private persist: () => void
  ) {}

  get(...params: unknown[]): any {
    const stmt = this.engine.prepare(this.sql);
    try {
      if (params.length) stmt.bind(params as never);
      if (!stmt.step()) return undefined;
      return rowFromStmt(stmt);
    } finally {
      stmt.free();
    }
  }

  all(...params: unknown[]): any[] {
    const stmt = this.engine.prepare(this.sql);
    const rows: Record<string, unknown>[] = [];
    try {
      if (params.length) stmt.bind(params as never);
      while (stmt.step()) rows.push(rowFromStmt(stmt));
      return rows;
    } finally {
      stmt.free();
    }
  }

  run(...params: unknown[]): { lastInsertRowid: number; changes: number } {
    if (params.length) this.engine.run(this.sql, params as never);
    else this.engine.run(this.sql);
    const idRows = this.engine.exec("SELECT last_insert_rowid() AS id");
    const lastInsertRowid = Number(idRows[0]?.values?.[0]?.[0] ?? 0);
    const changes = this.engine.getRowsModified();
    this.persist();
    return { lastInsertRowid, changes };
  }
}

export class SqliteDb {
  constructor(
    private engine: SqlJsDatabase,
    private persist: () => void
  ) {}

  prepare(sql: string) {
    return new SqliteStatement(this.engine, sql, this.persist);
  }

  exec(sql: string) {
    this.engine.exec(sql);
  }

  pragma(_cmd: string) {}

  export(): Uint8Array {
    return this.engine.export();
  }
}

type BlobRead =
  | { status: "ok"; data: Uint8Array; etag?: string }
  | { status: "missing" }
  | { status: "error"; error: unknown };

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let persistEnabled = false;
let persistAllowed = true;
let blobMissing = false;
let currentEtag: string | undefined;
let knownUserCount = 0;
let dirty = false;
let persistQueue: Promise<void> = Promise.resolve();
let live: SqliteDb | null = null;
let liveEngine: SqlJsDatabase | null = null;
let SQLModule: { Database: new (data?: ArrayLike<number> | Buffer | null) => SqlJsDatabase } | null =
  null;

export function enableSqlitePersist() {
  persistEnabled = true;
}

export function disableSqlitePersist() {
  persistEnabled = false;
}

export function wasBlobMissing() {
  return blobMissing;
}

export function canPersistSqlite() {
  return persistAllowed;
}

async function getBlobStore() {
  const { getStore } = await import("@netlify/blobs");
  return getStore({ name: BLOB_STORE, consistency: "strong" });
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function readBlob(): Promise<BlobRead> {
  if (!isNetlify()) return { status: "missing" };
  try {
    const store = await getBlobStore();
    const result = await store.getWithMetadata(BLOB_KEY, {
      type: "arrayBuffer",
      consistency: "strong",
    });
    if (!result?.data) return { status: "missing" };
    return {
      status: "ok",
      data: new Uint8Array(result.data),
      etag: result.etag,
    };
  } catch (error) {
    console.error("Netlify blob read failed", error);
    return { status: "error", error };
  }
}

async function writeBlob(bytes: Uint8Array, etag?: string) {
  const store = await getBlobStore();
  const body = toArrayBuffer(bytes);
  if (etag) {
    return store.set(BLOB_KEY, body as never, { onlyIfMatch: etag });
  }
  return store.set(BLOB_KEY, body as never, { onlyIfNew: true });
}

function readLocalFile(): Uint8Array | null {
  const candidates = [
    LOCAL_DB_PATH,
    path.join(process.cwd(), "fajrgang.db"),
    path.join(__dirname, "../../data/fajrgang.db"),
  ];
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        return new Uint8Array(fs.readFileSync(candidate));
      }
    } catch {
      // try next
    }
  }
  return null;
}

function writeLocalFile(bytes: Uint8Array) {
  try {
    fs.mkdirSync(path.dirname(LOCAL_DB_PATH), { recursive: true });
    fs.writeFileSync(LOCAL_DB_PATH, Buffer.from(bytes));
  } catch (err) {
    if (!isNetlify()) console.error("Local db write failed", err);
  }
}

async function persistNow() {
  if (!liveEngine || !persistEnabled || !persistAllowed) {
    dirty = false;
    return;
  }

  const bytes = liveEngine.export();
  const count = userCount(liveEngine);
  if (count < knownUserCount) {
    console.error("Skipping db persist: would drop members", count, "vs", knownUserCount);
    dirty = false;
    return;
  }

  writeLocalFile(bytes);

  if (!isNetlify()) {
    knownUserCount = count;
    dirty = false;
    return;
  }

  try {
    let result = await writeBlob(bytes, currentEtag);
    if (!result.modified) {
      const latest = await readBlob();
      if (latest.status === "ok") {
        const latestCount = countFromBytes(latest.data, SQLModule!);
        if (count >= latestCount) {
          const store = await getBlobStore();
          result = await store.set(BLOB_KEY, toArrayBuffer(bytes) as never);
        } else {
          console.error("Skipping db persist: blob has more members", latestCount, "vs", count);
          dirty = false;
          return;
        }
      } else if (latest.status === "missing") {
        const store = await getBlobStore();
        result = await store.set(BLOB_KEY, toArrayBuffer(bytes) as never);
      } else {
        dirty = false;
        return;
      }
    }
    currentEtag = result.etag;
    knownUserCount = count;
  } catch (err) {
    console.error("Netlify blob write failed", err);
  } finally {
    dirty = false;
  }
}

function schedulePersist() {
  if (!persistEnabled || !persistAllowed) return;
  dirty = true;
  if (isNetlify()) {
    persistQueue = persistQueue.then(persistNow).catch((err) => {
      console.error("persist queue failed", err);
    });
    return;
  }
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistQueue = persistQueue.then(persistNow);
  }, 80);
}

export async function flushSqlitePersist() {
  await persistQueue;
  if (dirty) await persistNow();
}

export async function openSqlite(): Promise<SqliteDb> {
  if (!SQLModule) {
    SQLModule = await initSqlJs();
  }

  await flushSqlitePersist();

  if (live && (dirty || !isNetlify())) {
    return live;
  }

  persistAllowed = true;
  blobMissing = false;
  currentEtag = undefined;

  const blob = await readBlob();
  const fileBytes = readLocalFile();
  let bytes: Uint8Array | null = null;

  if (blob.status === "ok") {
    const blobCount = countFromBytes(blob.data, SQLModule);
    const fileCount = fileBytes ? countFromBytes(fileBytes, SQLModule) : 0;
    if (fileCount > blobCount) {
      bytes = fileBytes;
      blobMissing = true;
      currentEtag = blob.etag;
    } else {
      bytes = blob.data;
      currentEtag = blob.etag;
    }
  } else if (blob.status === "missing") {
    bytes = fileBytes;
    blobMissing = true;
  } else {
    persistAllowed = false;
    bytes = fileBytes;
  }

  const engine = bytes ? new SQLModule.Database(bytes) : new SQLModule.Database();
  knownUserCount = userCount(engine);
  liveEngine = engine;
  live = new SqliteDb(engine, schedulePersist);
  dirty = false;
  return live;
}
