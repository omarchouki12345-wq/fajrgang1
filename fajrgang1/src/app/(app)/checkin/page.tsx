"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Moon, Sun, Sunrise } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import IconCircle from "@/components/IconCircle";
import CitySelector, { getStoredCity, storeCity } from "@/components/CitySelector";
import type { MoroccoRegionKey } from "@/lib/constants";

interface TimeWindow {
  valid: boolean;
  message: string;
  startFormatted: string;
  endFormatted: string;
}

interface CheckinData {
  checkin: {
    fajr_checked: number;
    adkar_sabah: number;
    adkar_masa2: number;
  };
  cityNameAr: string;
  prayerTimes: Record<string, string>;
  windows: {
    fajr: TimeWindow;
    adkarSabah: TimeWindow;
    adkarMasa2: TimeWindow;
  };
}

function WindowInfo({ window, label }: { window: TimeWindow; label: string }) {
  return (
    <p className="text-sm text-emerald-600/80 mb-1">
      {label}:{" "}
      <strong dir="ltr">
        {window.startFormatted} — {window.endFormatted}
      </strong>
    </p>
  );
}

function CheckinContent() {
  const [city, setCity] = useState<MoroccoRegionKey>("casablanca-settat");
  const [data, setData] = useState<CheckinData | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const loadData = useCallback((selectedCity: MoroccoRegionKey) => {
    fetch(`/api/checkin?city=${selectedCity}`)
      .then((r) => r.json())
      .then(setData);
  }, []);

  useEffect(() => {
    const stored = getStoredCity();
    setCity(stored);
    loadData(stored);
  }, [loadData]);

  function handleCityChange(newCity: MoroccoRegionKey) {
    setCity(newCity);
    storeCity(newCity);
    loadData(newCity);
  }

  async function handleAction(action: string) {
    setMessage("");
    setError("");
    setLoading(action);

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, city }),
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.error);
      } else {
        setMessage(result.message);
        loadData(city);
      }
    } catch {
      setError("حدث خطأ");
    } finally {
      setLoading(null);
    }
  }

  if (!data) {
    return <div className="text-center py-20 text-emerald-600">جاري التحميل...</div>;
  }

  const { windows, checkin, prayerTimes, cityNameAr } = data;

  return (
    <>
      <h1 className="page-title">التسجيل اليومي</h1>
      <p className="page-subtitle">سجّل إنجازاتك اليومية واكسب النقاط</p>

      <CitySelector value={city} onChange={handleCityChange} />

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <GlassCard className="mb-6">
        <h3 className="text-lg font-bold text-emerald-800 mb-3">
          مواقيت الصلاة — جهة {cityNameAr}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4 text-sm">
          <div>الفجر: <strong dir="ltr">{prayerTimes.fajr}</strong></div>
          <div>الشروق: <strong dir="ltr">{prayerTimes.sunrise}</strong></div>
          <div>الظهر: <strong dir="ltr">{prayerTimes.dhuhr}</strong></div>
          <div>العصر: <strong dir="ltr">{prayerTimes.asr}</strong></div>
          <div>المغرب: <strong dir="ltr">{prayerTimes.maghrib}</strong></div>
          <div>العشاء: <strong dir="ltr">{prayerTimes.isha}</strong></div>
        </div>
        <h4 className="font-bold text-emerald-800 mb-2">أوقات التسجيل</h4>
        <WindowInfo window={windows.fajr} label="الفجر" />
        <WindowInfo window={windows.adkarSabah} label="أذكار الصباح" />
        <WindowInfo window={windows.adkarMasa2} label="أذكار المساء" />
      </GlassCard>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <GlassCard hover className="text-center">
          <IconCircle size="lg" className="mx-auto mb-3">
            <Sunrise size={26} />
          </IconCircle>
          <h3 className="font-bold text-emerald-800 mb-2">صلاة الفجر</h3>
          <p className="text-sm text-emerald-600/70 mb-1">+15 نقطة</p>
          <p className="text-xs text-emerald-600/60 mb-3" dir="ltr">
            {windows.fajr.startFormatted} — {windows.fajr.endFormatted}
          </p>
          <p
            className={`text-xs font-medium mb-3 ${
              windows.fajr.valid ? "text-emerald-600" : "text-amber-700"
            }`}
          >
            {windows.fajr.message}
          </p>
          {checkin.fajr_checked ? (
            <div className="text-emerald-600 font-bold inline-flex items-center gap-1 justify-center">
              <CheckCircle2 size={18} /> تم التسجيل
            </div>
          ) : (
            <button
              className="btn-primary w-full"
              onClick={() => handleAction("fajr")}
              disabled={loading === "fajr" || !windows.fajr.valid}
            >
              {loading === "fajr" ? "..." : "سجّل الفجر"}
            </button>
          )}
        </GlassCard>

        <GlassCard hover className="text-center">
          <IconCircle size="lg" className="mx-auto mb-3">
            <Sun size={26} />
          </IconCircle>
          <h3 className="font-bold text-emerald-800 mb-2">أذكار الصباح</h3>
          <p className="text-sm text-emerald-600/70 mb-1">+8 نقاط</p>
          <p className="text-xs text-emerald-600/60 mb-3" dir="ltr">
            {windows.adkarSabah.startFormatted} — {windows.adkarSabah.endFormatted}
          </p>
          <p
            className={`text-xs font-medium mb-3 ${
              windows.adkarSabah.valid ? "text-emerald-600" : "text-amber-700"
            }`}
          >
            {windows.adkarSabah.message}
          </p>
          {checkin.adkar_sabah ? (
            <div className="text-emerald-600 font-bold mb-3 inline-flex items-center gap-1">
              <CheckCircle2 size={18} /> تم التسجيل
            </div>
          ) : (
            <p className="text-xs text-emerald-600/70 mb-3">
              اقرأ الأذكار على المنصة ثم أكملها للتسجيل
            </p>
          )}
          <Link href="/adkar?set=sabah" className="btn-primary w-full inline-block">
            {checkin.adkar_sabah ? "أعد القراءة" : "اقرأ أذكار الصباح"}
          </Link>
        </GlassCard>

        <GlassCard hover className="text-center sm:col-span-2 lg:col-span-1">
          <IconCircle size="lg" className="mx-auto mb-3">
            <Moon size={26} />
          </IconCircle>
          <h3 className="font-bold text-emerald-800 mb-2">أذكار المساء</h3>
          <p className="text-sm text-emerald-600/70 mb-1">+8 نقاط</p>
          <p className="text-xs text-emerald-600/60 mb-3" dir="ltr">
            {windows.adkarMasa2.startFormatted} — {windows.adkarMasa2.endFormatted}
          </p>
          <p
            className={`text-xs font-medium mb-3 ${
              windows.adkarMasa2.valid ? "text-emerald-600" : "text-amber-700"
            }`}
          >
            {windows.adkarMasa2.message}
          </p>
          {checkin.adkar_masa2 ? (
            <div className="text-emerald-600 font-bold mb-3 inline-flex items-center gap-1">
              <CheckCircle2 size={18} /> تم التسجيل
            </div>
          ) : (
            <p className="text-xs text-emerald-600/70 mb-3">
              من العصر إلى العشاء · اقرأ الأذكار ثم أكملها للتسجيل
            </p>
          )}
          <Link href="/adkar?set=masa" className="btn-primary w-full inline-block">
            {checkin.adkar_masa2 ? "أعد القراءة" : "اقرأ أذكار المساء"}
          </Link>
        </GlassCard>
      </div>
    </>
  );
}

export default function CheckinPage() {
  return <CheckinContent />;
}
