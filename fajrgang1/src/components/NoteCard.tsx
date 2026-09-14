"use client";

import { FileText, Image as ImageIcon, Video } from "lucide-react";
import RemainingTimer from "@/components/RemainingTimer";
import { durationHoursLabel } from "@/lib/time";

export interface NoteItem {
  id: number;
  title: string;
  body: string;
  media_type: "none" | "image" | "video";
  media_path: string | null;
  duration_hours: number;
  expires_at: string;
  created_at: string;
  created_by_name: string;
}

export default function NoteCard({
  note,
  onDelete,
}: {
  note: NoteItem;
  onDelete?: (id: number) => void;
}) {
  const ended = new Date(note.expires_at).getTime() <= Date.now();
  const TypeIcon =
    note.media_type === "image" ? ImageIcon : note.media_type === "video" ? Video : FileText;

  return (
    <article className={`note-card ${ended ? "note-card-ended" : ""}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="icon-circle icon-circle-sm">
            <TypeIcon size={18} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h3 className="font-bold text-emerald-900 truncate">
              {note.title || "ملاحظة من الإدارة"}
            </h3>
            <p className="text-xs text-emerald-600/70">
              من {note.created_by_name} · تظهر لمدة {durationHoursLabel(note.duration_hours)}
            </p>
          </div>
        </div>
        {onDelete && (
          <button
            type="button"
            className="btn-danger-ghost"
            onClick={() => onDelete(note.id)}
          >
            حذف
          </button>
        )}
      </div>

      {note.body && (
        <p className="note-body whitespace-pre-wrap leading-8">{note.body}</p>
      )}

      {note.media_type === "image" && note.media_path && (
        <img
          src={`/api/uploads/${note.media_path}`}
          alt={note.title || "صورة الملاحظة"}
          className="note-media"
        />
      )}

      {note.media_type === "video" && note.media_path && (
        <video
          src={`/api/uploads/${note.media_path}`}
          controls
          playsInline
          className="note-media"
        />
      )}

      <RemainingTimer createdAt={note.created_at} expiresAt={note.expires_at} />
    </article>
  );
}
