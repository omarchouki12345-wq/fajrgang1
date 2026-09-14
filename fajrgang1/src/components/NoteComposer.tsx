"use client";

import { useState } from "react";
import { Image as ImageIcon, Send, Video } from "lucide-react";
import { NOTE_DURATION_OPTIONS } from "@/lib/time";

export default function NoteComposer({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [durationHours, setDurationHours] = useState(24);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const form = new FormData();
      form.set("title", title);
      form.set("body", body);
      form.set("durationHours", String(durationHours));
      if (file) form.set("file", file);

      const res = await fetch("/api/notes", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "تعذر الإرسال");
        return;
      }
      setMessage(data.message);
      setTitle("");
      setBody("");
      setFile(null);
      onCreated();
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-emerald-700 mb-2">العنوان</label>
        <input
          className="input-field"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="مثال: أذكار اليوم أو تنبيه مهم"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-emerald-700 mb-2">النص / الذكر</label>
        <textarea
          className="input-field min-h-32"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="اكتب الملاحظة أو الأذكار هنا"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-emerald-700 mb-2">مدة الظهور للأعضاء</label>
        <div className="flex flex-wrap gap-2">
          {NOTE_DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.hours}
              type="button"
              className={`chip ${durationHours === opt.hours ? "chip-active" : ""}`}
              onClick={() => setDurationHours(opt.hours)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-emerald-700 mb-2">
          صورة أو فيديو (اختياري)
        </label>
        <label className="file-drop">
          <span className="flex items-center gap-2 text-emerald-700">
            {file?.type.startsWith("video/") ? <Video size={18} /> : <ImageIcon size={18} />}
            {file ? file.name : "اختر صورة أو فيديو"}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
      </div>

      <button type="submit" className="btn-primary inline-flex items-center gap-2" disabled={loading}>
        <Send size={18} strokeWidth={2} />
        {loading ? "جاري الإرسال..." : "إرسال للأعضاء"}
      </button>
    </form>
  );
}
