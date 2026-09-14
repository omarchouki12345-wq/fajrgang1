import {
  Coordinates,
  CalculationMethod,
  PrayerTimes,
  Prayer,
  Madhab,
} from "adhan";
import { DEFAULT_REGION, MOROCCO_REGIONS, resolveRegionKey, type MoroccoRegionKey } from "./constants";

export const MOROCCO_TZ = "Africa/Casablanca";

export interface PrayerTimesData {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  city: MoroccoRegionKey;
  cityNameAr: string;
  source: "aladhan" | "local";
}

export interface TimeWindowResult {
  valid: boolean;
  start: Date;
  end: Date;
  message: string;
}

const cache = new Map<string, { data: PrayerTimesData; fetchedAt: number }>();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function getMoroccoParams() {
  const params = CalculationMethod.Other();
  params.fajrAngle = 19;
  params.ishaAngle = 17;
  params.madhab = Madhab.Shafi;
  params.adjustments = {
    fajr: 0,
    sunrise: 0,
    dhuhr: 5,
    asr: 0,
    maghrib: 5,
    isha: 0,
  };
  return params;
}

function getDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MOROCCO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Parse HH:mm in Morocco timezone to a UTC Date instant */
export function parseMoroccoTime(baseDate: Date, hhmm: string): Date {
  const [hour, minute] = hhmm.split(":").map(Number);
  const ymd = getDateKey(baseDate);
  const [year, month, day] = ymd.split("-").map(Number);

  const dayStart = Date.UTC(year, month - 1, day, 0, 0);
  const dayEnd = Date.UTC(year, month - 1, day + 1, 0, 0);

  for (let utc = dayStart; utc < dayEnd; utc += 60_000) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: MOROCCO_TZ,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date(utc));

    const h = Number(parts.find((p) => p.type === "hour")!.value);
    const m = Number(parts.find((p) => p.type === "minute")!.value);

    if (h === hour && m === minute) {
      return new Date(utc);
    }
  }

  throw new Error(`Could not parse prayer time ${hhmm} for ${ymd}`);
}

function calculateLocalPrayerTimes(
  date: Date,
  regionKey: MoroccoRegionKey
): PrayerTimesData {
  const region = MOROCCO_REGIONS[regionKey];
  const coords = new Coordinates(region.lat, region.lng);
  const params = getMoroccoParams();
  const prayers = new PrayerTimes(coords, date, params);

  return {
    fajr: prayers.timeForPrayer(Prayer.Fajr)!,
    sunrise: prayers.timeForPrayer(Prayer.Sunrise)!,
    dhuhr: prayers.timeForPrayer(Prayer.Dhuhr)!,
    asr: prayers.timeForPrayer(Prayer.Asr)!,
    maghrib: prayers.timeForPrayer(Prayer.Maghrib)!,
    isha: prayers.timeForPrayer(Prayer.Isha)!,
    city: regionKey,
    cityNameAr: region.name,
    source: "local",
  };
}

async function fetchAladhanPrayerTimes(
  date: Date,
  regionKey: MoroccoRegionKey
): Promise<PrayerTimesData> {
  const region = MOROCCO_REGIONS[regionKey];
  const dateKey = getDateKey(date);
  const [year, month, day] = dateKey.split("-");
  const url = new URL("https://api.aladhan.com/v1/timingsByCity");
  url.searchParams.set("city", region.apiName);
  url.searchParams.set("country", "Morocco");
  url.searchParams.set("method", "21");
  url.searchParams.set("date", `${day}-${month}-${year}`);

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`Aladhan API error: ${res.status}`);
  }

  const json = await res.json();
  const timings = json?.data?.timings;
  if (!timings) {
    throw new Error("Invalid Aladhan response");
  }

  return {
    fajr: parseMoroccoTime(date, timings.Fajr),
    sunrise: parseMoroccoTime(date, timings.Sunrise),
    dhuhr: parseMoroccoTime(date, timings.Dhuhr),
    asr: parseMoroccoTime(date, timings.Asr),
    maghrib: parseMoroccoTime(date, timings.Maghrib),
    isha: parseMoroccoTime(date, timings.Isha),
    city: regionKey,
    cityNameAr: region.name,
    source: "aladhan",
  };
}

export function resolveCityKey(city?: string | null): MoroccoRegionKey {
  return resolveRegionKey(city);
}

export async function getPrayerTimesForDate(
  date: Date = new Date(),
  cityKey: MoroccoRegionKey = DEFAULT_REGION
): Promise<PrayerTimesData> {
  const cacheKey = `${cityKey}:${getDateKey(date)}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const data = await fetchAladhanPrayerTimes(date, cityKey);
    cache.set(cacheKey, { data, fetchedAt: Date.now() });
    return data;
  } catch {
    const data = calculateLocalPrayerTimes(date, cityKey);
    cache.set(cacheKey, { data, fetchedAt: Date.now() });
    return data;
  }
}

function checkWindow(
  now: Date,
  start: Date,
  end: Date,
  label: string
): TimeWindowResult {
  if (now >= start && now <= end) {
    return { valid: true, start, end, message: `أنت في وقت ${label} المسموح` };
  }

  if (now < start) {
    return { valid: false, start, end, message: `لم يبدأ وقت ${label} بعد` };
  }

  return { valid: false, start, end, message: `انتهى وقت ${label}` };
}

/** Fajr check-in: 30 min before Fajr → 1h 15min after Fajr */
export function getFajrWindow(
  prayers: PrayerTimesData,
  now: Date = new Date()
): TimeWindowResult {
  const start = addMinutes(prayers.fajr, -30);
  const end = addMinutes(prayers.fajr, 75);
  return checkWindow(now, start, end, "تسجيل الفجر");
}

/** Morning adkar: from Fajr → 1 hour before Dhuhr */
export function getAdkarSabahWindow(
  prayers: PrayerTimesData,
  now: Date = new Date()
): TimeWindowResult {
  const start = prayers.fajr;
  const end = addMinutes(prayers.dhuhr, -60);
  return checkWindow(now, start, end, "أذكار الصباح");
}

/** Evening adkar: from Asr → Isha */
export function getAdkarMasa2Window(
  prayers: PrayerTimesData,
  now: Date = new Date()
): TimeWindowResult {
  return checkWindow(now, prayers.asr, prayers.isha, "أذكار المساء");
}

export async function getCheckinWindows(
  now: Date = new Date(),
  cityKey: MoroccoRegionKey = DEFAULT_REGION
) {
  const prayers = await getPrayerTimesForDate(now, cityKey);
  return {
    prayers,
    fajr: getFajrWindow(prayers, now),
    adkarSabah: getAdkarSabahWindow(prayers, now),
    adkarMasa2: getAdkarMasa2Window(prayers, now),
  };
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("ar-MA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: MOROCCO_TZ,
  });
}

export function formatWindowRange(start: Date, end: Date): string {
  return `${formatTime(start)} — ${formatTime(end)}`;
}
