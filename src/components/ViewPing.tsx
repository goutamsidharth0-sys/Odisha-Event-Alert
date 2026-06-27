"use client";

import { useEffect } from "react";

// Records one view per session per viewer without making the page dynamic.
export default function ViewPing({ id }: { id: string }) {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("v:" + id)) return;
      sessionStorage.setItem("v:" + id, "1");
    } catch {
      /* sessionStorage unavailable — still ping once */
    }
    fetch(`/api/events/${id}/view`, { method: "POST", keepalive: true }).catch(() => {});
  }, [id]);
  return null;
}
