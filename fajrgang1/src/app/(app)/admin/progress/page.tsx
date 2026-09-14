"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ListChecks,
  Sun,
  XCircle,
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import IconCircle from "@/components/IconCircle";
import { SURAH_NAMES } from "@/lib/constants";
import { whatsappLink } from "@/lib/whatsapp";

interface MemTask {
  id: number;
  surah_number: number;
  start_ayah: number;
  end_ayah: number;
  deadline_date: string | null;
}

interface MemStatus {
  taskId: number;
  userMemId: number | null;
  memberCompleted: boolean;
  adminConfirmed: boolean;
}

interface MemberProgress {
  id: number;
  name: string;
  whatsapp: string;
  status: string;
  streak: number;
  points: number;
  fajr_checked: number;
  fajr_checked_at: string | null;
  adkar_sabah: number;
  adkar_masa2: number;
  small_adkar_count: number;
  memorizations: MemStatus[];
}

function moroccoToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Casablanca",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function DoneMark({ done, label }: { done: boolean; label: string }) {
  return (
    <span className={`progress-mark ${done ? "is-done" : "is-miss"}`} title={label}>
      {done ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
      <span className="progress-mark-text">{done ? "نعم" : "لا"}</span>
    </span>
  );
}

function MemMark({
  status,
  onConfirm,
}: {
  status: MemStatus;
  onConfirm: (userMemId: number) => void;
}) {
  if (status.adminConfirmed) {
    return (
      <span className="progress-mark is-done">
        <CheckCircle2 size={18} />
        <span className="progress-mark-text">محفوظ</span>
      </span>
    );
  }
  if (status.memberCompleted) {
    return (
      <button
        type="button"
        className="progress-mark is-wait"
        onClick={() => status.userMemId && onConfirm(status.userMemId)}
        title="تأكيد الحفظ"
      >
        <Clock3 size={18} />
        <span className="progress-mark-text">بانتظار التأكيد</span>
      </button>
    );
  }
  return (
    <span className="progress-mark is-miss">
      <XCircle size={18} />
      <span className="progress-mark-text">لم يحفظ</span>
    </span>
  );
}

function taskLabel(task: MemTask) {
  return `${SURAH_NAMES[task.surah_number] || `سورة ${task.surah_number}`} ${task.start_ayah}-${task.end_ayah}`;
}

