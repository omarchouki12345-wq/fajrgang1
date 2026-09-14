import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getOrCreateTodayCheckin,
  recordAdkarMasa2,
  recordAdkarSabah,
  recordFajrCheckin,
  recordSmallAdkar,
} from "@/lib/db";
import {
  getCheckinWindows,
  formatTime,
  resolveCityKey,
  type TimeWindowResult,
} from "@/lib/prayer";

function serializeWindow(window: TimeWindowResult) {
  return {
    valid: window.valid,
    message: window.message,
    start: window.start.toISOString(),
    end: window.end.toISOString(),
    startFormatted: formatTime(window.start),
    endFormatted: formatTime(window.end),
  };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const city = resolveCityKey(
    req.nextUrl.searchParams.get("region") || req.nextUrl.searchParams.get("city")
  );
  const checkin = await getOrCreateTodayCheckin(session.id);
  const { prayers, fajr, adkarSabah, adkarMasa2 } = await getCheckinWindows(
    new Date(),
    city
  );

  return NextResponse.json({
    checkin,
    city,
    cityNameAr: prayers.cityNameAr,
    source: prayers.source,
    prayerTimes: {
      fajr: formatTime(prayers.fajr),
      sunrise: formatTime(prayers.sunrise),
      dhuhr: formatTime(prayers.dhuhr),
      asr: formatTime(prayers.asr),
      maghrib: formatTime(prayers.maghrib),
      isha: formatTime(prayers.isha),
    },
    windows: {
      fajr: serializeWindow(fajr),
      adkarSabah: serializeWindow(adkarSabah),
      adkarMasa2: serializeWindow(adkarMasa2),
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  if (session.status !== "ACTIVE") {
    return NextResponse.json({ error: "حسابك غير مفعّل بعد" }, { status: 403 });
  }

  const body = await req.json();
  const city = resolveCityKey(body.region || body.city);
  const { fajr, adkarSabah, adkarMasa2 } = await getCheckinWindows(new Date(), city);

  switch (body.action) {
    case "fajr": {
      if (!fajr.valid) {
        return NextResponse.json({ error: fajr.message }, { status: 400 });
      }
      const result = await recordFajrCheckin(session.id);
      return NextResponse.json(result);
    }
    case "adkar_sabah": {
      if (!adkarSabah.valid) {
        return NextResponse.json({ error: adkarSabah.message }, { status: 400 });
      }
      const result = await recordAdkarSabah(session.id);
      return NextResponse.json(result);
    }
    case "adkar_masa2": {
      if (!adkarMasa2.valid) {
        return NextResponse.json({ error: adkarMasa2.message }, { status: 400 });
      }
      const result = await recordAdkarMasa2(session.id);
      return NextResponse.json(result);
    }
    case "small_adkar": {
      const result = await recordSmallAdkar(session.id);
      return NextResponse.json(result);
    }
    default:
      return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  }
}
