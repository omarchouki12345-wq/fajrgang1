import { NextRequest, NextResponse } from "next/server";
import { getSession, requireRole } from "@/lib/auth";
import { getAdminMemberProgress, getTodayDate } from "@/lib/db";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !requireRole(session, ["OWNER", "ADMIN"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const requested = req.nextUrl.searchParams.get("date") || getTodayDate();
  if (!DATE_RE.test(requested)) {
    return NextResponse.json({ error: "تاريخ غير صالح" }, { status: 400 });
  }

  return NextResponse.json(await getAdminMemberProgress(requested));
}
