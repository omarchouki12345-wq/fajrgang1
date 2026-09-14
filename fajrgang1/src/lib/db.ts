import bcrypt from "bcryptjs";
import { POINTS } from "./constants";
import { SMALL_ADKAR } from "./adkar-data";
import type { UserRole, UserStatus } from "./constants";
import {
  canPersistSqlite,
  disableSqlitePersist,
  enableSqlitePersist,
  flushSqlitePersist,
  openSqlite,
  wasBlobMissing,
  type SqliteDb,
} from "./sqlite";

let db: SqliteDb;

function ensureSmallAdkarSeed() {
  const row = db.prepare("SELECT COUNT(*) as c FROM small_adkar").get() as { c?: number } | undefined;
  const adkarCount = Number(row?.c || 0);
  if (adkarCount < SMALL_ADKAR.length) {
    db.prepare("DELETE FROM small_adkar").run();
    const insert = db.prepare(`INSERT INTO small_adkar (text, sort_order) VALUES (?, ?)`);
    SMALL_ADKAR.forEach((text, i) => insert.run(text, i));
  }
}

const OWNER_WHATSAPP = "0680206241";
const OWNER_PASSWORD = "Hassan@@@111";

function ensurePasswordPlainColumn() {
  const cols = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "password_plain")) {
    db.exec("ALTER TABLE users ADD COLUMN password_plain TEXT");
  }
}

function ensureOwnerAccount() {
  const owner = db
    .prepare("SELECT id, whatsapp, password_plain FROM users WHERE role = 'OWNER'")
    .get() as { id: number; whatsapp: string; password_plain: string | null } | undefined;
  if (!owner) return;
  if (owner.whatsapp === OWNER_WHATSAPP && owner.password_plain === OWNER_PASSWORD) return;

  const taken = db
    .prepare("SELECT id FROM users WHERE whatsapp = ? AND id != ?")
    .get(OWNER_WHATSAPP, owner.id) as { id: number } | undefined;
  if (taken) {
    throw new Error("رقم واتساب المالك مستخدم من حساب آخر");
  }

  const hash = bcrypt.hashSync(OWNER_PASSWORD, 10);
  db.prepare(
    "UPDATE users SET whatsapp = ?, password = ?, password_plain = ? WHERE id = ?"
  ).run(OWNER_WHATSAPP, hash, OWNER_PASSWORD, owner.id);
}

function ensureNotesTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS member_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      media_type TEXT NOT NULL DEFAULT 'none',
      media_path TEXT,
      duration_hours REAL NOT NULL,
      expires_at TEXT NOT NULL,
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

