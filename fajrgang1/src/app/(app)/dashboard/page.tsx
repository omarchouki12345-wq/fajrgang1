"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  Flame,
  Moon,
  Sparkles,
  Star,
  Sun,
  Sunrise,
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import StatusBadge from "@/components/StatusBadge";
import CitySelector, { getStoredCity, storeCity } from "@/components/CitySelector";
import NoteCard, { type NoteItem } from "@/components/NoteCard";
import type { MoroccoRegionKey } from "@/lib/constants";

interface DashboardData {
  user: {
    name: string;
    points: number;
    streak: number;
    best_streak: number;
    status: string;
  };
  todayCheckin: {
    fajr_checked: number;
    adkar_sabah: number;
    adkar_masa2: number;
    small_adkar_count: number;
    points_earned: number;
  };
  history: { points: number; reason: string; created_at: string }[];
  checkinHistory: {
    date: string;
    fajr_checked: number;
    adkar_sabah: number;
    adkar_masa2: number;
    points_earned: number;
  }[];
  prayerTimes: Record<string, string>;
  cityNameAr: string;
  notes: NoteItem[];
}

const prayerLabels: Record<string, string> = {
  fajr: "الفجر",
  sunrise: "الشروق",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};

function DashboardContent() {
  const [city, setCity] = useState<MoroccoRegionKey>("casablanca-settat");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback((selectedCity: MoroccoRegionKey) => {
    setLoading(true);
    fetch(`/api/dashboard?city=${selectedCity}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
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

  if (loading) {
    return <div className="text-center py-20 text-emerald-600">جاري التحميل...</div>;
  }

  if (!data) {
    return <div className="alert alert-error">فشل تحميل البيانات</div>;
  }

  const goalsDone =
    data.todayCheckin.fajr_checked +
    data.todayCheckin.adkar_sabah +
    data.todayCheckin.adkar_masa2;
  const goalsTotal = 3;
  const notes = data.notes || [];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">مرحباً، {data.user.name}</h1>
          <p className="page-subtitle mb-0">لوحة تحكمك الشخصية</p>
        </div>
        <StatusBadge status={data.user.status} />
      </div>

      {data.user.status === "PENDING" && (
        <div className="alert alert-warning mb-6">
          حسابك قيد المراجعة. انتظر تأكيد المشرف للبدء في التسجيل اليومي.
        </div>
      )}

      {data.user.status === "PAUSED" && (
        <div className="alert alert-error mb-6">
          تم إيقاف حسابك مؤقتاً. تواصل مع المشرف.
        </div>
      )}

      {notes.length > 0 && (
        <section className="mb-8">
          <h2 className="section-title">ملاحظات الإدارة</h2>
          <div className="space-y-4">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </section>
      )}

      <CitySelector value={city} onChange={handleCityChange} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <GlassCard className="stat-card">
          <Star className="mx-auto mb-1 text-emerald-700" size={18} />
          <div className="stat-value">{data.user.points}</div>
          <div className="stat-label">النقاط</div>
        </GlassCard>
        <GlassCard className="stat-card">
          <Flame className="mx-auto mb-1 text-amber-600" size={18} />
          <div className="stat-value">{data.user.streak}</div>
          <div className="stat-label">سلسلة الأيام</div>
        </GlassCard>
        <GlassCard className="stat-card">
          <div className="stat-value">{data.user.best_streak}</div>
          <div className="stat-label">أفضل سلسلة</div>
        </GlassCard>
        <GlassCard className="stat-card">
          <div className="stat-value">{data.todayCheckin.points_earned}</div>
          <div className="stat-label">نقاط اليوم</div>
        </GlassCard>
      </div>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-8">
        <GlassCard>
          <h3 className="text-lg font-bold text-emerald-800 mb-4">أهداف اليوم</h3>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>التقدم</span>
              <span className="font-bold">
                {goalsDone}/{goalsTotal}
              </span>
            </div>
            <div className="h-3 bg-emerald-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-l from-emerald-500 to-emerald-700 rounded-full transition-all"
                style={{ width: `${(goalsDone / goalsTotal) * 100}%` }}
              />
            </div>
          </div>
          <div className={`check-item ${data.todayCheckin.fajr_checked ? "done" : ""}`}>
            <span className="flex items-center gap-2">
              <Sunrise size={18} /> صلاة الفجر
            </span>
            {data.todayCheckin.fajr_checked ? <CheckCircle2 size={18} /> : <Clock3 size={18} />}
          </div>
          <Link
            href="/adkar?set=sabah"
            className={`check-item ${data.todayCheckin.adkar_sabah ? "done" : ""}`}
          >
            <span className="flex items-center gap-2">
              <Sun size={18} /> أذكار الصباح
            </span>
            {data.todayCheckin.adkar_sabah ? <CheckCircle2 size={18} /> : <Clock3 size={18} />}
          </Link>
          <Link
            href="/adkar?set=masa"
            className={`check-item ${data.todayCheckin.adkar_masa2 ? "done" : ""}`}
          >
            <span className="flex items-center gap-2">
              <Moon size={18} /> أذكار المساء
            </span>
            {data.todayCheckin.adkar_masa2 ? <CheckCircle2 size={18} /> : <Clock3 size={18} />}
          </Link>
        </GlassCard>

        <GlassCard>
          <h3 className="text-lg font-bold text-emerald-800 mb-4">
            أوقات الصلاة — جهة {data.cityNameAr}
          </h3>
          <div className="space-y-2">
            {Object.entries(data.prayerTimes).map(([key, time]) => (
              <div
                key={key}
                className="flex justify-between py-2 border-b border-emerald-100 last:border-0"
              >
                <span className="text-emerald-700">{prayerLabels[key]}</span>
                <span className="font-bold text-emerald-800" dir="ltr">
                  {time}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        <GlassCard>
          <h3 className="text-lg font-bold text-emerald-800 mb-4">سجل النقاط</h3>
          {data.history.length === 0 ? (
            <p className="text-emerald-600/60 text-center py-4">لا يوجد سجل بعد</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.history.map((h, i) => (
                <div
                  key={i}
                  className="flex justify-between py-2 border-b border-emerald-50 last:border-0 gap-3"
                >
                  <span className="text-emerald-700">{h.reason}</span>
                  <span className="font-bold text-emerald-600 shrink-0">+{h.points}</span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard>
          <h3 className="text-lg font-bold text-emerald-800 mb-4">سجل الأيام</h3>
          {data.checkinHistory.length === 0 ? (
            <p className="text-emerald-600/60 text-center py-4">لا يوجد سجل بعد</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.checkinHistory.map((c, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-2 border-b border-emerald-50 last:border-0 gap-2"
                >
                  <span className="text-emerald-700 text-sm">{c.date}</span>
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Sunrise size={16} className={c.fajr_checked ? "opacity-100" : "opacity-25"} />
                    <Sun size={16} className={c.adkar_sabah ? "opacity-100" : "opacity-25"} />
                    <Moon size={16} className={c.adkar_masa2 ? "opacity-100" : "opacity-25"} />
                    <Sparkles size={16} className="opacity-40 hidden xs:block" />
                    <span className="font-bold text-emerald-600 text-sm">+{c.points_earned}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}
