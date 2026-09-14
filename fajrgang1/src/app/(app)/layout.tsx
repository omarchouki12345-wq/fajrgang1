import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Navbar from "@/components/Navbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <Navbar user={user} />
      <main className={`page-container ${user.role === "MEMBER" ? "has-bottom-nav" : ""}`}>
        {children}
      </main>
    </>
  );
}
