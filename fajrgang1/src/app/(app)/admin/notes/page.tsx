"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import IconCircle from "@/components/IconCircle";
import NoteComposer from "@/components/NoteComposer";
import NoteCard, { type NoteItem } from "@/components/NoteCard";

function NotesAdminContent() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [error, setError] = useState("");

  const loadNotes = useCallback(() => {
    fetch("/api/notes")
      .then((r) => r.json())
      .then((d) => setNotes(d.notes || []));
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  async function handleDelete(id: number) {
    const res = await fetch("/api/notes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "تعذر الحذف");
      return;
    }
    loadNotes();
  }

  const activeCount = notes.filter((n) => new Date(n.expires_at).getTime() > Date.now()).length;

  return (
    <>
      <div className="flex items-start gap-3 mb-6">
        <IconCircle size="lg">
          <Bell size={24} strokeWidth={1.8} />
        </IconCircle>
        <div>
          <h1 className="page-title">ملاحظات الأعضاء</h1>
          <p className="page-subtitle mb-0">
            أرسل نصاً أو أذكاراً أو صورة أو فيديو، وحدد كم ستبقى على لوحة الأعضاء
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <GlassCard className="mb-6">
        <h3 className="font-bold text-emerald-800 mb-4">إرسال ملاحظة جديدة</h3>
        <NoteComposer onCreated={loadNotes} />
      </GlassCard>

      <GlassCard>
        <h3 className="font-bold text-emerald-800 mb-4">
          الملاحظات ({activeCount} ظاهرة الآن)
        </h3>
        {notes.length === 0 ? (
          <p className="text-center text-emerald-600/60 py-6">لا توجد ملاحظات بعد</p>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </GlassCard>
    </>
  );
}

export default function NotesAdminPage() {
  return <NotesAdminContent />;
}
