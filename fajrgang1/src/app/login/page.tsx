"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoonStar } from "lucide-react";
import GlassCard from "@/components/GlassCard";

export default function LoginPage() {
  const router = useRouter();
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
        <div className="flex justify-center mb-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-emerald-800 inline-flex items-center gap-2">
            <MoonStar size={32} />
            فجر جماعة
          </h1>
        </div>
          <p className="text-emerald-600/70">تتبع الفجر والأذكار وحفظ القرآن</p>
        </div>

        <GlassCard>
          <h2 className="text-2xl font-bold text-emerald-800 mb-6 text-center">تسجيل الدخول</h2>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-emerald-700 mb-2">
                رقم الواتساب
              </label>
              <input
                type="tel"
                className="input-field"
                placeholder="06XXXXXXXX"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                required
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-emerald-700 mb-2">
                كلمة المرور
              </label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "جاري الدخول..." : "دخول"}
            </button>
          </form>

          <p className="text-center mt-6 text-emerald-600/70">
            ليس لديك حساب؟{" "}
            <Link href="/register" className="text-emerald-700 font-semibold hover:underline">
              سجّل الآن
            </Link>
          </p>

          <p className="text-center mt-4 text-xs text-emerald-600/50">
            المالك والمشرفون والأعضاء يسجلون الدخول بنفس الطريقة.
            المشرفون يُعيَّنون من قبل المالك بعد التسجيل.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
