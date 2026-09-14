import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { createUser, getUserByWhatsapp } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { name, whatsapp, password } = await req.json();

    if (!name || !whatsapp || !password) {
      return NextResponse.json({ error: "يرجى إدخال جميع الحقول" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }, { status: 400 });
    }

    const existing = await getUserByWhatsapp(whatsapp);
    if (existing) {
      return NextResponse.json({ error: "رقم الواتساب مسجل مسبقاً" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    await createUser(name, whatsapp, passwordHash, undefined, password);

    return NextResponse.json({
      message: "تم التسجيل بنجاح! انتظر تأكيد حسابك من المالك",
    });
  } catch (err) {
    console.error("register failed", err);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
