"use client";

import React, { useState } from "react";
import { adminLoginAction } from "@/lib/actions";
import { Lock, Mail, ShieldAlert, Sparkles, Calendar } from "lucide-react";

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await adminLoginAction(null, formData);
      if (res.success) {
        // Redirect to dashboard
        window.location.href = "/admin/dashboard";
      } else {
        setError(res.error || "Invalid credentials.");
      }
    } catch (err: any) {
      setError("An unexpected error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-950 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-brand-accent/5 filter blur-[60px] -z-10 animate-pulse"></div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-accent to-brand-glow text-white shadow-lg shadow-brand-accent/20">
            <Calendar className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Odisha Event Control
          </h1>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Sign in to access admin dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-8 rounded-3xl border border-white/10 space-y-6">
          {error && (
            <div className="flex items-start space-x-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-semibold leading-relaxed">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-slate-400">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="admin@odishaeventalert.com"
                  className="w-full bg-slate-900 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-brand-accent/50 font-semibold"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase tracking-wider text-slate-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-brand-accent/50 font-semibold"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl glow-btn font-extrabold text-xs uppercase tracking-wider text-white flex items-center justify-center space-x-1.5 shadow"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 shrink-0 text-white" />
                  <span>Verify Credentials</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Support note */}
        <p className="text-center text-[10px] font-semibold text-slate-600">
          Authorized personnel only. Sessions are fully encrypted and monitored.
        </p>
      </div>
    </div>
  );
}
