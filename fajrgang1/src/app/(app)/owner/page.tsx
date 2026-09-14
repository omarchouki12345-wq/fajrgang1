"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  BookOpen,
  LayoutDashboard,
  ListChecks,
  Trophy,
  Users,
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import IconCircle from "@/components/IconCircle";
import MembersWhatsappList, { type MemberRow } from "@/components/MembersWhatsappList";

function OwnerContent() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    admins: 0,
  });
  const [members, setMembers] = useState<MemberRow[]>([]);

  useEffect(() => {
    fetch("/api/admin/members")
      .then((r) => r.json())
      .then((d) => {
        const list: MemberRow[] = d.members || [];
        setMembers(list);
        setStats({
          total: list.filter((m) => m.role === "MEMBER").length,
          active: list.filter((m) => m.role === "MEMBER" && m.status === "ACTIVE").length,
          pending: list.filter((m) => m.role === "MEMBER" && m.status === "PENDING").length,
          admins: list.filter((m) => m.role === "ADMIN").length,
        });
      });
  }, []);

  return (
    <>
      <h1 className="page-title">لوحة المالك</h1>
      <p className="page-subtitle">التحكم الكامل في المنصة</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <GlassCard className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">إجمالي الأعضاء</div>
        </GlassCard>
        <GlassCard className="stat-card">
          <div className="stat-value">{stats.active}</div>
          <div className="stat-label">أعضاء نشطون</div>
        </GlassCard>
        <GlassCard className="stat-card">
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">بانتظار التأكيد</div>
        </GlassCard>
        <GlassCard className="stat-card">
          <div className="stat-value">{stats.admins}</div>
          <div className="stat-label">المشرفون</div>
        </GlassCard>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Link href="/admin/members" className="dash-link-card">
          <GlassCard hover className="h-full">
            <div className="flex items-start gap-3">
              <IconCircle>
                <Users size={22} strokeWidth={1.8} />
              </IconCircle>
              <div>
                <h3 className="font-bold text-emerald-800 text-lg mb-1">الأعضاء والمشرفون</h3>
                <p className="text-emerald-600/70 text-sm">
                  تأكيد الحسابات وإيقافها وترقية المشرفين مع أرقام الواتساب وكلمات المرور
                </p>
              </div>
            </div>
          </GlassCard>
        </Link>

        <Link href="/admin/progress" className="dash-link-card">
          <GlassCard hover className="h-full">
            <div className="flex items-start gap-3">
              <IconCircle>
                <ListChecks size={22} strokeWidth={1.8} />
              </IconCircle>
              <div>
                <h3 className="font-bold text-emerald-800 text-lg mb-1">متابعة الأعضاء</h3>
                <p className="text-emerald-600/70 text-sm">
                  هل أكملوا الفجر والأذكار وهل حفظوا القرآن
                </p>
              </div>
            </div>
          </GlassCard>
        </Link>

        <Link href="/admin/notes" className="dash-link-card">
          <GlassCard hover className="h-full">
            <div className="flex items-start gap-3">
              <IconCircle>
                <Bell size={22} strokeWidth={1.8} />
              </IconCircle>
              <div>
                <h3 className="font-bold text-emerald-800 text-lg mb-1">ملاحظات الأعضاء</h3>
                <p className="text-emerald-600/70 text-sm">
                  أرسل أذكاراً أو صوراً أو فيديو وحدد مدة ظهورها
                </p>
              </div>
            </div>
          </GlassCard>
        </Link>

        <Link href="/admin/memorization" className="dash-link-card">
          <GlassCard hover className="h-full">
            <div className="flex items-start gap-3">
              <IconCircle>
                <BookOpen size={22} strokeWidth={1.8} />
              </IconCircle>
              <div>
                <h3 className="font-bold text-emerald-800 text-lg mb-1">مهام الحفظ</h3>
                <p className="text-emerald-600/70 text-sm">إنشاء وتعديل وحذف سور الحفظ</p>
              </div>
            </div>
          </GlassCard>
        </Link>

        <Link href="/admin" className="dash-link-card">
          <GlassCard hover className="h-full">
            <div className="flex items-start gap-3">
              <IconCircle>
                <LayoutDashboard size={22} strokeWidth={1.8} />
              </IconCircle>
              <div>
                <h3 className="font-bold text-emerald-800 text-lg mb-1">لوحة الإدارة</h3>
                <p className="text-emerald-600/70 text-sm">تأكيدات الحفظ والطلبات المعلقة</p>
              </div>
            </div>
          </GlassCard>
        </Link>

        <Link href="/leaderboard" className="dash-link-card sm:col-span-2">
          <GlassCard hover>
            <div className="flex items-start gap-3">
              <IconCircle>
                <Trophy size={22} strokeWidth={1.8} />
              </IconCircle>
              <div>
                <h3 className="font-bold text-emerald-800 text-lg mb-1">المتصدرون</h3>
                <p className="text-emerald-600/70 text-sm">ترتيب الأعضاء حسب النقاط والاستمرارية</p>
              </div>
            </div>
          </GlassCard>
        </Link>
      </div>

      <GlassCard>
        <h3 className="font-bold text-emerald-800 mb-4">الأعضاء وأرقام الواتساب</h3>
        <MembersWhatsappList members={members.filter((m) => m.role !== "OWNER")} />
      </GlassCard>
    </>
  );
}

export default function OwnerPage() {
  return <OwnerContent />;
}
