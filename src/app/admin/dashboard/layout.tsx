import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyAdminSession, adminLogoutAction } from "@/lib/actions";
import { Calendar, LayoutDashboard, Database, ClipboardList, Inbox, LogOut, ShieldAlert, Radar, Ticket } from "lucide-react";

// Admin dashboard is session-scoped and reads live data — never prerender it.
export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Secure Guard: Verify session server-side
  const session = await verifyAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const menuItems = [
    { name: "Stats Overview", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Manage Events", href: "/admin/dashboard/events", icon: Database },
    { name: "Auto-Scan Engine", href: "/admin/dashboard/autoscan", icon: Radar },
    { name: "Registrations", href: "/admin/dashboard/registrations", icon: Ticket },
    { name: "Review Submissions", href: "/admin/dashboard/submissions", icon: ClipboardList },
    { name: "Leads & Subscribers", href: "/admin/dashboard/leads", icon: Inbox },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-between shrink-0">
        <div className="p-6 space-y-8">
          {/* Dashboard Logo */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-accent to-brand-glow text-white shadow shadow-brand-accent/20">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white leading-none">
                Odisha Event Admin
              </span>
              <span className="text-[9px] text-slate-500 font-extrabold tracking-widest uppercase mt-0.5 flex items-center gap-0.5">
                Control Room <ShieldAlert className="w-2.5 h-2.5 text-brand-accent" />
              </span>
            </div>
          </div>

          {/* User Account Capsule */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-white/5 flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-accent/15 border border-brand-accent/30 text-brand-glow font-bold text-xs flex items-center justify-center">
              {session.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-bold text-white leading-tight truncate">
                {session.name}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold truncate uppercase">
                {session.role.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-2.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all whitespace-nowrap"
                >
                  <Icon className="w-4 h-4 text-brand-accent shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout Form Button */}
        <div className="p-6 border-t border-white/5">
          <form action={async () => {
            "use server";
            await adminLogoutAction();
          }}>
            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-white/10 hover:border-rose-500/30 hover:bg-rose-500/10 text-xs font-bold text-slate-400 hover:text-rose-400 transition-all"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Logout Control</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Panel Content Window */}
      <div className="flex-grow p-6 md:p-10 space-y-8 overflow-y-auto max-h-screen">
        {children}
      </div>
    </div>
  );
}
