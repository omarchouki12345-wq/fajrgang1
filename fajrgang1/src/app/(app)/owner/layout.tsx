import { redirect } from "next/navigation";
import { getSession, requireRole } from "@/lib/auth";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session || !requireRole(session, ["OWNER"])) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
