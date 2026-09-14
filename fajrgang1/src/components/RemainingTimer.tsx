"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { formatRemainingAr, remainingRatio } from "@/lib/time";

export default function RemainingTimer({
  createdAt,
  expiresAt,
}: {
  createdAt: string;
  expiresAt: string;
}) {
  const [label, setLabel] = useState(() => formatRemainingAr(expiresAt));
  const [ratio, setRatio] = useState(() => remainingRatio(createdAt, expiresAt));

  useEffect(() => {
    function tick() {
      setLabel(formatRemainingAr(expiresAt));
      setRatio(remainingRatio(createdAt, expiresAt));
    }
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [createdAt, expiresAt]);

  const ended = ratio <= 0;

  return (
    <div className="mt-3">
      <div className={`flex items-center gap-2 text-sm font-medium ${ended ? "text-red-600" : "text-amber-700"}`}>
        <Clock size={16} strokeWidth={2} />
        <span>{label}</span>
      </div>
      <div className="mt-2 h-1.5 bg-emerald-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-l from-amber-400 to-emerald-600 transition-all"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}