async function getDb(): Promise<SqliteDb> {
  db = await openSqlite();
  disableSqlitePersist();
  db.pragma("foreign_keys = ON");
  initSchema();
  seedData();
  ensurePasswordPlainColumn();
  try {
    ensureOwnerAccount();
  } catch (err) {
    console.error("ensureOwnerAccount", err);
  }
  enableSqlitePersist();
  if (wasBlobMissing() && canPersistSqlite()) {
    await flushSqlitePersist();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS member_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      whatsapp TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      password_plain TEXT,
      role TEXT NOT NULL DEFAULT 'MEMBER',
      status TEXT NOT NULL DEFAULT 'PENDING',
      member_type_id INTEGER REFERENCES member_types(id),
      points INTEGER NOT NULL DEFAULT 0,
      streak INTEGER NOT NULL DEFAULT 0,
      best_streak INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS daily_checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      date TEXT NOT NULL,
      fajr_checked INTEGER NOT NULL DEFAULT 0,
      fajr_checked_at TEXT,
      adkar_sabah INTEGER NOT NULL DEFAULT 0,
      adkar_masa2 INTEGER NOT NULL DEFAULT 0,
      small_adkar_count INTEGER NOT NULL DEFAULT 0,
      points_earned INTEGER NOT NULL DEFAULT 0,
      UNIQUE(user_id, date)
    );

    CREATE TABLE IF NOT EXISTS memorization_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      surah_number INTEGER NOT NULL,
      start_ayah INTEGER NOT NULL,
      end_ayah INTEGER NOT NULL,
      deadline_date TEXT,
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS user_memorization (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      task_id INTEGER NOT NULL REFERENCES memorization_tasks(id),
      member_completed INTEGER NOT NULL DEFAULT 0,
      member_completed_at TEXT,
      admin_confirmed INTEGER NOT NULL DEFAULT 0,
      admin_confirmed_at TEXT,
      admin_confirmed_by INTEGER REFERENCES users(id),
      UNIQUE(user_id, task_id)
    );

    CREATE TABLE IF NOT EXISTS point_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      points INTEGER NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS small_adkar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS member_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      media_type TEXT NOT NULL DEFAULT 'none',
      media_path TEXT,
      duration_hours REAL NOT NULL,
      expires_at TEXT NOT NULL,
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

function seedData() {
  const ownerExists = db.prepare("SELECT id FROM users WHERE role = 'OWNER'").get();
  if (!ownerExists) {
    const hash = bcrypt.hashSync(OWNER_PASSWORD, 10);
    db.prepare(
      `INSERT INTO users (name, whatsapp, password, password_plain, role, status)
       VALUES (?, ?, ?, ?, 'OWNER', 'ACTIVE')`
    ).run("المالك", OWNER_WHATSAPP, hash, OWNER_PASSWORD);
  }

  // Remove legacy default admin account from older versions
  db.prepare(
    `DELETE FROM users WHERE whatsapp = '0611111111' AND role = 'ADMIN' AND name = 'المشرف'`
  ).run();

  const typeCount = db.prepare("SELECT COUNT(*) as c FROM member_types").get() as { c: number };
  if (typeCount.c === 0) {
    db.prepare(`INSERT INTO member_types (name, description) VALUES (?, ?)`).run(
      "عضو عادي",
      "عضو في المجموعة"
    );
    db.prepare(`INSERT INTO member_types (name, description) VALUES (?, ?)`).run(
      "عضو نشط",
      "عضو ملتزم بالأهداف اليومية"
    );
  }

  ensureSmallAdkarSeed();
}

export interface User {
  id: number;
  name: string;
  whatsapp: string;
  password: string;
  password_plain: string | null;
  role: UserRole;
  status: UserStatus;
  member_type_id: number | null;
  points: number;
  streak: number;
  best_streak: number;
  created_at: string;
}

export interface DailyCheckin {
  id: number;
  user_id: number;
  date: string;
  fajr_checked: number;
  fajr_checked_at: string | null;
  adkar_sabah: number;
  adkar_masa2: number;
  small_adkar_count: number;
  points_earned: number;
}

export async function getUserByWhatsapp(whatsapp: string): Promise<User | undefined> {
  return (await getDb())
    .prepare("SELECT * FROM users WHERE whatsapp = ?")
    .get(whatsapp) as User | undefined;
}

export async function getUserById(id: number): Promise<User | undefined> {
  return (await getDb()).prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
}

export async function createUser(
  name: string,
  whatsapp: string,
  passwordHash: string,
  memberTypeId?: number,
  passwordPlain?: string | null
): Promise<number> {
  const result = (await getDb())
    .prepare(
      `INSERT INTO users (name, whatsapp, password, member_type_id, password_plain)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(name, whatsapp, passwordHash, memberTypeId ?? null, passwordPlain ?? null);
  await flushSqlitePersist();
  return result.lastInsertRowid as number;
}

export async function resetUserPassword(
  userId: number,
  passwordHash: string,
  passwordPlain: string
) {
  (await getDb())
    .prepare("UPDATE users SET password = ?, password_plain = ? WHERE id = ?")
    .run(passwordHash, passwordPlain, userId);
  await flushSqlitePersist();
}

export function getTodayDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Casablanca",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function getOrCreateTodayCheckin(userId: number): Promise<DailyCheckin> {
  const today = getTodayDate();
  const existing = (await getDb())
    .prepare("SELECT * FROM daily_checkins WHERE user_id = ? AND date = ?")
    .get(userId, today) as DailyCheckin | undefined;

  if (existing) return existing;

  (await getDb())
    .prepare(`INSERT INTO daily_checkins (user_id, date) VALUES (?, ?)`)
    .run(userId, today);

  const created = (await getDb())
    .prepare("SELECT * FROM daily_checkins WHERE user_id = ? AND date = ?")
    .get(userId, today) as DailyCheckin;
  await flushSqlitePersist();
  return created;
}

export async function addPoints(userId: number, points: number, reason: string) {
  const dbi = (await getDb());
  dbi.prepare("UPDATE users SET points = points + ? WHERE id = ?").run(points, userId);
  dbi.prepare(
    `INSERT INTO point_history (user_id, points, reason) VALUES (?, ?, ?)`
  ).run(userId, points, reason);
  await flushSqlitePersist();
}

export async function updateStreak(userId: number) {
  const today = getTodayDate();
  const checkin = (await getDb())
    .prepare("SELECT * FROM daily_checkins WHERE user_id = ? AND date = ?")
    .get(userId, today) as DailyCheckin | undefined;

  if (!checkin) return;

  const goalsComplete =
    checkin.fajr_checked && checkin.adkar_sabah && checkin.adkar_masa2;

  if (!goalsComplete) return;

  const user = await getUserById(userId);
  if (!user) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const yesterdayCheckin = (await getDb())
    .prepare("SELECT * FROM daily_checkins WHERE user_id = ? AND date = ?")
    .get(userId, yesterdayStr) as DailyCheckin | undefined;

  const yesterdayComplete =
    yesterdayCheckin?.fajr_checked &&
    yesterdayCheckin?.adkar_sabah &&
    yesterdayCheckin?.adkar_masa2;

  const newStreak = yesterdayComplete ? user.streak + 1 : 1;
  const bestStreak = Math.max(user.best_streak, newStreak);

  (await getDb())
    .prepare("UPDATE users SET streak = ?, best_streak = ? WHERE id = ?")
    .run(newStreak, bestStreak, userId);
  await flushSqlitePersist();
}

export async function recordFajrCheckin(userId: number): Promise<{ success: boolean; message: string }> {
  const checkin = await getOrCreateTodayCheckin(userId);
  if (checkin.fajr_checked) {
    return { success: false, message: "تم تسجيل الفجر مسبقاً اليوم" };
  }

  (await getDb())
    .prepare(
      `UPDATE daily_checkins SET fajr_checked = 1, fajr_checked_at = datetime('now'),
       points_earned = points_earned + ? WHERE id = ?`
    )
    .run(POINTS.FAJR, checkin.id);

  await addPoints(userId, POINTS.FAJR, "تسجيل صلاة الفجر");
  await updateStreak(userId);
  return { success: true, message: "تم تسجيل الفجر بنجاح! +" + POINTS.FAJR + " نقطة" };
}

export async function recordAdkarSabah(userId: number): Promise<{ success: boolean; message: string }> {
  const checkin = await getOrCreateTodayCheckin(userId);
  if (checkin.adkar_sabah) {
    return { success: false, message: "تم تسجيل أذكار الصباح مسبقاً" };
  }

  (await getDb())
    .prepare(
      `UPDATE daily_checkins SET adkar_sabah = 1, points_earned = points_earned + ? WHERE id = ?`
    )
    .run(POINTS.ADKAR_SABAH, checkin.id);

  await addPoints(userId, POINTS.ADKAR_SABAH, "أذكار الصباح");
  await updateStreak(userId);
  return { success: true, message: "تم تسجيل أذكار الصباح! +" + POINTS.ADKAR_SABAH + " نقطة" };
}

export async function recordAdkarMasa2(userId: number): Promise<{ success: boolean; message: string }> {
  const checkin = await getOrCreateTodayCheckin(userId);
  if (checkin.adkar_masa2) {
    return { success: false, message: "تم تسجيل أذكار المساء مسبقاً" };
  }

  (await getDb())
    .prepare(
      `UPDATE daily_checkins SET adkar_masa2 = 1, points_earned = points_earned + ? WHERE id = ?`
    )
    .run(POINTS.ADKAR_MASA2, checkin.id);

  await addPoints(userId, POINTS.ADKAR_MASA2, "أذكار المساء");
  await updateStreak(userId);
  return { success: true, message: "تم تسجيل أذكار المساء! +" + POINTS.ADKAR_MASA2 + " نقطة" };
}

export async function recordSmallAdkar(userId: number): Promise<{ success: boolean; message: string; adkar?: string }> {
  const checkin = await getOrCreateTodayCheckin(userId);
  const adkarList = (await getDb())
    .prepare("SELECT * FROM small_adkar ORDER BY sort_order")
    .all() as { id: number; text: string; sort_order: number }[];

  const nextIndex = checkin.small_adkar_count % adkarList.length;
  const nextAdkar = adkarList[nextIndex];

  (await getDb())
    .prepare(
      `UPDATE daily_checkins SET small_adkar_count = small_adkar_count + 1,
       points_earned = points_earned + ? WHERE id = ?`
    )
    .run(POINTS.SMALL_ADKAR, checkin.id);

  await addPoints(userId, POINTS.SMALL_ADKAR, "ذكر قصير");
  return {
    success: true,
    message: "+" + POINTS.SMALL_ADKAR + " نقطة",
    adkar: nextAdkar.text,
  };
}

const MEMBER_LIST_COLUMNS = `u.id, u.name, u.whatsapp, u.password_plain, u.role, u.status, u.points, u.streak, u.best_streak, u.member_type_id, u.created_at, mt.name as member_type_name`;

export async function getAllMembers() {
  return (await getDb())
    .prepare(
      `SELECT ${MEMBER_LIST_COLUMNS} FROM users u
       LEFT JOIN member_types mt ON u.member_type_id = mt.id
       WHERE u.role = 'MEMBER' ORDER BY u.created_at DESC`
    )
    .all();
}

export async function getAllUsers() {
  return (await getDb())
    .prepare(
      `SELECT ${MEMBER_LIST_COLUMNS} FROM users u
       LEFT JOIN member_types mt ON u.member_type_id = mt.id
       ORDER BY u.role, u.created_at DESC`
    )
    .all();
}

export interface AdminMemTask {
  id: number;
  surah_number: number;
  start_ayah: number;
  end_ayah: number;
  deadline_date: string | null;
}

export interface MemberMemStatus {
  taskId: number;
  userMemId: number | null;
  memberCompleted: boolean;
  adminConfirmed: boolean;
}

export async function getAdminMemberProgress(date: string) {
  const tasks = await getActiveMemorizationTasks() as AdminMemTask[];

  const members = (await getDb())
    .prepare(
      `SELECT u.id, u.name, u.whatsapp, u.status, u.streak, u.points,
              COALESCE(c.fajr_checked, 0) as fajr_checked,
              c.fajr_checked_at,
              COALESCE(c.adkar_sabah, 0) as adkar_sabah,
              COALESCE(c.adkar_masa2, 0) as adkar_masa2,
              COALESCE(c.small_adkar_count, 0) as small_adkar_count
       FROM users u
       LEFT JOIN daily_checkins c ON c.user_id = u.id AND c.date = ?
       WHERE u.role = 'MEMBER' AND u.status != 'REMOVED'
       ORDER BY u.name`
    )
    .all(date) as {
      id: number;
      name: string;
      whatsapp: string;
      status: UserStatus;
      streak: number;
      points: number;
      fajr_checked: number;
      fajr_checked_at: string | null;
      adkar_sabah: number;
      adkar_masa2: number;
      small_adkar_count: number;
    }[];

  const memRows = (await getDb())
    .prepare(
      `SELECT um.id as user_mem_id, um.user_id, um.task_id,
              um.member_completed, um.admin_confirmed
       FROM user_memorization um
       JOIN memorization_tasks mt ON um.task_id = mt.id
       WHERE mt.active = 1`
    )
    .all() as {
      user_mem_id: number;
      user_id: number;
      task_id: number;
      member_completed: number;
      admin_confirmed: number;
    }[];

  const byUserTask = new Map<string, (typeof memRows)[number]>();
  for (const row of memRows) {
    byUserTask.set(`${row.user_id}:${row.task_id}`, row);
  }

  return {
    date,
    tasks,
    members: members.map((m) => ({
      ...m,
      memorizations: tasks.map((task) => {
        const row = byUserTask.get(`${m.id}:${task.id}`);
        return {
          taskId: task.id,
          userMemId: row?.user_mem_id ?? null,
          memberCompleted: Boolean(row?.member_completed),
          adminConfirmed: Boolean(row?.admin_confirmed),
        } satisfies MemberMemStatus;
      }),
    })),
  };
}

export async function updateUserStatus(userId: number, status: UserStatus) {
  (await getDb()).prepare("UPDATE users SET status = ? WHERE id = ?").run(status, userId);
  await flushSqlitePersist();
}

export async function approveUser(userId: number, memberTypeId?: number) {
  if (memberTypeId) {
    (await getDb())
      .prepare("UPDATE users SET status = 'ACTIVE', member_type_id = ? WHERE id = ?")
      .run(memberTypeId, userId);
  } else {
    (await getDb()).prepare("UPDATE users SET status = 'ACTIVE' WHERE id = ?").run(userId);
  }
  await flushSqlitePersist();
}

export async function getMemberTypes() {
  return (await getDb()).prepare("SELECT * FROM member_types ORDER BY name").all();
}

export async function createMemberType(name: string, description: string) {
  const result = (await getDb())
    .prepare("INSERT INTO member_types (name, description) VALUES (?, ?)")
    .run(name, description);
  await flushSqlitePersist();
  return result;
}

export async function deleteMemberType(id: number) {
  (await getDb()).prepare("DELETE FROM member_types WHERE id = ?").run(id);
  await flushSqlitePersist();
}

export async function createMemorizationTask(
  surahNumber: number,
  startAyah: number,
  endAyah: number,
  deadlineDate: string | null,
  createdBy: number
) {
  return (await getDb())
    .prepare(
      `INSERT INTO memorization_tasks (surah_number, start_ayah, end_ayah, deadline_date, created_by)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(surahNumber, startAyah, endAyah, deadlineDate, createdBy);
}

export async function updateMemorizationTask(
  taskId: number,
  surahNumber: number,
  startAyah: number,
  endAyah: number,
  deadlineDate: string | null
): Promise<{ success: boolean; message: string }> {
  const existing = (await getDb())
    .prepare("SELECT id, active FROM memorization_tasks WHERE id = ?")
    .get(taskId) as { id: number; active: number } | undefined;
  if (!existing || !existing.active) {
    return { success: false, message: "المهمة غير موجودة" };
  }

  (await getDb())
    .prepare(
      `UPDATE memorization_tasks
       SET surah_number = ?, start_ayah = ?, end_ayah = ?, deadline_date = ?
       WHERE id = ?`
    )
    .run(surahNumber, startAyah, endAyah, deadlineDate, taskId);

  return { success: true, message: "تم تحديث مهمة الحفظ" };
}

export async function deactivateMemorizationTask(taskId: number): Promise<{ success: boolean; message: string }> {
  const existing = (await getDb())
    .prepare("SELECT id FROM memorization_tasks WHERE id = ? AND active = 1")
    .get(taskId);
  if (!existing) return { success: false, message: "المهمة غير موجودة" };

  (await getDb()).prepare("UPDATE memorization_tasks SET active = 0 WHERE id = ?").run(taskId);
  return { success: true, message: "تم حذف مهمة الحفظ" };
}

export async function getActiveMemorizationTasks() {
  return (await getDb())
    .prepare("SELECT * FROM memorization_tasks WHERE active = 1 ORDER BY created_at DESC")
    .all();
}

export async function assignMemorizationToUser(userId: number, taskId: number) {
  try {
    (await getDb())
      .prepare(
        `INSERT INTO user_memorization (user_id, task_id) VALUES (?, ?)`
      )
      .run(userId, taskId);
    return true;
  } catch {
    return false;
  }
}

export async function getUserMemorizations(userId: number) {
  return (await getDb())
    .prepare(
      `SELECT um.*, mt.surah_number, mt.start_ayah, mt.end_ayah, mt.deadline_date
       FROM user_memorization um
       JOIN memorization_tasks mt ON um.task_id = mt.id
       WHERE um.user_id = ? ORDER BY um.id DESC`
    )
    .all(userId);
}

export async function getPendingMemorizationConfirmations() {
  return (await getDb())
    .prepare(
      `SELECT um.*, u.name as user_name, u.whatsapp as user_whatsapp,
              mt.surah_number, mt.start_ayah, mt.end_ayah
       FROM user_memorization um
       JOIN users u ON um.user_id = u.id
       JOIN memorization_tasks mt ON um.task_id = mt.id
       WHERE um.member_completed = 1 AND um.admin_confirmed = 0`
    )
    .all();
}

export async function memberCompleteMemorization(userId: number, taskId: number) {
  const existing = (await getDb())
    .prepare(
      `SELECT * FROM user_memorization WHERE user_id = ? AND task_id = ?`
    )
    .get(userId, taskId) as { member_completed: number } | undefined;

  if (!existing) {
    await assignMemorizationToUser(userId, taskId);
  }

  (await getDb())
    .prepare(
      `UPDATE user_memorization SET member_completed = 1, member_completed_at = datetime('now')
       WHERE user_id = ? AND task_id = ?`
    )
    .run(userId, taskId);

  return { success: true, message: "تم إرسال طلب التأكيد للمشرف" };
}

export async function adminConfirmMemorization(
  userMemId: number,
  adminId: number
): Promise<{ success: boolean; message: string }> {
  const record = (await getDb())
    .prepare("SELECT * FROM user_memorization WHERE id = ?")
    .get(userMemId) as { user_id: number; admin_confirmed: number } | undefined;

  if (!record) return { success: false, message: "السجل غير موجود" };
  if (record.admin_confirmed) return { success: false, message: "تم التأكيد مسبقاً" };

  (await getDb())
    .prepare(
      `UPDATE user_memorization SET admin_confirmed = 1, admin_confirmed_at = datetime('now'),
       admin_confirmed_by = ? WHERE id = ?`
    )
    .run(adminId, userMemId);

  await addPoints(record.user_id, POINTS.MEMORIZATION, "تأكيد حفظ القرآن");
  return { success: true, message: "تم تأكيد الحفظ بنجاح" };
}

export async function getLeaderboard() {
  return (await getDb())
    .prepare(
      `SELECT id, name, points, streak, best_streak, member_type_id,
       (SELECT name FROM member_types WHERE id = users.member_type_id) as member_type_name
       FROM users WHERE role = 'MEMBER' AND status = 'ACTIVE'
       ORDER BY points DESC, streak DESC LIMIT 50`
    )
    .all();
}

export async function getUserHistory(userId: number, limit = 30) {
  return (await getDb())
    .prepare(
      `SELECT * FROM point_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`
    )
    .all(userId, limit);
}

export async function getUserCheckinHistory(userId: number, limit = 14) {
  return (await getDb())
    .prepare(
      `SELECT * FROM daily_checkins WHERE user_id = ? ORDER BY date DESC LIMIT ?`
    )
    .all(userId, limit);
}

export async function getSmallAdkar() {
  return (await getDb()).prepare("SELECT * FROM small_adkar ORDER BY sort_order").all();
}

export async function promoteToAdmin(userId: number): Promise<{ success: boolean; message: string }> {
  const user = await getUserById(userId);
  if (!user) return { success: false, message: "المستخدم غير موجود" };
  if (user.role !== "MEMBER") return { success: false, message: "يمكن ترقية الأعضاء فقط" };
  if (user.status !== "ACTIVE") return { success: false, message: "يجب أن يكون العضو مفعّلاً أولاً" };

  (await getDb()).prepare("UPDATE users SET role = 'ADMIN' WHERE id = ?").run(userId);
  await flushSqlitePersist();
  return { success: true, message: `تم ترقية ${user.name} إلى مشرف` };
}

export async function demoteAdmin(userId: number): Promise<{ success: boolean; message: string }> {
  const user = await getUserById(userId);
  if (!user) return { success: false, message: "المستخدم غير موجود" };
  if (user.role !== "ADMIN") return { success: false, message: "هذا المستخدم ليس مشرفاً" };

  (await getDb()).prepare("UPDATE users SET role = 'MEMBER' WHERE id = ?").run(userId);
  await flushSqlitePersist();
  return { success: true, message: `تم إزالة صلاحية المشرف من ${user.name}` };
}

export async function deleteUser(userId: number) {
  (await getDb()).prepare("UPDATE users SET status = 'REMOVED' WHERE id = ?").run(userId);
  await flushSqlitePersist();
}

export interface MemberNote {
  id: number;
  title: string;
  body: string;
  media_type: "none" | "image" | "video";
  media_path: string | null;
  duration_hours: number;
  expires_at: string;
  created_by: number;
  created_at: string;
  created_by_name: string;
}

export async function createMemberNote(note: {
  title: string;
  body: string;
  mediaType: "none" | "image" | "video";
  mediaPath: string | null;
  durationHours: number;
  expiresAt: string;
  createdBy: number;
  createdAt: string;
}) {
  return (await getDb())
    .prepare(
      `INSERT INTO member_notes
        (title, body, media_type, media_path, duration_hours, expires_at, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      note.title,
      note.body,
      note.mediaType,
      note.mediaPath,
      note.durationHours,
      note.expiresAt,
      note.createdBy,
      note.createdAt
    );
}

export async function getActiveMemberNotes(): Promise<MemberNote[]> {
  const now = new Date().toISOString();
  return (await getDb())
    .prepare(
      `SELECT n.*, u.name as created_by_name
       FROM member_notes n
       JOIN users u ON u.id = n.created_by
       WHERE n.expires_at > ?
       ORDER BY n.created_at DESC`
    )
    .all(now) as MemberNote[];
}

export async function getAllMemberNotes(): Promise<MemberNote[]> {
  return (await getDb())
    .prepare(
      `SELECT n.*, u.name as created_by_name
       FROM member_notes n
       JOIN users u ON u.id = n.created_by
       ORDER BY n.created_at DESC`
    )
    .all() as MemberNote[];
}

export async function getMemberNoteById(id: number): Promise<MemberNote | undefined> {
  return (await getDb())
    .prepare(
      `SELECT n.*, u.name as created_by_name
       FROM member_notes n
       JOIN users u ON u.id = n.created_by
       WHERE n.id = ?`
    )
    .get(id) as MemberNote | undefined;
}

export async function deleteMemberNote(id: number): Promise<boolean> {
  const result = (await getDb()).prepare("DELETE FROM member_notes WHERE id = ?").run(id);
  return result.changes > 0;
}

export { getDb };
