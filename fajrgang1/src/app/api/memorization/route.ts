import { NextRequest, NextResponse } from "next/server";
import { getSession, requireRole } from "@/lib/auth";
import {
  adminConfirmMemorization,
  createMemorizationTask,
  deactivateMemorizationTask,
  getActiveMemorizationTasks,
  getPendingMemorizationConfirmations,
  getUserMemorizations,
  memberCompleteMemorization,
  updateMemorizationTask,
} from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  if (requireRole(session, ["OWNER", "ADMIN"])) {
    const tasks = await getActiveMemorizationTasks();
    const pending = await getPendingMemorizationConfirmations();
    return NextResponse.json({ tasks, pending });
  }

  const memorizations = await getUserMemorizations(session.id);
  const tasks = await getActiveMemorizationTasks();
  return NextResponse.json({ memorizations, tasks });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const body = await req.json();

  if (body.action === "create_task") {
    if (!requireRole(session, ["OWNER", "ADMIN"])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const { surahNumber, startAyah, endAyah, deadlineDate } = body;
    if (!surahNumber || !startAyah || !endAyah) {
      return NextResponse.json({ error: "يرجى إدخال جميع الحقول" }, { status: 400 });
    }

    await createMemorizationTask(
      surahNumber,
      startAyah,
      endAyah,
      deadlineDate || null,
      session.id
    );

    return NextResponse.json({ success: true, message: "تم إنشاء مهمة الحفظ" });
  }

  if (body.action === "update_task") {
    if (!requireRole(session, ["OWNER", "ADMIN"])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const { taskId, surahNumber, startAyah, endAyah, deadlineDate } = body;
    if (!taskId || !surahNumber || !startAyah || !endAyah) {
      return NextResponse.json({ error: "يرجى إدخال جميع الحقول" }, { status: 400 });
    }

    const result = await updateMemorizationTask(
      Number(taskId),
      Number(surahNumber),
      Number(startAyah),
      Number(endAyah),
      deadlineDate || null
    );
    return NextResponse.json(
      result.success ? result : { error: result.message },
      { status: result.success ? 200 : 400 }
    );
  }

  if (body.action === "delete_task") {
    if (!requireRole(session, ["OWNER", "ADMIN"])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const result = await deactivateMemorizationTask(Number(body.taskId));
    return NextResponse.json(
      result.success ? result : { error: result.message },
      { status: result.success ? 200 : 400 }
    );
  }

  if (body.action === "member_complete") {
    if (session.status !== "ACTIVE") {
      return NextResponse.json({ error: "حسابك غير مفعّل" }, { status: 403 });
    }

    const result = await memberCompleteMemorization(session.id, body.taskId);
    return NextResponse.json(result);
  }

  if (body.action === "admin_confirm") {
    if (!requireRole(session, ["OWNER", "ADMIN"])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const result = await adminConfirmMemorization(body.userMemId, session.id);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
}
