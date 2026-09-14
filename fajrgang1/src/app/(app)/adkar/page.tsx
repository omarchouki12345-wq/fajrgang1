"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Moon, Sparkles, Sun } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import AdkarReader from "@/components/AdkarReader";
import { getStoredCity } from "@/components/CitySelector";
import {
  ADKAR_SETS,
  ADKAR_SOURCE,
  SMALL_ADKAR,
  isAdkarSetId,
  type AdkarSetId,
} from "@/lib/adkar-data";
import { POINTS } from "@/lib/constants";

interface TimeWindow {
  valid: boolean;
  message: string;
  startFormatted: string;
  endFormatted: string;
}

interface CheckinState {
  adkar_sabah: number;
  adkar_masa2: number;
  small_adkar_count: number;
}

function AdkarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const requested = searchParams.get("set");
  const activeSet: AdkarSetId = isAdkarSetId(requested) ? requested : "sabah";

  const [checkin, setCheckin] = useState<CheckinState | null>(null);
  const [windows, setWindows] = useState<{
    adkarSabah: TimeWindow;
    adkarMasa2: TimeWindow;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [smallIndex, setSmallIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  const loadData = useCallback(() => {
    const city = getStoredCity();
    return fetch(`/api/checkin?city=${city}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.checkin) {
          setCheckin({
            adkar_sabah: d.checkin.adkar_sabah,
            adkar_masa2: d.checkin.adkar_masa2,
            small_adkar_count: d.checkin.small_adkar_count || 0,
          });
          setSmallIndex((d.checkin.small_adkar_count || 0) % SMALL_ADKAR.length);
        }
        if (d.windows) {
          setWindows({
            adkarSabah: d.windows.adkarSabah,
            adkarMasa2: d.windows.adkarMasa2,
          });
        }
      });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function selectSet(id: AdkarSetId) {
    setMessage("");
    setError("");
    router.replace(`/adkar?set=${id}`);
  }

  async function postAction(action: string) {
    const city = getStoredCity();
    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, city }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "حدث خطأ");
      setMessage("");
      return false;
    }
    setError("");
    setMessage(data.message);
    await loadData();
    return true;
  }

  async function handleSetComplete(setId: AdkarSetId) {
    if (setId === "small") return;
    if (setId === "sabah" && checkin?.adkar_sabah) return;
    if (setId === "masa" && checkin?.adkar_masa2) return;
    const action = ADKAR_SETS[setId].action;
    if (!action) return;
    await postAction(action);
  }

  async function handleSmallTap() {
    setAnimating(true);
    setMessage("");
    setError("");
    await postAction("small_adkar");
    window.setTimeout(() => setAnimating(false), 200);
  }

  const current = ADKAR_SETS[activeSet];
  const windowInfo =
    activeSet === "sabah"
      ? windows?.adkarSabah
      : activeSet === "masa"
        ? windows?.adkarMasa2
        : null;
  const alreadyDone =
    activeSet === "sabah"
      ? Boolean(checkin?.adkar_sabah)
      : activeSet === "masa"
        ? Boolean(checkin?.adkar_masa2)
        : false;

  return (
    <>
      <h1 className="page-title">الأذكار</h1>
      <p className="page-subtitle">
        اقرأ الذكر ثم اضغط للانتقال إلى التالي · المصدر: {ADKAR_SOURCE.nameAr}
      </p>

      <div className="adkar-tabs mb-6">
        {(Object.keys(ADKAR_SETS) as AdkarSetId[]).map((id) => (
          <button
            key={id}
            type="button"
            className={`adkar-tab ${activeSet === id ? "active" : ""}`}
            onClick={() => selectSet(id)}
          >
            {id === "sabah" && <Sun size={16} />}
            {id === "masa" && <Moon size={16} />}
            {id === "small" && <Sparkles size={16} />}
            {ADKAR_SETS[id].title}
          </button>
        ))}
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {windowInfo && (
        <GlassCard className="mb-6">
          <p className="text-sm text-emerald-700">
            وقت {current.title}:{" "}
            <strong dir="ltr">
              {windowInfo.startFormatted} — {windowInfo.endFormatted}
            </strong>
          </p>
          <p
            className={`text-sm mt-1 ${
              windowInfo.valid ? "text-emerald-600" : "text-amber-700"
            }`}
          >
            {alreadyDone
              ? "تم التسجيل اليوم. يمكنك إعادة القراءة في أي وقت."
              : windowInfo.valid
                ? `أكمل القراءة لتسجيل ${POINTS[activeSet === "sabah" ? "ADKAR_SABAH" : "ADKAR_MASA2"]} نقاط`
                : windowInfo.message}
          </p>
        </GlassCard>
      )}

      {activeSet === "small" ? (
        <>
          <p className="text-sm text-emerald-600/80 mb-3">
            اضغط لقراءة ذكر جديد واكسب +{POINTS.SMALL_ADKAR} نقطة
          </p>
          <GlassCard
            className={`tap-area mb-6 ${animating ? "scale-[0.98]" : ""}`}
            hover
          >
            <button
              type="button"
              onClick={handleSmallTap}
              className="w-full cursor-pointer bg-transparent border-0 p-0"
            >
              <div className="adkar-display">{SMALL_ADKAR[smallIndex]}</div>
              <p className="text-center text-emerald-600/60 text-sm mt-2">
                اضغط هنا للذكر التالي
              </p>
            </button>
          </GlassCard>
          <GlassCard className="text-center stat-card">
            <div className="stat-value">{checkin?.small_adkar_count ?? 0}</div>
            <div className="stat-label">أذكار اليوم</div>
          </GlassCard>
        </>
      ) : (
        <AdkarReader
          key={activeSet}
          items={current.items}
          title={current.title}
          alreadyDone={alreadyDone}
          onComplete={() => handleSetComplete(activeSet)}
        />
      )}

      <p className="text-center text-xs text-emerald-600/50 mt-6">
        النصوص من {ADKAR_SOURCE.nameAr} — {ADKAR_SOURCE.authorAr} · {ADKAR_SOURCE.url}
      </p>
    </>
  );
}

export default function AdkarPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-emerald-600">جاري التحميل...</div>}>
      <AdkarContent />
    </Suspense>
  );
}