function ProgressContent() {
  const [date, setDate] = useState(moroccoToday);
  const [tasks, setTasks] = useState<MemTask[]>([]);
  const [members, setMembers] = useState<MemberProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback((selectedDate: string) => {
    setLoading(true);
    fetch(`/api/admin/progress?date=${selectedDate}`)
      .then((r) => r.json())
      .then((d) => {
        setTasks(d.tasks || []);
        setMembers(d.members || []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(date);
  }, [date, load]);

  async function confirmMem(userMemId: number) {
    const res = await fetch("/api/memorization", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "admin_confirm", userMemId }),
    });
    const data = await res.json();
    setMessage(data.message || data.error || "");
    load(date);
  }

  const totals = {
    fajr: members.filter((m) => m.fajr_checked).length,
    sabah: members.filter((m) => m.adkar_sabah).length,
    masa: members.filter((m) => m.adkar_masa2).length,
    count: members.length,
  };

  return (
    <>
      <div className="flex items-start gap-3 mb-6">
        <IconCircle size="lg">
          <ListChecks size={24} />
        </IconCircle>
        <div className="flex-1 min-w-0">
          <h1 className="page-title">متابعة الأعضاء</h1>
          <p className="page-subtitle mb-0">المهام اليومية وحفظ القرآن لكل عضو</p>
        </div>
      </div>

      {message && <div className="alert alert-success">{message}</div>}

      <GlassCard className="mb-6">
        <label className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <span className="font-bold text-emerald-800 inline-flex items-center gap-2">
            <CalendarDays size={18} />
            اليوم
          </span>
          <input
            type="date"
            className="input-field max-w-[12rem]"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </GlassCard>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <GlassCard className="stat-card">
          <div className="stat-value">
            {totals.fajr}/{totals.count || 0}
          </div>
          <div className="stat-label">الفجر</div>
        </GlassCard>
        <GlassCard className="stat-card">
          <div className="stat-value">
            {totals.sabah}/{totals.count || 0}
          </div>
          <div className="stat-label">أذكار الصباح</div>
        </GlassCard>
        <GlassCard className="stat-card">
          <div className="stat-value">
            {totals.masa}/{totals.count || 0}
          </div>
          <div className="stat-label">أذكار المساء</div>
        </GlassCard>
        <GlassCard className="stat-card">
          <div className="stat-value">{totals.count}</div>
          <div className="stat-label">الأعضاء</div>
        </GlassCard>
      </div>

      {loading ? (
        <div className="text-center py-16 text-emerald-600">جاري التحميل...</div>
      ) : members.length === 0 ? (
        <GlassCard>
          <p className="text-center text-emerald-600/70 py-6 mb-0">لا يوجد أعضاء بعد</p>
        </GlassCard>
      ) : (
        <>
          <div className="lg:hidden space-y-3">
            {members.map((m) => (
              <GlassCard key={m.id}>
                <div className="flex justify-between gap-3 mb-3">
                  <div>
                    <div className="font-bold text-emerald-800">{m.name}</div>
                    <a
                      href={whatsappLink(m.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="wa-link"
                      dir="ltr"
                    >
                      {m.whatsapp}
                    </a>
                  </div>
                  <span className="text-xs text-emerald-600 shrink-0">{m.streak} يوم</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="inline-flex items-center gap-1 text-emerald-800">
                      <Sun size={14} /> الفجر
                    </span>
                    <DoneMark done={Boolean(m.fajr_checked)} label="الفجر" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>أذكار الصباح</span>
                    <DoneMark done={Boolean(m.adkar_sabah)} label="أذكار الصباح" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>أذكار المساء</span>
                    <DoneMark done={Boolean(m.adkar_masa2)} label="أذكار المساء" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>أذكار قصيرة</span>
                    <span className="font-bold text-emerald-800">{m.small_adkar_count}</span>
                  </div>
                </div>
                {tasks.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-emerald-100 space-y-2">
                    <div className="font-bold text-emerald-800 text-sm inline-flex items-center gap-1">
                      <BookOpen size={14} />
                      الحفظ
                    </div>
                    {tasks.map((task) => {
                      const status = m.memorizations.find((x) => x.taskId === task.id);
                      if (!status) return null;
                      return (
                        <div key={task.id} className="flex justify-between items-center gap-2 text-sm">
                          <span className="text-emerald-700 min-w-0 truncate">{taskLabel(task)}</span>
                          <MemMark status={status} onConfirm={confirmMem} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </GlassCard>
            ))}
          </div>

          <GlassCard className="hidden lg:block">
            <div className="table-wrap">
              <table className="data-table progress-table">
                <thead>
                  <tr>
                    <th>العضو</th>
                    <th>الفجر</th>
                    <th>أذكار الصباح</th>
                    <th>أذكار المساء</th>
                    <th>قصيرة</th>
                    {tasks.map((task) => (
                      <th key={task.id}>{taskLabel(task)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div className="font-bold text-emerald-800">{m.name}</div>
                        <div className="text-xs text-emerald-600/80" dir="ltr">
                          {m.whatsapp}
                        </div>
                      </td>
                      <td>
                        <DoneMark done={Boolean(m.fajr_checked)} label="الفجر" />
                      </td>
                      <td>
                        <DoneMark done={Boolean(m.adkar_sabah)} label="أذكار الصباح" />
                      </td>
                      <td>
                        <DoneMark done={Boolean(m.adkar_masa2)} label="أذكار المساء" />
                      </td>
                      <td className="font-bold text-emerald-800">{m.small_adkar_count}</td>
                      {tasks.map((task) => {
                        const status = m.memorizations.find((x) => x.taskId === task.id);
                        return (
                          <td key={task.id}>
                            {status ? <MemMark status={status} onConfirm={confirmMem} /> : "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      )}
    </>
  );
}

export default function AdminProgressPage() {
  return <ProgressContent />;
}
