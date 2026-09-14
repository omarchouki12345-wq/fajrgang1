"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import type { AdkarItem } from "@/lib/adkar-data";

interface AdkarReaderProps {
  items: AdkarItem[];
  title: string;
  alreadyDone?: boolean;
  onComplete?: () => void;
}

export default function AdkarReader({
  items,
  title,
  alreadyDone = false,
  onComplete,
}: AdkarReaderProps) {
  const [index, setIndex] = useState(0);
  const [said, setSaid] = useState(0);
  const [finished, setFinished] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setIndex(0);
    setSaid(0);
    setFinished(false);
  }, [items]);

  const item = items[index];
  if (!item) return null;

  const remaining = Math.max(item.count - said, 0);
  const progress = ((index + 1) / items.length) * 100;

  function pulse() {
    setAnimating(true);
    window.setTimeout(() => setAnimating(false), 160);
  }

  function goNext() {
    pulse();
    if (index + 1 >= items.length) {
      setFinished(true);
      onComplete?.();
      return;
    }
    setIndex((i) => i + 1);
    setSaid(0);
  }

  function goPrev() {
    if (index === 0) return;
    setFinished(false);
    setIndex((i) => i - 1);
    setSaid(0);
  }

  function handleCount(event: MouseEvent) {
    event.stopPropagation();
    pulse();
    if (said + 1 >= item.count) {
      goNext();
    } else {
      setSaid((n) => n + 1);
    }
  }

  if (finished) {
    return (
      <GlassCard className="text-center py-10">
        <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-600" />
        <h3 className="text-xl font-bold text-emerald-800 mb-2">بارك الله فيك</h3>
        <p className="text-emerald-700 mb-6">أكملت {title}</p>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setIndex(0);
            setSaid(0);
            setFinished(false);
          }}
        >
          أعد القراءة
        </button>
      </GlassCard>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between text-sm text-emerald-700 mb-2">
        <span>
          الذكر {index + 1} من {items.length}
        </span>
        {alreadyDone && <span className="text-emerald-600 font-medium">تم التسجيل اليوم</span>}
      </div>
      <div className="h-2 bg-emerald-100 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-l from-emerald-500 to-emerald-700 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <GlassCard className={`tap-area mb-4 ${animating ? "scale-[0.98]" : ""}`} hover>
        <button type="button" onClick={goNext} className="adkar-pass-btn">
          {item.note && <p className="text-emerald-600/80 text-sm mb-3">{item.note}</p>}
          <p className="adkar-reader-text">{item.text}</p>
          <p className="text-center text-emerald-600/70 text-sm mt-5">
            اضغط للذكر التالي
          </p>
        </button>
      </GlassCard>

      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          className="adkar-count-circle"
          onClick={handleCount}
          aria-label="عداد التكرار"
        >
          {remaining}
        </button>
        <div className="text-sm text-emerald-700">
          <p className="font-bold">العدد المسنون: {item.count}</p>
          <p className="text-emerald-600/70">اضغط الدائرة للعد، أو اضغط النص للانتقال</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          className="btn-secondary flex-1 px-4 py-3 disabled:opacity-50"
          onClick={goPrev}
          disabled={index === 0}
        >
          السابق
        </button>
        <button type="button" className="btn-primary flex-1" onClick={goNext}>
          التالي
        </button>
      </div>
    </div>
  );
}
