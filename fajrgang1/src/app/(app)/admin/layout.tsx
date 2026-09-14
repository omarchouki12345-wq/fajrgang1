import { redirect } from "next/navigation";
import { getSession, requireRole } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session || !requireRole(session, ["OWNER", "ADMIN"])) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
