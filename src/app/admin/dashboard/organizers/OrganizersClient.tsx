"use client";

import React, { useState } from "react";
import { createOrganizerAccountAction } from "@/lib/actions";
import { KeyRound, ShieldAlert, CheckCircle2 } from "lucide-react";

interface OrganizerRow {
  id: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  eventCount: number;
  loginEmail: string | null;
}

const inputCls =
  "w-full bg-slate-950 border border-white/5 rounded-xl py-2.5 px-3.5 text-white focus:outline-none focus:border-brand-accent/50 font-semibold text-xs";

export default function OrganizersClient({ organizers }: { organizers: OrganizerRow[] }) {
  const [creatingFor, setCreatingFor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await createOrganizerAccountAction(null, formData);
      if (res.success) {
        setSuccess("Login created. Share the credentials with the organizer securely.");
        setCreatingFor(null);
        window.location.reload();
      } else {
        setError(res.error || "Failed to create the account.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-black text-white">Organizers</h1>
        <p className="text-xs text-slate-500 font-semibold">
          Create dashboard logins for verified organizers. Accounts are admin-created only.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-semibold">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" /> <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> <span>{success}</span>
        </div>
      )}

      <div className="rounded-2xl bg-slate-900 border border-white/10 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-white/10">
              <th className="px-4 py-3 font-bold">Organizer</th>
              <th className="px-4 py-3 font-bold">Contact</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 font-bold text-right">Events</th>
              <th className="px-4 py-3 font-bold">Login</th>
              <th className="px-4 py-3 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-300">
            {organizers.map((o) => (
              <React.Fragment key={o.id}>
                <tr>
                  <td className="px-4 py-3 font-bold text-white">{o.name}</td>
                  <td className="px-4 py-3 font-semibold">
                    {o.contactPerson || "—"} {o.phone ? `· ${o.phone}` : ""}
                  </td>
                  <td className="px-4 py-3 font-semibold">{o.status}</td>
                  <td className="px-4 py-3 text-right font-bold">{o.eventCount}</td>
                  <td className="px-4 py-3 font-semibold">
                    {o.loginEmail ? (
                      <span className="text-emerald-400">{o.loginEmail}</span>
                    ) : (
                      <span className="text-slate-600">No login</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!o.loginEmail && (
                      <button
                        onClick={() => setCreatingFor(creatingFor === o.id ? null : o.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-accent/30 text-brand-accent hover:bg-brand-accent/10 text-[10px] font-extrabold uppercase tracking-wider"
                      >
                        <KeyRound className="w-3 h-3" /> Create login
                      </button>
                    )}
                  </td>
                </tr>
                {creatingFor === o.id && (
                  <tr>
                    <td colSpan={6} className="px-4 py-4 bg-slate-950/60">
                      <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                        <input type="hidden" name="organizerId" value={o.id} />
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Account name</label>
                          <input name="name" required defaultValue={o.contactPerson || o.name} className={inputCls} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Login email</label>
                          <input name="email" type="email" required defaultValue={o.email || ""} className={inputCls} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Password (8+ chars)</label>
                          <input name="password" type="text" required minLength={8} className={inputCls} />
                        </div>
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-4 py-2.5 rounded-xl glow-btn text-[10px] font-extrabold uppercase tracking-wider text-white"
                        >
                          {loading ? "Creating..." : "Create account"}
                        </button>
                      </form>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {organizers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-semibold">
                  No organizer profiles yet. They are created from event submissions or manually.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
