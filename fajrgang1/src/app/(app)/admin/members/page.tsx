"use client";

import { useEffect, useState } from "react";
import {
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  MessageCircle,
  RefreshCw,
  Users,
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import IconCircle from "@/components/IconCircle";
import StatusBadge from "@/components/StatusBadge";
import { memberCredentialsMessage, whatsappLink } from "@/lib/whatsapp";

interface Member {
  id: number;
  name: string;
  whatsapp: string;
  password_plain: string | null;
  role: string;
  status: string;
  points: number;
  member_type_name: string | null;
  member_type_id: number | null;
}

interface MemberType {
  id: number;
  name: string;
  description: string;
}

const roleLabel: Record<string, string> = {
  OWNER: "مالك",
  ADMIN: "مشرف",
  MEMBER: "عضو",
};

function MembersAdminContent() {
  const [members, setMembers] = useState<Member[]>([]);
  const [memberTypes, setMemberTypes] = useState<MemberType[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeDesc, setNewTypeDesc] = useState("");
  const [userRole, setUserRole] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [resettingId, setResettingId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  function loadData() {
    fetch("/api/admin/members")
      .then((r) => r.json())
      .then((d) => setMembers(d.members || []));

    fetch("/api/admin/members?type=member_types")
      .then((r) => r.json())
      .then((d) => setMemberTypes(d.memberTypes || []));

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUserRole(d.user?.role || ""));
  }

  useEffect(() => {
    loadData();
  }, []);

  async function action(act: string, userId: number, extra?: Record<string, unknown>) {
    setError("");
    const res = await fetch("/api/admin/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: act, userId, ...extra }),
    });
    const data = await res.json();
    if (data.error) setError(data.error);
    else setMessage(data.message || "");
    loadData();
    return data;
  }

  async function resetPassword(m: Member) {
    if (
      !window.confirm(
        `تعيين كلمة مرور جديدة لـ ${m.name}؟ يمكنك إرسالها عبر الواتساب بعد ذلك.`
      )
    ) {
      return;
    }
    setResettingId(m.id);
    const data = await action("reset_password", m.id);
    setResettingId(null);
    if (data.password) {
      setShowPasswords(true);
    }
  }

  async function copyPassword(m: Member) {
    if (!m.password_plain) return;
    try {
      await navigator.clipboard.writeText(m.password_plain);
      setCopiedId(m.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      setError("تعذر نسخ كلمة المرور");
    }
  }

  async function createType() {
    if (!newTypeName) return;
    await fetch("/api/admin/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_member_type",
        name: newTypeName,
        description: newTypeDesc,
      }),
    });
    setNewTypeName("");
    setNewTypeDesc("");
    loadData();
  }

  function PasswordBlock({ m }: { m: Member }) {
    const canReset = m.role !== "OWNER";
    return (
      <div className="password-block">
        {m.password_plain ? (
          <div className="flex items-center gap-1 min-w-0">
            <span className="password-chip" dir="ltr">
              {showPasswords ? m.password_plain : "••••••••"}
            </span>
            <button
              type="button"
              className="icon-btn"
              title="نسخ"
              onClick={() => copyPassword(m)}
            >
              <Copy size={14} />
            </button>
            {copiedId === m.id && <span className="text-xs text-emerald-600">تم</span>}
            <a
              href={whatsappLink(
                m.whatsapp,
                memberCredentialsMessage(m.name, m.whatsapp, m.password_plain)
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="icon-btn"
              title="إرسال عبر واتساب"
            >
              <MessageCircle size={14} />
            </a>
          </div>
        ) : (
          <span className="text-xs text-emerald-600/70">غير محفوظة — أعد التعيين</span>
        )}
        {canReset && (
          <button
            type="button"
            className="btn-secondary text-xs px-2 py-1 inline-flex items-center gap-1"
            disabled={resettingId === m.id}
            onClick={() => resetPassword(m)}
          >
            <RefreshCw size={13} />
            {resettingId === m.id ? "جاري..." : "تعيين كلمة مرور"}
          </button>
        )}
      </div>
    );
  }

  function MemberActions({ m }: { m: Member }) {
    return (
      <div className="flex flex-wrap gap-1">
        {m.status === "PENDING" && m.role === "MEMBER" && (
          <button
            className="btn-primary text-xs px-2 py-1"
            onClick={() => action("approve", m.id, { memberTypeId: memberTypes[0]?.id })}
          >
            تأكيد
          </button>
        )}
        {m.status === "ACTIVE" && m.role === "MEMBER" && (
          <button className="btn-secondary text-xs px-2 py-1" onClick={() => action("pause", m.id)}>
            إيقاف
          </button>
        )}
        {m.status === "PAUSED" && (
          <button className="btn-primary text-xs px-2 py-1" onClick={() => action("activate", m.id)}>
            تفعيل
          </button>
        )}
        {m.role === "MEMBER" && m.status !== "REMOVED" && (
          <button
            className="text-xs px-2 py-1 text-red-600 border border-red-200 rounded-lg"
            onClick={() => action("remove", m.id)}
          >
            إزالة
          </button>
        )}
        {userRole === "OWNER" && m.role === "MEMBER" && m.status === "ACTIVE" && (
          <button className="btn-gold text-xs px-2 py-1" onClick={() => action("promote_admin", m.id)}>
            ترقية لمشرف
          </button>
        )}
        {userRole === "OWNER" && m.role === "ADMIN" && (
          <button
            className="btn-secondary text-xs px-2 py-1"
            onClick={() => action("demote_admin", m.id)}
          >
            إرجاع لعضو
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-start gap-3 mb-6">
        <IconCircle size="lg">
          <Users size={24} />
        </IconCircle>
        <div>
          <h1 className="page-title">إدارة الأعضاء</h1>
          <p className="page-subtitle mb-0">تأكيد، إيقاف، كلمات المرور، ومتابعة الحسابات</p>
        </div>
      </div>

      {userRole === "OWNER" && (
        <div className="alert alert-warning mb-6">
          لإنشاء مشرف: أكّد العضو أولاً، ثم اضغط «ترقية لمشرف». سيسجل المشرف الدخول
          بنفس رقم الواتساب وكلمة المرور الخاصة به.
        </div>
      )}

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <GlassCard className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-emerald-800 font-bold">
            <KeyRound size={18} />
            كلمات مرور الأعضاء
          </div>
          <button
            type="button"
            className="btn-secondary text-sm px-3 py-2 inline-flex items-center gap-1"
            onClick={() => setShowPasswords((v) => !v)}
          >
            {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
            {showPasswords ? "إخفاء الكلمات" : "إظهار الكلمات"}
          </button>
        </div>
        <p className="text-sm text-emerald-700/80 mt-2 mb-0">
          الأعضاء القدامى بلا كلمة ظاهرة حتى تعيد التعيين. بعدها يمكنك نسخها أو إرسالها على واتساب.
        </p>
      </GlassCard>

      <GlassCard className="mb-6">
        <h3 className="font-bold text-emerald-800 mb-4">أنواع الأعضاء</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {memberTypes.map((t) => (
            <span key={t.id} className="badge badge-active">
              {t.name}
            </span>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          <input
            className="input-field flex-1 min-w-[150px]"
            placeholder="اسم النوع"
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
          />
          <input
            className="input-field flex-1 min-w-[150px]"
            placeholder="الوصف"
            value={newTypeDesc}
            onChange={(e) => setNewTypeDesc(e.target.value)}
          />
          <button className="btn-secondary px-4 py-3" onClick={createType}>
            إضافة
          </button>
        </div>
      </GlassCard>

      <div className="md:hidden space-y-3">
        {members.map((m) => (
          <GlassCard key={m.id}>
            <div className="flex justify-between gap-3 mb-2">
              <div className="min-w-0">
                <div className="font-bold text-emerald-800">{m.name}</div>
                <a
                  href={whatsappLink(m.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wa-link"
                  dir="ltr"
                >
                  <MessageCircle size={14} />
                  {m.whatsapp}
                </a>
              </div>
              <StatusBadge status={m.status} />
            </div>
            <div className="flex justify-between text-sm text-emerald-700 mb-3">
              <span>{roleLabel[m.role]}</span>
              <span>{m.points} نقطة</span>
            </div>
            <div className="mb-3">
              <PasswordBlock m={m} />
            </div>
            <MemberActions m={m} />
          </GlassCard>
        ))}
      </div>

      <GlassCard className="hidden md:block">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>الواتساب</th>
                <th>كلمة المرور</th>
                <th>الدور</th>
                <th>الحالة</th>
                <th>النقاط</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>
                    <a
                      href={whatsappLink(m.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="wa-link"
                      dir="ltr"
                    >
                      <MessageCircle size={14} />
                      {m.whatsapp}
                    </a>
                  </td>
                  <td>
                    <PasswordBlock m={m} />
                  </td>
                  <td>{roleLabel[m.role]}</td>
                  <td>
                    <StatusBadge status={m.status} />
                  </td>
                  <td>{m.points}</td>
                  <td>
                    <MemberActions m={m} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </>
  );
}

export default function MembersAdminPage() {
  return <MembersAdminContent />;
}
