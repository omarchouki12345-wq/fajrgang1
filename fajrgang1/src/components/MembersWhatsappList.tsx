"use client";

import { MessageCircle } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { whatsappLink } from "@/lib/whatsapp";

export interface MemberRow {
  id: number;
  name: string;
  whatsapp: string;
  role: string;
  status: string;
  points?: number;
}

const roleLabel: Record<string, string> = {
  OWNER: "مالك",
  ADMIN: "مشرف",
  MEMBER: "عضو",
};

export default function MembersWhatsappList({
  members,
  emptyText = "لا يوجد أعضاء",
}: {
  members: MemberRow[];
  emptyText?: string;
}) {
  if (members.length === 0) {
    return <p className="text-emerald-600/60 text-center py-4">{emptyText}</p>;
  }

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {members.map((m) => (
        <div key={m.id} className="member-wa-row">
          <div className="min-w-0">
            <div className="font-bold text-emerald-800 truncate">{m.name}</div>
            <a
              href={whatsappLink(m.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="wa-link"
              dir="ltr"
            >
              <MessageCircle size={14} strokeWidth={2} />
              {m.whatsapp}
            </a>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-xs text-emerald-600/80">{roleLabel[m.role] || m.role}</span>
            <StatusBadge status={m.status} />
          </div>
        </div>
      ))}
    </div>
  );
}
