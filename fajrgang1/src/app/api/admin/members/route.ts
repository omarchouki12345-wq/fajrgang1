import { NextRequest, NextResponse } from "next/server";
import { generateMemberPassword, getSession, hashPassword, requireRole } from "@/lib/auth";
import {
  approveUser,
  createMemberType,
  deleteMemberType,
  deleteUser,
  demoteAdmin,
  getAllMembers,
  getAllUsers,
  getMemberTypes,
  getUserById,
  promoteToAdmin,
  resetUserPassword,
  updateUserStatus,
} from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !requireRole(session, ["OWNER", "ADMIN"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const type = req.nextUrl.searchParams.get("type");

  if (type === "member_types") {
    return NextResponse.json({ memberTypes: await getMemberTypes() });
  }

  if (session.role === "OWNER") {
    return NextResponse.json({ members: await getAllUsers() });
  }

  return NextResponse.json({ members: await getAllMembers() });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !requireRole(session, ["OWNER", "ADMIN"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const body = await req.json();

  switch (body.action) {
    case "approve":
      await approveUser(body.userId, body.memberTypeId);
      return NextResponse.json({ success: true, message: "تم تأكيد العضو" });

    case "pause":
      await updateUserStatus(body.userId, "PAUSED");
      return NextResponse.json({ success: true, message: "تم إيقاف الحساب" });

    case "activate":
      await updateUserStatus(body.userId, "ACTIVE");
      return NextResponse.json({ success: true, message: "تم تفعيل الحساب" });

    case "remove":
      await deleteUser(body.userId);
      return NextResponse.json({ success: true, message: "تم إزالة الحساب" });

    case "create_member_type":
      await createMemberType(body.name, body.description || "");
      return NextResponse.json({ success: true, message: "تم إنشاء نوع العضو" });

    case "delete_member_type":
      await deleteMemberType(body.typeId);
      return NextResponse.json({ success: true, message: "تم حذف نوع العضو" });

    case "promote_admin":
      if (session.role !== "OWNER") {
        return NextResponse.json({ error: "فقط المالك يمكنه ترقية المشرفين" }, { status: 403 });
      }
      {
        const result = await promoteToAdmin(body.userId);
        return NextResponse.json(
          result.success ? { success: true, message: result.message } : { error: result.message },
          { status: result.success ? 200 : 400 }
        );
      }

    case "demote_admin":
      if (session.role !== "OWNER") {
        return NextResponse.json({ error: "فقط المالك يمكنه إزالة المشرفين" }, { status: 403 });
      }
      {
        const result = await demoteAdmin(body.userId);
        return NextResponse.json(
          result.success ? { success: true, message: result.message } : { error: result.message },
          { status: result.success ? 200 : 400 }
        );
      }

    case "reset_password": {
      const target = await getUserById(Number(body.userId));
      if (!target) {
        return NextResponse.json({ error: "العضو غير موجود" }, { status: 404 });
      }
      if (target.role === "OWNER") {
        return NextResponse.json({ error: "لا يمكن إعادة تعيين كلمة مرور المالك" }, { status: 403 });
      }
      if (session.role === "ADMIN" && target.role !== "MEMBER") {
        return NextResponse.json(
          { error: "يمكن للمشرف إعادة تعيين كلمات مرور الأعضاء فقط" },
          { status: 403 }
        );
      }

      const custom = typeof body.password === "string" ? body.password.trim() : "";
      const newPassword = custom || generateMemberPassword();
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" },
          { status: 400 }
        );
      }

      const passwordHash = await hashPassword(newPassword);
      await resetUserPassword(target.id, passwordHash, newPassword);
      return NextResponse.json({
        success: true,
        message: `تم تعيين كلمة مرور جديدة لـ ${target.name}`,
        password: newPassword,
        userId: target.id,
      });
    }

    default:
      return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  }
}
