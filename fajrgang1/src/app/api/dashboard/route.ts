import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getActiveMemberNotes,
  getOrCreateTodayCheckin,
  getUserById,
  getUserCheckinHistory,
  getUserHistory,
} from "@/lib/db";
import { getPrayerTimesForDate, formatTime, resolveCityKey } from "@/lib/prayer";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const user = await getUserById(session.id);
  if (!user) {
    return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
  }

  const city = resolveCityKey(
    req.nextUrl.searchParams.get("region") || req.nextUrl.searchParams.get("city")
  );
  const todayCheckin = await getOrCreateTodayCheckin(session.id);
  const history = await getUserHistory(session.id);
  const checkinHistory = await getUserCheckinHistory(session.id);
  const prayers = await getPrayerTimesForDate(new Date(), city);

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      points: user.points,
      streak: user.streak,
      best_streak: user.best_streak,
      status: user.status,
      role: user.role,
    },
    todayCheckin,
    history,
    checkinHistory,
    city,
    cityNameAr: prayers.cityNameAr,
    prayerTimes: {
      fajr: formatTime(prayers.fajr),
      sunrise: formatTime(prayers.sunrise),
      dhuhr: formatTime(prayers.dhuhr),
      asr: formatTime(prayers.asr),
      maghrib: formatTime(prayers.maghrib),
      isha: formatTime(prayers.isha),
    },
    notes: await getActiveMemberNotes(),
  });
}
