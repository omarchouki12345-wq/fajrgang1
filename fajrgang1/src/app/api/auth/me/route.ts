import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUserById } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const user = await getUserById(session.id);
  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      whatsapp: user.whatsapp,
      role: user.role,
      status: user.status,
      points: user.points,
      streak: user.streak,
      best_streak: user.best_streak,
    },
  });
}
