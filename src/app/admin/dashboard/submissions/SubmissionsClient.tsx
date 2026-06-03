"use client";

import React, { useState } from "react";
import { approveSubmissionAction, rejectSubmissionAction } from "@/lib/actions";
import { ClipboardList, ShieldCheck, XCircle, Info, Calendar, MapPin, User, MessageCircle, X, Sparkles } from "lucide-react";

interface SubmissionsClientProps {
  submissions: any[];
}

export default function SubmissionsClient({
  submissions: initialSubmissions,
}: SubmissionsClientProps) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [filter, setFilter] = useState("PENDING");
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectReasonOpen, setRejectReasonOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const filtered = submissions.filter((sub) => sub.status === filter);

  const handleApprove = async () => {
    if (!selectedSub) return;
    setLoading(true);

    try {
      const res = await approveSubmissionAction(selectedSub.id, adminNotes);
      if (res.success) {
        setSubmissions(
          submissions.map((sub) =>
            sub.id === selectedSub.id ? { ...sub, status: "APPROVED", adminNotes } : sub
          )
        );
        setSelectedSub(null);
        setAdminNotes("");
      } else {
        alert(res.error || "Failed to approve submission.");
      }
    } catch (err) {
      alert("An error occurred during approval.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSub) return;
    if (!adminNotes) {
      alert("Please provide a reason/note for rejecting the event submission.");
      return;
    }
    setLoading(true);

    try {
      const res = await rejectSubmissionAction(selectedSub.id, adminNotes);
      if (res.success) {
        setSubmissions(
          submissions.map((sub) =>
            sub.id === selectedSub.id ? { ...sub, status: "REJECTED", adminNotes } : sub
          )
        );
        setSelectedSub(null);
        setAdminNotes("");
        setRejectReasonOpen(false);
      } else {
        alert(res.error || "Failed to reject submission.");
      }
    } catch (err) {
      alert("An error occurred during rejection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-glow">
          Organizer Submissions
        </span>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Review & Approve Portal
        </h1>
      </div>

      {/* FILTER TABS */}
      <div className="flex space-x-2 border-b border-white/5 pb-2">
        {[
          { name: "Pending", value: "PENDING", count: submissions.filter((s) => s.status === "PENDING").length },
          { name: "Approved", value: "APPROVED", count: submissions.filter((s) => s.status === "APPROVED").length },
          { name: "Rejected", value: "REJECTED", count: submissions.filter((s) => s.status === "REJECTED").length },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setFilter(tab.value);
              setSelectedSub(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              filter === tab.value
                ? "bg-brand-accent/15 border border-brand-accent/20 text-brand-glow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>{tab.name}</span>
            <span className="bg-slate-900 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* SUBMISSIONS LIST */}
        <div className="lg:col-span-2 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {filtered.length > 0 ? (
            filtered.map((sub) => (
              <div
                key={sub.id}
                onClick={() => {
                  setSelectedSub(sub);
                  setAdminNotes(sub.adminNotes || "");
                  setRejectReasonOpen(false);
                }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer text-xs font-semibold ${
                  selectedSub?.id === sub.id
                    ? "bg-brand-accent/10 border-brand-accent/30"
                    : "glass-panel border-white/5 hover:border-white/10 hover:bg-white/5"
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1 truncate">
                    <h3 className="text-sm font-bold text-white truncate">{sub.eventTitle}</h3>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex flex-wrap gap-x-2">
                      <span>{sub.organizerName}</span>
                      <span>•</span>
                      <span>{sub.city}</span>
                      <span>•</span>
                      <span>{sub.category}</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 shrink-0 mt-0.5">
                    {sub.startDate}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-slate-500 font-semibold glass-panel border border-white/5 rounded-2xl">
              No event submissions found under "{filter}".
            </div>
          )}
        </div>

        {/* DETAILS REVIEW BOARD */}
        <aside className="glass-panel p-6 rounded-3xl border border-white/5 space-y-6">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 border-b border-white/5 pb-2 flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4 text-brand-accent" />
            <span>Submission Details</span>
          </h3>

          {selectedSub ? (
            <div className="space-y-6">
              {/* Event poster and spec */}
              <div className="space-y-3">
                <div className="text-sm font-bold text-white leading-snug">
                  {selectedSub.eventTitle}
                </div>
                <div className="space-y-2 text-xs font-semibold text-slate-300">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-brand-accent shrink-0" />
                    <span>{selectedSub.startDate} {selectedSub.startTime ? `@ ${selectedSub.startTime}` : ""}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-brand-accent shrink-0" />
                    <span>{selectedSub.venueName}, {selectedSub.city}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-3.5 h-3.5 text-brand-accent shrink-0" />
                    <span>{selectedSub.organizerName} ({selectedSub.phone})</span>
                  </div>
                  <div className="flex items-center space-x-2 pt-1 border-t border-white/5">
                    <span className="text-slate-500 uppercase tracking-widest text-[9px] font-extrabold w-24">Classification:</span>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      selectedSub.organizerType === "GOVERNMENT" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      selectedSub.organizerType === "PRIVATE" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                      selectedSub.organizerType === "SOCIAL" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                      "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                    }`}>
                      {selectedSub.organizerType || "PUBLIC"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1 bg-slate-950 p-4 rounded-xl border border-white/5">
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Description</span>
                <p className="text-[11px] font-semibold text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {selectedSub.description}
                </p>
              </div>

              {/* Promotion Package */}
              {selectedSub.promotionInterest && (
                <div className="space-y-1 bg-brand-accent/5 p-4 rounded-xl border border-brand-accent/10">
                  <span className="text-[9px] uppercase font-bold text-brand-glow tracking-wider">Promotion Interest</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedSub.promotionInterest.split(",").map((p: string) => (
                      <span key={p} className="bg-brand-accent/20 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full text-white">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Forms */}
              {filter === "PENDING" && (
                <div className="space-y-4 pt-2 border-t border-white/5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                      Admin Notes / Reject Reason
                    </label>
                    <textarea
                      placeholder="Add internal notes, or specify a rejection reason here before clicking Approve/Reject..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-white/5 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-accent/50 font-semibold"
                      rows={3}
                    ></textarea>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setRejectReasonOpen(true)}
                      className="flex-grow py-3 rounded-xl border border-white/10 hover:border-rose-500/30 hover:bg-rose-500/10 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-rose-400 flex items-center justify-center space-x-1"
                    >
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={loading}
                      className="flex-grow py-3 rounded-xl glow-btn text-xs font-bold uppercase tracking-wider text-white flex items-center justify-center space-x-1 shadow"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 shrink-0" />
                          <span>Approve & Publish</span>
                        </>
                      )}
                    </button>
                  </div>

                  {rejectReasonOpen && (
                    <div className="bg-rose-500/5 border border-rose-500/10 p-4 rounded-2xl text-center space-y-2">
                      <p className="text-[10px] font-semibold text-slate-400 leading-relaxed">
                        Are you sure you want to reject this event? Make sure you have entered the reason in the notes field above so the organizer is informed.
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setRejectReasonOpen(false)}
                          className="flex-grow py-1.5 rounded-lg border border-white/5 bg-slate-900 text-[10px] font-bold text-slate-300 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleReject}
                          disabled={loading}
                          className="flex-grow py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-[10px] font-bold text-white"
                        >
                          Confirm Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Already Processed States */}
              {filter !== "PENDING" && (
                <div className="bg-slate-950 p-4 rounded-xl border border-white/5 space-y-2 text-xs">
                  <div className="text-slate-500 uppercase tracking-widest font-extrabold text-[9px]">
                    Review Status
                  </div>
                  <div className="flex items-center space-x-1.5">
                    {filter === "APPROVED" ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span className="font-bold text-white">{filter}</span>
                  </div>
                  {selectedSub.adminNotes && (
                    <div className="text-slate-400 text-[11px] leading-relaxed pt-1.5 border-t border-white/5">
                      <strong>Notes:</strong> {selectedSub.adminNotes}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 font-semibold text-xs leading-normal">
              Select an event submission from the left panel to review its timing, poster, and contact sheet.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
