"use client";

import { useEffect, useState } from "react";
import { Flame, Medal, Trophy } from "lucide-react";
import GlassCard from "@/components/GlassCard";

interface LeaderEntry {
  id: number;
  name: string;
  points: number;
  streak: number;
  best_streak: number;
  member_type_name: string | null;
}

function LeaderboardContent() {
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((d) => setLeaderboard(d.leaderboard || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-emerald-600">جاري التحميل...</div>;
  }

  return (
    <>
      <h1 className="page-title">المتصدرون</h1>
      <p className="page-subtitle">ترتيب الأعضاء حسب النقاط والاستمرارية</p>

      <GlassCard>
        {leaderboard.length === 0 ? (
          <p className="text-center text-emerald-600/60 py-8">لا يوجد أعضاء بعد</p>
        ) : (
          <div>
            {leaderboard.map((entry, index) => (
              <div
                key={entry.id}
                className={`leaderboard-row ${
                  index === 0 ? "top-1" : index === 1 ? "top-2" : index === 2 ? "top-3" : ""
                }`}
              >
                <div className="rank-badge">
                  {index < 3 ? (
                    index === 0 ? (
                      <Trophy size={16} />
                    ) : (
                      <Medal size={16} />
                    )
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-emerald-800 truncate">{entry.name}</div>
                  {entry.member_type_name && (
                    <div className="text-xs text-emerald-600/60">{entry.member_type_name}</div>
                  )}
                </div>
                <div className="text-center px-2 sm:px-3">
                  <div className="font-bold text-emerald-700">{entry.points}</div>
                  <div className="text-xs text-emerald-600/60">نقطة</div>
                </div>
                <div className="text-center px-2 sm:px-3">
                  <div className="font-bold text-amber-700 inline-flex items-center gap-1">
                    <Flame size={14} />
                    {entry.streak}
                  </div>
                  <div className="text-xs text-emerald-600/60">سلسلة</div>
                </div>
                <div className="text-center px-2 sm:px-3 hidden sm:block">
                  <div className="font-bold text-emerald-600">{entry.best_streak}</div>
                  <div className="text-xs text-emerald-600/60">أفضل</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </>
  );
}

export default function LeaderboardPage() {
  return <LeaderboardContent />;
}
