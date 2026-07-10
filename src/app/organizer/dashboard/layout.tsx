import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyOrganizerSession, adminLogoutAction } from "@/lib/actions";
import { Megaphone, LayoutDashboard, PlusCircle, LogOut } from "lucide-react";

// Organizer dashboard is session-scoped and reads live data — never prerender it.
export const dynamic = "force-dynamic";

export default async function OrganizerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifyOrganizerSession();
  if (!session) {
    redirect("/organizer/login");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="border-b border-white/10 bg-slate-900">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-accent to-brand-glow text-white">
              <Megaphone className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white leading-none">
                Organizer Dashboard
              </span>
              <span className="text-[10px] text-slate-500 font-semibold truncate">{session.name}</span>
            </div>
          </div>
          <nav className="flex items-center gap-2 text-xs font-bold">
            <Link
              href="/organizer/dashboard"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <LayoutDashboard className="w-4 h-4 text-brand-accent" /> My Events
            </Link>
            <Link
              href="/organizer/dashboard/events/new"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <PlusCircle className="w-4 h-4 text-brand-accent" /> New Event
            </Link>
            <form
              action={async () => {
                "use server";
                await adminLogoutAction();
              }}
            >
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">{children}</main>
    </div>
  );
}
