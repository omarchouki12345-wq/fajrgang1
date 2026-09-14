"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ClipboardCheck,
  Bell,
  BookOpen,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  MoonStar,
  Sparkles,
  Sun,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { SessionUser } from "@/lib/auth";

interface NavbarProps {
  user: SessionUser | null;
}

const memberLinks = [
  { href: "/dashboard", label: "لوحتي", icon: LayoutDashboard },
  { href: "/checkin", label: "التسجيل", icon: Sun },
  { href: "/adkar", label: "الأذكار", icon: Sparkles },
  { href: "/memorization", label: "الحفظ", icon: BookOpen },
  { href: "/leaderboard", label: "المتصدرون", icon: Trophy },
];

const adminLinks = [
  { href: "/admin", label: "الإدارة", icon: LayoutDashboard },
  { href: "/admin/members", label: "الأعضاء", icon: Users },
  { href: "/admin/progress", label: "المتابعة", icon: ListChecks },
  { href: "/admin/notes", label: "الملاحظات", icon: Bell },
  { href: "/admin/memorization", label: "الحفظ", icon: BookOpen },
  { href: "/leaderboard", label: "المتصدرون", icon: Trophy },
];

const ownerLinks = [
  { href: "/owner", label: "المالك", icon: LayoutDashboard },
  { href: "/admin", label: "الإدارة", icon: ClipboardCheck },
  { href: "/admin/members", label: "الأعضاء", icon: Users },
  { href: "/admin/progress", label: "المتابعة", icon: ListChecks },
  { href: "/admin/notes", label: "الملاحظات", icon: Bell },
  { href: "/leaderboard", label: "المتصدرون", icon: Trophy },
];

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const links =
    user?.role === "OWNER" ? ownerLinks : user?.role === "ADMIN" ? adminLinks : memberLinks;

  const homeHref =
    user?.role === "OWNER" ? "/owner" : user?.role === "ADMIN" ? "/admin" : "/dashboard";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/admin" || href === "/owner") return pathname === href;
    if (href === "/adkar") return pathname === "/adkar";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (!user) return null;

  return (
    <>
      <nav className="glass-nav sticky top-0 z-50 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <Link href={homeHref} className="flex items-center gap-2 text-lg sm:text-xl font-bold text-emerald-800">
            <MoonStar size={22} strokeWidth={1.8} />
            <span>فجر جماعة</span>
          </Link>

          <div className="hidden md:flex flex-wrap items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link ${isActive(link.href) ? "nav-link-active" : ""}`}
                >
                  <Icon size={16} strokeWidth={2} />
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-emerald-700 hidden sm:inline max-w-[9rem] truncate">
              {user.name}
            </span>
            <button onClick={handleLogout} className="btn-secondary text-sm px-3 py-2 hidden sm:inline-flex items-center gap-1">
              <LogOut size={15} />
              خروج
            </button>
            <button
              type="button"
              className="icon-btn md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="القائمة"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden mt-3 space-y-1 pb-1">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`nav-link w-full justify-start ${isActive(link.href) ? "nav-link-active" : ""}`}
                >
                  <Icon size={16} />
                  {link.label}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="nav-link w-full justify-start text-red-700"
            >
              <LogOut size={16} />
              خروج
            </button>
          </div>
        )}
      </nav>

      {user.role === "MEMBER" && (
        <nav className="bottom-nav md:hidden">
          {memberLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link key={link.href} href={link.href} className={`bottom-nav-link ${active ? "active" : ""}`}>
                <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}
