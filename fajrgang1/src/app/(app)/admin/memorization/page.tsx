"use client";

import { useEffect, useState, type FormEvent } from "react";
import { BookOpen, CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import IconCircle from "@/components/IconCircle";
import { SURAH_NAMES } from "@/lib/constants";

interface MemTask {
  id: number;
  surah_number: number;
  start_ayah: number;
  end_ayah: number;
  deadline_date: string | null;
}

function MemorizationAdminContent() {
  const [tasks, setTasks] = useState<MemTask[]>([]);
  const [surahNumber, setSurahNumber] = useState(1);
  const [startAyah, setStartAyah] = useState(1);
  const [endAyah, setEndAyah] = useState(7);
  const [deadline, setDeadline] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function loadTasks() {
    fetch("/api/memorization")
      .then((r) => r.json())
      .then((d) => setTasks(d.tasks || []));
  }

  useEffect(() => {
    loadTasks();
  }, []);

  function resetForm() {
    setEditingId(null);
    setSurahNumber(1);
    setStartAyah(1);
    setEndAyah(7);
    setDeadline("");
  }

  function startEdit(task: MemTask) {
    setEditingId(task.id);
    setSurahNumber(task.surah_number);
    setStartAyah(task.start_ayah);
    setEndAyah(task.end_ayah);
    setDeadline(task.deadline_date || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);

    const payload = editingId
      ? {
          action: "update_task",
          taskId: editingId,
          surahNumber,
          startAyah,
          endAyah,
          deadlineDate: deadline || null,
        }
      : {
          action: "create_task",
          surahNumber,
          startAyah,
          endAyah,
          deadlineDate: deadline || null,
        };

    const res = await fetch("/api/memorization", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }
    setMessage(data.message);
    resetForm();
    loadTasks();
  }

  async function handleDelete(taskId: number) {
    if (!window.confirm("حذف مهمة الحفظ؟ لن تظهر للأعضاء بعد الحذف.")) return;
    setMessage("");
    setError("");
    const res = await fetch("/api/memorization", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_task", taskId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setMessage(data.message);
    if (editingId === taskId) resetForm();
    loadTasks();
  }

  return (
    <>
      <div className="flex items-start gap-3 mb-6">
        <IconCircle size="lg">
          <BookOpen size={24} strokeWidth={1.8} />
        </IconCircle>
        <div>
          <h1 className="page-title">إدارة مهام الحفظ</h1>
          <p className="page-subtitle mb-0">أنشئ أو عدّل أو احذف سورة الحفظ</p>
        </div>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <GlassCard className="mb-6">
        <h3 className="font-bold text-emerald-800 mb-4">
          {editingId ? "تعديل مهمة الحفظ" : "إنشاء مهمة حفظ جديدة"}
        </h3>
        <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-emerald-700 mb-2">السورة</label>
            <select
              className="input-field"
              value={surahNumber}
              onChange={(e) => setSurahNumber(Number(e.target.value))}
            >
              {Object.entries(SURAH_NAMES).map(([num, name]) => (
                <option key={num} value={num}>
                  {num}. {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-700 mb-2">من آية</label>
            <input
              type="number"
              className="input-field"
              min={1}
              value={startAyah}
              onChange={(e) => setStartAyah(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-700 mb-2">إلى آية</label>
            <input
              type="number"
              className="input-field"
              min={1}
              value={endAyah}
              onChange={(e) => setEndAyah(Number(e.target.value))}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-emerald-700 mb-2">
              الموعد النهائي (اختياري)
            </label>
            <input
              type="date"
              className="input-field"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <button type="submit" className="btn-primary inline-flex items-center gap-2" disabled={saving}>
              {editingId ? <Pencil size={16} /> : <Plus size={16} />}
              {saving ? "..." : editingId ? "حفظ التعديل" : "إنشاء المهمة"}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary px-4 py-3" onClick={resetForm}>
                إلغاء
              </button>
            )}
          </div>
        </form>
      </GlassCard>

      <GlassCard>
        <h3 className="font-bold text-emerald-800 mb-4">المهام النشطة</h3>
        {tasks.length === 0 ? (
          <p className="text-center text-emerald-600/60 py-4">لا توجد مهام</p>
        ) : (
          <div className="space-y-3">
            {tasks.map((t) => (
              <div key={t.id} className="task-row">
                <div className="min-w-0">
                  <div className="font-bold text-emerald-800">
                    {SURAH_NAMES[t.surah_number]} — آيات {t.start_ayah} إلى {t.end_ayah}
                  </div>
                  {t.deadline_date && (
                    <div className="flex items-center gap-1 text-sm text-amber-700 mt-1">
                      <CalendarDays size={14} />
                      {t.deadline_date}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => startEdit(t)}
                    aria-label="تعديل"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn-danger"
                    onClick={() => handleDelete(t.id)}
                    aria-label="حذف"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </>
  );
}

export default function MemorizationAdminPage() {
  return <MemorizationAdminContent />;
}
