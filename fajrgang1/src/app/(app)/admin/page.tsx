"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, BookOpen, CheckCircle2, ListChecks, Trophy, Users } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import IconCircle from "@/components/IconCircle";
import MembersWhatsappList, { type MemberRow } from "@/components/MembersWhatsappList";
import { SURAH_NAMES } from "@/lib/constants";
import { whatsappLink } from "@/lib/whatsapp";

interface PendingMem {
  id: number;
  user_name: string;
  user_whatsapp: string;
  surah_number: number;
  start_ayah: number;
  end_ayah: number;
}

function AdminContent() {
  const [pendingMembers, setPendingMembers] = useState(0);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [pendingMem, setPendingMem] = useState<PendingMem[]>([]);
  const [message, setMessage] = useState("");

  function load() {
    fetch("/api/admin/members")
      .then((r) => r.json())
      .then((d) => {
        const list: MemberRow[] = d.members || [];
        setMembers(list);
        setPendingMembers(
          list.filter((m) => m.status === "PENDING" && m.role === "MEMBER").length
        );
      });

    fetch("/api/memorization")
      .then((r) => r.json())
      .then((d) => setPendingMem(d.pending || []));
  }

  useEffect(() => {
    load();
  }, []);

  async function confirmMem(id: number) {
    const res = await fetch("/api/memorization", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "admin_confirm", userMemId: id }),
    });
    const data = await res.json();
    setMessage(data.message || data.error);
    setPendingMem((p) => p.filter((m) => m.id !== id));
  }

  return (
    <>
      <h1 className="page-title">لوحة الإدارة</h1>
      <p className="page-subtitle">إدارة الأعضاء والحفظ والملاحظات</p>

      {message && <div className="alert alert-success">{message}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
        <Link href="/admin/members" className="dash-link-card">
          <GlassCard hover className="text-center h-full">
            <IconCircle className="mx-auto mb-2">
              <Users size={22} />
            </IconCircle>
            <div className="font-bold text-emerald-800">الأعضاء</div>
            {pendingMembers > 0 && (
              <div className="badge badge-pending mt-2">{pendingMembers} بانتظار التأكيد</div>
            )}
          </GlassCard>
        </Link>

        <Link href="/admin/progress" className="dash-link-card">
          <GlassCard hover className="text-center h-full">
            <IconCircle className="mx-auto mb-2">
              <ListChecks size={22} />
            </IconCircle>
            <div className="font-bold text-emerald-800">متابعة المهام</div>
          </GlassCard>
        </Link>

        <Link href="/admin/notes" className="dash-link-card">
          <GlassCard hover className="text-center h-full">
            <IconCircle className="mx-auto mb-2">
              <Bell size={22} />
            </IconCircle>
            <div className="font-bold text-emerald-800">الملاحظات</div>
          </GlassCard>
        </Link>

        <Link href="/admin/memorization" className="dash-link-card">
          <GlassCard hover className="text-center h-full">
            <IconCircle className="mx-auto mb-2">
              <BookOpen size={22} />
            </IconCircle>
            <div className="font-bold text-emerald-800">مهام الحفظ</div>
          </GlassCard>
        </Link>

        <Link href="/leaderboard" className="dash-link-card">
          <GlassCard hover className="text-center h-full">
            <IconCircle className="mx-auto mb-2">
              <Trophy size={22} />
            </IconCircle>
            <div className="font-bold text-emerald-800">المتصدرون</div>
          </GlassCard>
        </Link>
      </div>

      {pendingMem.length > 0 && (
        <GlassCard className="mb-8">
          <h3 className="text-lg font-bold text-emerald-800 mb-4">
            طلبات تأكيد الحفظ ({pendingMem.length})
          </h3>
          <div className="space-y-3">
            {pendingMem.map((m) => (
              <div key={m.id} className="task-row">
                <div className="min-w-0">
                  <div className="font-bold">{m.user_name}</div>
                  <a
                    href={whatsappLink(m.user_whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="wa-link"
                    dir="ltr"
                  >
                    {m.user_whatsapp}
                  </a>
                  <div className="text-sm text-emerald-600 mt-1">
                    {SURAH_NAMES[m.surah_number]} ({m.start_ayah}-{m.end_ayah})
                  </div>
                </div>
                <button
                  className="btn-primary text-sm inline-flex items-center gap-1 shrink-0"
                  onClick={() => confirmMem(m.id)}
                >
                  <CheckCircle2 size={16} />
                  تأكيد
                </button>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      <GlassCard>
        <h3 className="font-bold text-emerald-800 mb-4">الأعضاء وأرقام الواتساب</h3>
        <MembersWhatsappList members={members} />
      </GlassCard>
    </>
  );
}

export default function AdminPage() {
  return <AdminContent />;
}
