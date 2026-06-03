"use client";

import React, { useState } from "react";
import { updateLeadStatusAction, deleteLeadAction, deleteSubscriberAction } from "@/lib/actions";
import { Inbox, Users, Mail, Phone, MessageSquare, Briefcase, Trash2, X, CheckCircle, ChevronRight } from "lucide-react";

interface LeadsClientProps {
  leads: any[];
  subscribers: any[];
}

export default function LeadsClient({
  leads: initialLeads,
  subscribers: initialSubscribers,
}: LeadsClientProps) {
  const [leads, setLeads] = useState(initialLeads);
  const [subscribers, setSubscribers] = useState(initialSubscribers);
  const [activeTab, setActiveTab] = useState<"leads" | "subscribers">("leads");

  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await updateLeadStatusAction(id, newStatus);
      if (res.success) {
        setLeads(leads.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
        if (selectedLead && selectedLead.id === id) {
          setSelectedLead({ ...selectedLead, status: newStatus });
        }
      } else {
        alert(res.error || "Failed to update lead status.");
      }
    } catch (err) {
      alert("An error occurred while updating status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this advertising lead permanently?")) {
      return;
    }

    try {
      const res = await deleteLeadAction(id);
      if (res.success) {
        setLeads(leads.filter((l) => l.id !== id));
        if (selectedLead && selectedLead.id === id) {
          setSelectedLead(null);
        }
      } else {
        alert(res.error || "Failed to delete lead.");
      }
    } catch (err) {
      alert("An error occurred during deletion.");
    }
  };

  const handleDeleteSubscriber = async (id: string) => {
    if (!window.confirm("Are you sure you want to unsubscribe/delete this subscriber?")) {
      return;
    }

    try {
      const res = await deleteSubscriberAction(id);
      if (res.success) {
        setSubscribers(subscribers.filter((s) => s.id !== id));
      } else {
        alert(res.error || "Failed to delete subscriber.");
      }
    } catch (err) {
      alert("An error occurred during deletion.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-glow">
          Leads Tracking
        </span>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Inquiries & Subscriptions
        </h1>
      </div>

      {/* TABS */}
      <div className="flex space-x-2 border-b border-white/5 pb-2">
        <button
          onClick={() => setActiveTab("leads")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
            activeTab === "leads"
              ? "bg-brand-accent/15 border border-brand-accent/20 text-brand-glow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Inbox className="w-4 h-4 shrink-0 text-brand-accent" />
          <span>Branding & Sponsor Leads</span>
          <span className="bg-slate-900 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold">
            {leads.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("subscribers")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
            activeTab === "subscribers"
              ? "bg-brand-accent/15 border border-brand-accent/20 text-brand-glow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Users className="w-4 h-4 shrink-0 text-brand-accent" />
          <span>Newsletter Subscribers</span>
          <span className="bg-slate-900 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold">
            {subscribers.length}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LEADS TAB CONTENT */}
        {activeTab === "leads" && (
          <>
            <div className="lg:col-span-2 glass-panel rounded-2xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-slate-500 font-bold uppercase tracking-wider border-b border-white/5">
                      <th className="p-4">Lead Contact</th>
                      <th className="p-4">Company</th>
                      <th className="p-4">Service</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-semibold text-slate-300">
                    {leads.length > 0 ? (
                      leads.map((lead) => (
                        <tr
                          key={lead.id}
                          onClick={() => setSelectedLead(lead)}
                          className={`hover:bg-white/5 transition-colors cursor-pointer ${
                            selectedLead?.id === lead.id ? "bg-white/5" : ""
                          }`}
                        >
                          <td className="p-4 space-y-0.5 max-w-44">
                            <div className="text-white font-bold truncate">{lead.name}</div>
                            <div className="text-[10px] text-slate-500 truncate">{lead.email}</div>
                          </td>
                          <td className="p-4 text-slate-400 truncate max-w-36">
                            {lead.companyName || "Personal"}
                          </td>
                          <td className="p-4">
                            <span className="bg-brand-accent/10 border border-brand-accent/15 text-brand-glow text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full">
                              {lead.leadType}
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                lead.status === "NEW"
                                  ? "bg-orange-500/10 border border-orange-500/20 text-brand-glow animate-pulse"
                                  : lead.status === "CONVERTED"
                                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                                  : "bg-slate-900 border border-white/10 text-slate-500"
                              }`}
                            >
                              {lead.status}
                            </span>
                          </td>
                          <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              className="p-1.5 rounded-lg border border-white/5 bg-slate-900 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-10 text-center text-slate-500 font-semibold">
                          No branding leads or ad inquiries logged in the database yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MESSAGE SIDEBAR DRAWER */}
            <aside className="glass-panel p-6 rounded-3xl border border-white/5 space-y-6">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 border-b border-white/5 pb-2 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-brand-accent" />
                <span>Lead Detail Workspace</span>
              </h3>

              {selectedLead ? (
                <div className="space-y-6 text-xs font-semibold text-slate-300">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white leading-tight">{selectedLead.name}</h4>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                      {selectedLead.companyName || "Personal Inquiry"}
                    </div>
                  </div>

                  {/* Message box */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-white/5 space-y-1.5">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-brand-glow" />
                      <span>Sponsor Message</span>
                    </span>
                    <p className="text-[11px] font-semibold text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {selectedLead.message}
                    </p>
                  </div>

                  {/* Specs */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center space-x-2.5">
                      <Phone className="w-4 h-4 text-brand-accent" />
                      <span>{selectedLead.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2.5">
                      <Mail className="w-4 h-4 text-brand-accent" />
                      <span>{selectedLead.email}</span>
                    </div>
                  </div>

                  {/* Status update select */}
                  <div className="space-y-1.5 pt-4 border-t border-white/5">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      Lead Progress Status
                    </label>
                    <select
                      value={selectedLead.status}
                      disabled={updatingStatus}
                      onChange={(e) => handleStatusChange(selectedLead.id, e.target.value)}
                      className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-accent/50 font-bold text-xs"
                    >
                      <option value="NEW">New Lead / Uncontacted</option>
                      <option value="CONTACTED">Contacted / Pricing Sent</option>
                      <option value="CONVERTED">Sponsorship Converted</option>
                      <option value="CLOSED">Closed / Unresponsive</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 font-semibold text-xs leading-normal">
                  Select a sponsor inquiry from the table to view their branding requirements, message logs, and contact details.
                </div>
              )}
            </aside>
          </>
        )}

        {/* SUBSCRIBERS TAB CONTENT */}
        {activeTab === "subscribers" && (
          <div className="lg:col-span-3 glass-panel rounded-2xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-500 font-bold uppercase tracking-wider border-b border-white/5">
                    <th className="p-4">Email Address</th>
                    <th className="p-4">City</th>
                    <th className="p-4">Category Interests</th>
                    <th className="p-4">Subscribed On</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-semibold text-slate-300">
                  {subscribers.length > 0 ? (
                    subscribers.map((sub) => (
                      <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 space-y-0.5">
                          <div className="text-white font-bold">{sub.email}</div>
                          {sub.name && <div className="text-[10px] text-slate-500">{sub.name}</div>}
                        </td>
                        <td className="p-4 text-slate-400 capitalize">{sub.city || "All Odisha"}</td>
                        <td className="p-4 max-w-72 truncate">
                          {sub.interests ? (
                            <div className="flex flex-wrap gap-1">
                              {sub.interests.split(",").map((i: string) => (
                                <span key={i} className="bg-slate-900 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full text-slate-400">
                                  {i}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[10px]">All Events</span>
                          )}
                        </td>
                        <td className="p-4 text-slate-500 text-[10px]">{sub.createdAt.split("T")[0]}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteSubscriber(sub.id)}
                            className="p-1.5 rounded-lg border border-white/5 bg-slate-900 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-slate-500 font-semibold">
                        No email newsletter subscribers found in the database.
                      </      td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
