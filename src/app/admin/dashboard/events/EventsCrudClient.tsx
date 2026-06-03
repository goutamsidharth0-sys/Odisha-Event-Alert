"use client";

import React, { useState } from "react";
import { createEventAction, updateEventAction, deleteEventAction, toggleFeaturedAction } from "@/lib/actions";
import { PlusCircle, Search, Edit2, Trash2, Star, CheckCircle, ShieldAlert, Sparkles, X } from "lucide-react";

interface EventsCrudClientProps {
  events: any[];
  categories: any[];
  cities: any[];
  organizers: any[];
}

export default function EventsCrudClient({
  events: initialEvents,
  categories,
  cities,
  organizers,
}: EventsCrudClientProps) {
  const [events, setEvents] = useState(initialEvents);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter events
  const filteredEvents = events.filter((ev) => {
    const matchSearch =
      ev.title.toLowerCase().includes(search.toLowerCase()) ||
      ev.venueName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? ev.status === statusFilter : true;
    const matchCity = cityFilter ? ev.cityId === cityFilter : true;
    const matchCat = catFilter ? ev.categoryId === catFilter : true;
    const matchClass = classFilter ? ev.organizerType === classFilter : true;
    return matchSearch && matchStatus && matchCity && matchCat && matchClass;
  });

  const handleToggleFeatured = async (id: string, current: boolean) => {
    try {
      const res = await toggleFeaturedAction(id, !current);
      if (res.success) {
        setEvents(
          events.map((ev) => (ev.id === id ? { ...ev, isFeatured: !current } : ev))
        );
      }
    } catch (err) {
      alert("Failed to update featured status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this event? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await deleteEventAction(id);
      if (res.success) {
        setEvents(events.filter((ev) => ev.id !== id));
      } else {
        alert(res.error || "Failed to delete event.");
      }
    } catch (err) {
      alert("An error occurred while deleting.");
    }
  };

  const handleOpenAddForm = () => {
    setEditingEvent(null);
    setFormOpen(true);
    setError(null);
  };

  const handleOpenEditForm = (ev: any) => {
    setEditingEvent(ev);
    setFormOpen(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data: any = {
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      shortDescription: formData.get("shortDescription") as string,
      description: formData.get("description") as string,
      categoryId: formData.get("categoryId") as string,
      cityId: formData.get("cityId") as string,
      organizerId: formData.get("organizerId") as string || null,
      organizerType: formData.get("organizerType") as string || "PUBLIC",
      eventType: formData.get("eventType") as string,
      status: formData.get("status") as string,
      startDate: formData.get("startDate") as string,
      endDate: formData.get("endDate") as string || null,
      startTime: formData.get("startTime") as string || null,
      endTime: formData.get("endTime") as string || null,
      venueName: formData.get("venueName") as string,
      address: formData.get("address") as string || null,
      district: formData.get("district") as string || null,
      googleMapUrl: formData.get("googleMapUrl") as string || null,
      priceType: formData.get("priceType") as string,
      minPrice: formData.get("minPrice") as string,
      maxPrice: formData.get("maxPrice") as string,
      registrationUrl: formData.get("registrationUrl") as string || null,
      ticketingUrl: formData.get("ticketingUrl") as string || null,
      officialUrl: formData.get("officialUrl") as string || null,
      instagramUrl: formData.get("instagramUrl") as string || null,
      posterUrl: formData.get("posterUrl") as string || null,
      bannerUrl: formData.get("bannerUrl") as string || null,
      sourceName: formData.get("sourceName") as string || null,
      sourceUrl: formData.get("sourceUrl") as string || null,
      isFeatured: formData.get("isFeatured") === "true",
      isTrending: formData.get("isTrending") === "true",
      isVerified: formData.get("isVerified") === "true",
    };

    try {
      if (editingEvent) {
        // Edit Action
        const res = await updateEventAction(editingEvent.id, data);
        if (res.success) {
          // Re-serialize dates for client compatibility
          const updatedEvent = {
            ...res.event,
            startDate: new Date(res.event!.startDate).toISOString().split("T")[0],
            endDate: res.event!.endDate ? new Date(res.event!.endDate).toISOString().split("T")[0] : null,
            category: categories.find((c) => c.id === res.event!.categoryId),
            city: cities.find((c) => c.id === res.event!.cityId),
            organizer: organizers.find((o) => o.id === res.event!.organizerId),
          };

          setEvents(events.map((ev) => (ev.id === editingEvent.id ? updatedEvent : ev)));
          setFormOpen(false);
        } else {
          setError(res.error || "Failed to update event.");
        }
      } else {
        // Add Action
        const res = await createEventAction(data);
        if (res.success) {
          const newEvent = {
            ...res.event,
            startDate: new Date(res.event!.startDate).toISOString().split("T")[0],
            endDate: res.event!.endDate ? new Date(res.event!.endDate).toISOString().split("T")[0] : null,
            category: categories.find((c) => c.id === res.event!.categoryId),
            city: cities.find((c) => c.id === res.event!.cityId),
            organizer: organizers.find((o) => o.id === res.event!.organizerId),
          };

          setEvents([newEvent, ...events]);
          setFormOpen(false);
        } else {
          setError(res.error || "Failed to create event.");
        }
      }
    } catch (err: any) {
      setError("An unexpected error occurred: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const autoGenerateSlug = (e: React.FocusEvent<HTMLInputElement>) => {
    const titleVal = e.target.value;
    const slugInput = document.getElementById("slug-input") as HTMLInputElement;
    if (slugInput && !slugInput.value) {
      slugInput.value = titleVal
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-glow">
            Event Management
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Database Control
          </h1>
        </div>
        <button
          onClick={handleOpenAddForm}
          className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl glow-btn text-xs font-bold text-white uppercase tracking-wider self-start sm:self-auto"
        >
          <PlusCircle className="w-4.5 h-4.5" />
          <span>Add New Event</span>
        </button>
      </div>

      {/* FILTER CONTROLS */}
      <section className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search events or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-brand-accent/50 font-semibold"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-300 font-semibold focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="WATCHLIST">Watchlist</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING">Pending</option>
          </select>

          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-300 font-semibold focus:outline-none"
          >
            <option value="">All Cities</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-300 font-semibold focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-300 font-semibold focus:outline-none"
          >
            <option value="">All Classifications</option>
            <option value="GOVERNMENT">Government</option>
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
            <option value="SOCIAL">Social</option>
          </select>
        </div>
      </section>

      {/* DYNAMIC LIST TABLE */}
      <section className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-500 font-bold uppercase tracking-wider border-b border-white/5">
                <th className="p-4">Event Details</th>
                <th className="p-4">Date / Venue</th>
                <th className="p-4">Category / City</th>
                <th className="p-4">Featured</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-semibold text-slate-300">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 space-y-1 max-w-72">
                      <div className="text-white font-bold truncate">{ev.title}</div>
                      <div className="text-[10px] text-slate-500 truncate">{ev.shortDescription}</div>
                    </td>
                    <td className="p-4 space-y-0.5">
                      <div className="text-white">{ev.startDate}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-40">{ev.venueName}</div>
                    </td>
                    <td className="p-4 space-y-1">
                      <div className="flex flex-col space-y-0.5">
                        <div className="text-brand-glow flex items-center gap-1.5">
                          <span>{ev.category?.name || "Music"}</span>
                          <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full ${
                            ev.organizerType === "GOVERNMENT" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            ev.organizerType === "PRIVATE" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                            ev.organizerType === "SOCIAL" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                            "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                          }`}>
                            {ev.organizerType || "PUBLIC"}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500">{ev.city?.name || "Bhubaneswar"}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleFeatured(ev.id, ev.isFeatured)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          ev.isFeatured
                            ? "bg-brand-accent/20 border-brand-accent/30 text-brand-glow hover:bg-slate-900"
                            : "bg-slate-900 border-white/5 text-slate-500 hover:text-white"
                        }`}
                      >
                        <Star className="w-4 h-4 shrink-0 fill-current" />
                      </button>
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          ev.status === "PUBLISHED"
                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                            : ev.status === "WATCHLIST"
                            ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400"
                            : "bg-slate-900 border border-white/10 text-slate-500"
                        }`}
                      >
                        {ev.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditForm(ev)}
                        className="p-1.5 rounded-lg border border-white/5 bg-slate-900 hover:border-brand-accent/30 text-slate-400 hover:text-white transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(ev.id)}
                        className="p-1.5 rounded-lg border border-white/5 bg-slate-900 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-500 font-semibold">
                    No matching event database logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* SLIDE-OVER DRAWER CRUD FORM */}
      {formOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-end">
          <div className="w-full max-w-2xl h-full bg-slate-900 border-l border-white/10 p-6 sm:p-8 flex flex-col justify-between space-y-6 overflow-y-auto">
            
            {/* Form Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-1.5">
                <Sparkles className="w-5 h-5 text-brand-glow shrink-0" />
                <span>{editingEvent ? "Edit Event Details" : "Create New Event"}</span>
              </h3>
              <button
                onClick={() => setFormOpen(false)}
                className="p-1.5 rounded-lg bg-slate-950 border border-white/5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="flex items-start space-x-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-semibold leading-relaxed">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Core Form Body */}
            <form onSubmit={handleSubmit} className="flex-grow space-y-6 text-xs font-bold text-slate-400">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-300">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    onBlur={autoGenerateSlug}
                    defaultValue={editingEvent ? editingEvent.title : ""}
                    placeholder="e.g. Sufi Night / Annual Hockey Cup"
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50"
                  />
                </div>

                {/* Slug */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-300">
                    URL Slug * (auto-generated)
                  </label>
                  <input
                    type="text"
                    id="slug-input"
                    name="slug"
                    required
                    defaultValue={editingEvent ? editingEvent.slug : ""}
                    placeholder="e.g. sufi-night-bhubaneswar-2026"
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50 font-mono text-[11px]"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-300">
                    Category *
                  </label>
                  <select
                    name="categoryId"
                    required
                    defaultValue={editingEvent ? editingEvent.categoryId : categories[0]?.id}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50 text-xs font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-300">
                    City *
                  </label>
                  <select
                    name="cityId"
                    required
                    defaultValue={editingEvent ? editingEvent.cityId : cities[0]?.id}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50 text-xs font-semibold"
                  >
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Event Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-300">
                    Event Type
                  </label>
                  <select
                    name="eventType"
                    defaultValue={editingEvent ? editingEvent.eventType : "OFFLINE"}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50 text-xs font-semibold"
                  >
                    <option value="OFFLINE">Offline (In-Person)</option>
                    <option value="ONLINE">Online (Webinar)</option>
                    <option value="HYBRID">Hybrid (Both)</option>
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-300">
                    Publish Status
                  </label>
                  <select
                    name="status"
                    defaultValue={editingEvent ? editingEvent.status : "DRAFT"}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50 text-xs font-semibold"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published Live</option>
                    <option value="WATCHLIST">Watchlist Radar</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </div>

                {/* Classification */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-300">
                    Event Classification
                  </label>
                  <select
                    name="organizerType"
                    defaultValue={editingEvent ? editingEvent.organizerType : "PUBLIC"}
                    className="w-full bg-slate-955 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50 text-xs font-semibold"
                  >
                    <option value="PUBLIC">Public Festival / Expo</option>
                    <option value="PRIVATE">Private Concert / Party</option>
                    <option value="GOVERNMENT">Govt Initiative</option>
                    <option value="SOCIAL">Community / Social</option>
                  </select>
                </div>

                {/* Short Description */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-300">
                    Short Description *
                  </label>
                  <input
                    type="text"
                    name="shortDescription"
                    required
                    defaultValue={editingEvent ? editingEvent.shortDescription : ""}
                    placeholder="Enter a 1-line catchy explanation of what the event is."
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50"
                  />
                </div>

                {/* Full Description */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-300">
                    Full Description Details *
                  </label>
                  <textarea
                    name="description"
                    required
                    rows={4}
                    defaultValue={editingEvent ? editingEvent.description : ""}
                    placeholder="Enter complete event description details..."
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50 text-xs font-semibold"
                  ></textarea>
                </div>

                {/* Start Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-300">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    defaultValue={editingEvent ? editingEvent.startDate : ""}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50 text-xs font-semibold"
                  />
                </div>

                {/* End Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-300">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    defaultValue={editingEvent && editingEvent.endDate ? editingEvent.endDate : ""}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50 text-xs font-semibold"
                  />
                </div>

                {/* Start Time */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-300">
                    Start Time
                  </label>
                  <input
                    type="text"
                    name="startTime"
                    defaultValue={editingEvent ? editingEvent.startTime : ""}
                    placeholder="e.g. 06:00 PM"
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50"
                  />
                </div>

                {/* End Time */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-300">
                    End Time
                  </label>
                  <input
                    type="text"
                    name="endTime"
                    defaultValue={editingEvent ? editingEvent.endTime : ""}
                    placeholder="e.g. 10:00 PM"
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50"
                  />
                </div>

                {/* Venue Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-300">
                    Venue Name *
                  </label>
                  <input
                    type="text"
                    name="venueName"
                    required
                    defaultValue={editingEvent ? editingEvent.venueName : ""}
                    placeholder="e.g. Rabindra Mandap"
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50"
                  />
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-300">
                    Venue Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    defaultValue={editingEvent ? editingEvent.address : ""}
                    placeholder="e.g. Jayadev Vihar"
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50"
                  />
                </div>

                {/* District */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-300">
                    District
                  </label>
                  <input
                    type="text"
                    name="district"
                    defaultValue={editingEvent ? editingEvent.district : ""}
                    placeholder="e.g. Khordha"
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50"
                  />
                </div>

                {/* Google Map Link */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-300">
                    Google Maps Link
                  </label>
                  <input
                    type="url"
                    name="googleMapUrl"
                    defaultValue={editingEvent ? editingEvent.googleMapUrl : ""}
                    placeholder="https://maps.google.com/?q=..."
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50"
                  />
                </div>

                {/* Price Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-300">
                    Entry Passes
                  </label>
                  <select
                    name="priceType"
                    defaultValue={editingEvent ? editingEvent.priceType : "FREE"}
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50 text-xs font-semibold"
                  >
                    <option value="FREE">Free</option>
                    <option value="PAID">Paid</option>
                    <option value="REGISTRATION_REQUIRED">Registration Required</option>
                    <option value="NOT_ANNOUNCED">TBA</option>
                  </select>
                </div>

                {/* Min Price */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-300">
                    Min Price (INR)
                  </label>
                  <input
                    type="number"
                    name="minPrice"
                    defaultValue={editingEvent && editingEvent.minPrice !== null ? editingEvent.minPrice : ""}
                    placeholder="e.g. 499"
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50 text-xs font-semibold"
                  />
                </div>

                {/* Max Price */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-300">
                    Max Price (INR)
                  </label>
                  <input
                    type="number"
                    name="maxPrice"
                    defaultValue={editingEvent && editingEvent.maxPrice !== null ? editingEvent.maxPrice : ""}
                    placeholder="e.g. 999"
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50 text-xs font-semibold"
                  />
                </div>

                {/* Ticket Booking URL */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-300">
                    Official Ticket Booking URL
                  </label>
                  <input
                    type="url"
                    name="registrationUrl"
                    defaultValue={editingEvent ? editingEvent.registrationUrl : ""}
                    placeholder="https://bookmyshow.com/..."
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50"
                  />
                </div>

                {/* Poster Image URL */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-300">
                    Poster Image Link
                  </label>
                  <input
                    type="url"
                    name="posterUrl"
                    defaultValue={editingEvent ? editingEvent.posterUrl : ""}
                    placeholder="Paste Unsplash image or poster link..."
                    className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-accent/50"
                  />
                </div>

                {/* Checkboxes row */}
                <div className="sm:col-span-2 flex flex-wrap gap-6 pt-2">
                  <label className="flex items-center space-x-2 cursor-pointer font-bold text-[10px] uppercase tracking-wider text-slate-300">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      value="true"
                      defaultChecked={editingEvent ? editingEvent.isFeatured : false}
                      className="rounded accent-brand-accent"
                    />
                    <span>Featured Event</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer font-bold text-[10px] uppercase tracking-wider text-slate-300">
                    <input
                      type="checkbox"
                      name="isTrending"
                      value="true"
                      defaultChecked={editingEvent ? editingEvent.isTrending : false}
                      className="rounded accent-brand-accent"
                    />
                    <span>Trending Banner</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer font-bold text-[10px] uppercase tracking-wider text-slate-300">
                    <input
                      type="checkbox"
                      name="isVerified"
                      value="true"
                      defaultChecked={editingEvent ? editingEvent.isVerified : false}
                      className="rounded accent-brand-accent"
                    />
                    <span>Verified Badge</span>
                  </label>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="flex-grow py-3 rounded-xl border border-white/10 hover:border-slate-500/30 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-grow py-3 rounded-xl glow-btn font-extrabold text-xs uppercase tracking-wider text-white flex items-center justify-center space-x-1.5 shadow"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 shrink-0 text-white" />
                      <span>{editingEvent ? "Update Details" : "Publish Event"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
