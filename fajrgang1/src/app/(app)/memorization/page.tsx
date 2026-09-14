"use client";

import { useEffect, useState } from "react";
import { BookOpen, CalendarDays, CheckCircle2, Clock3 } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { SURAH_NAMES } from "@/lib/constants";

interface MemTask {
  id: number;
  surah_number: number;
  start_ayah: number;
  end_ayah: number;
  deadline_date: string | null;
}

interface UserMem {
  id: number;
  task_id: number;
  surah_number: number;
  start_ayah: number;
  end_ayah: number;
  member_completed: number;
  admin_confirmed: number;
  deadline_date: string | null;
}

function MemorizationContent() {
  const [tasks, setTasks] = useState<MemTask[]>([]);
  const [memorizations, setMemorizations] = useState<UserMem[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<number | null>(null);

  function loadData() {
    fetch("/api/memorization")
      .then((r) => r.json())
      .then((d) => {
        setTasks(d.tasks || []);
        setMemorizations(d.memorizations || []);
      });
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleComplete(taskId: number) {
    setMessage("");
    setError("");
    setLoading(taskId);

    try {
      const res = await fetch("/api/memorization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "member_complete", taskId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
      } else {
        setMessage(data.message);
        loadData();
      }
    } catch {
      setError("حدث خطأ");
    } finally {
      setLoading(null);
    }
  }

  function getMemStatus(taskId: number) {
    return memorizations.find((m) => m.task_id === taskId);
  }

  return (
    <>
      <h1 className="page-title">حفظ القرآن</h1>
      <p className="page-subtitle">مهام الحفظ المحددة من المشرف</p>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {tasks.length === 0 ? (
        <GlassCard>
          <p className="text-center text-emerald-600/60 py-8">
            لا توجد مهام حفظ حالياً
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const mem = getMemStatus(task.id);
            const surahName = SURAH_NAMES[task.surah_number] || `سورة ${task.surah_number}`;

            return (
              <GlassCard key={task.id} hover>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-emerald-800 text-lg inline-flex items-center gap-2">
                      <BookOpen size={20} />
                      {surahName}
                    </h3>
                    <p className="text-emerald-600 mt-1">
                      من آية {task.start_ayah} إلى آية {task.end_ayah}
                    </p>
                    {task.deadline_date && (
                      <p className="text-sm text-amber-700 mt-1 inline-flex items-center gap-1">
                        <CalendarDays size={14} />
                        الموعد: {task.deadline_date}
                      </p>
                    )}
                  </div>

                  <div>
                    {mem?.admin_confirmed ? (
                      <span className="badge badge-active inline-flex items-center gap-1">
                        <CheckCircle2 size={14} /> تم التأكيد (+25 نقطة)
                      </span>
                    ) : mem?.member_completed ? (
                      <span className="badge badge-pending inline-flex items-center gap-1">
                        <Clock3 size={14} /> بانتظار تأكيد المشرف
                      </span>
                    ) : (
                      <button
                        className="btn-gold"
                        onClick={() => handleComplete(task.id)}
                        disabled={loading === task.id}
                      >
                        {loading === task.id ? "..." : "أتممت الحفظ"}
                      </button>
                    )}
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function MemorizationPage() {
  return <MemorizationContent />;
}
