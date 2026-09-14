import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { getSession, requireRole } from "@/lib/auth";
import {
  createMemberNote,
  deleteMemberNote,
  getActiveMemberNotes,
  getAllMemberNotes,
  getMemberNoteById,
} from "@/lib/db";

const UPLOAD_DIR = path.join(
  process.env.NETLIFY ? "/tmp" : process.cwd(),
  process.env.NETLIFY ? "fajrgang-uploads" : "data/uploads"
);
const MAX_BYTES = 40 * 1024 * 1024;

const ALLOWED: Record<string, { type: "image" | "video"; ext: string }> = {
  "image/jpeg": { type: "image", ext: "jpg" },
  "image/png": { type: "image", ext: "png" },
  "image/webp": { type: "image", ext: "webp" },
  "image/gif": { type: "image", ext: "gif" },
  "video/mp4": { type: "video", ext: "mp4" },
  "video/webm": { type: "video", ext: "webm" },
};

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  if (requireRole(session, ["OWNER", "ADMIN"])) {
    return NextResponse.json({
      notes: await getAllMemberNotes(),
      activeNotes: await getActiveMemberNotes(),
    });
  }

  return NextResponse.json({ notes: await getActiveMemberNotes() });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !requireRole(session, ["OWNER", "ADMIN"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const form = await req.formData();
  const title = String(form.get("title") || "").trim();
  const body = String(form.get("body") || "").trim();
  const durationHours = Number(form.get("durationHours"));
  const file = form.get("file");

  if (!title && !body && !(file instanceof File && file.size > 0)) {
    return NextResponse.json({ error: "أضف نصاً أو صورة أو فيديو" }, { status: 400 });
  }

  if (!durationHours || durationHours <= 0 || durationHours > 24 * 30) {
    return NextResponse.json({ error: "مدة الظهور غير صحيحة" }, { status: 400 });
  }

  let mediaType: "none" | "image" | "video" = "none";
  let mediaPath: string | null = null;

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "الملف أكبر من 40 ميغابايت" }, { status: 400 });
    }
    const allowed = ALLOWED[file.type];
    if (!allowed) {
      return NextResponse.json(
        { error: "يُسمح بصور JPG/PNG/WEBP/GIF وفيديو MP4/WEBM فقط" },
        { status: 400 }
      );
    }

    await mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${allowed.ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, filename), buffer);
    mediaType = allowed.type;
    mediaPath = filename;
  }

  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();

  await createMemberNote({
    title,
    body,
    mediaType,
    mediaPath,
    durationHours,
    expiresAt,
    createdBy: session.id,
    createdAt,
  });

  return NextResponse.json({ success: true, message: "تم إرسال الملاحظة للأعضاء" });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !requireRole(session, ["OWNER", "ADMIN"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const body = await req.json();
  const note = await getMemberNoteById(Number(body.id));
  if (!note) {
    return NextResponse.json({ error: "الملاحظة غير موجودة" }, { status: 404 });
  }

  if (note.media_path) {
    try {
      await unlink(path.join(UPLOAD_DIR, path.basename(note.media_path)));
    } catch {
      // file may already be gone
    }
  }

  await deleteMemberNote(note.id);
  return NextResponse.json({ success: true, message: "تم حذف الملاحظة" });
}
