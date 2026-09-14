import { NextRequest, NextResponse } from "next/server";
import { createToken, setSessionCookie, verifyPassword } from "@/lib/auth";
import { getUserByWhatsapp } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { whatsapp, password } = await req.json();

    if (!whatsapp || !password) {
      return NextResponse.json({ error: "يرجى إدخال جميع الحقول" }, { status: 400 });
    }

    const user = await getUserByWhatsapp(whatsapp);
    if (!user) {
      return NextResponse.json({ error: "رقم الواتساب أو كلمة المرور غير صحيحة" }, { status: 401 });
    }

    if (user.status === "REMOVED") {
      return NextResponse.json({ error: "تم إزالة حسابك" }, { status: 403 });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "رقم الواتساب أو كلمة المرور غير صحيحة" }, { status: 401 });
    }

    const token = await createToken({
      id: user.id,
      name: user.name,
      whatsapp: user.whatsapp,
      role: user.role,
      status: user.status,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    console.error("login failed", err);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
