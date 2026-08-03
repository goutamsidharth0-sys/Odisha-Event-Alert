"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyAdminSession } from "@/lib/actions";

// Server functions are reachable by direct POST, not only through the UI, so
// the session is verified here rather than relying on the dashboard layout's
// redirect.

const updateSchema = z.object({
  status: z.enum(["new", "contacted", "quoted", "won", "lost"]).optional(),
  adminNotes: z.string().trim().max(4000).optional(),
});

export async function updateKitRequestAction(
  id: string,
  data: { status?: string; adminNotes?: string }
): Promise<{ ok: boolean; error?: string }> {
  const session = await verifyAdminSession();
  if (!session) return { ok: false, error: "Not authorised." };

  const parsed = updateSchema.safeParse(data);
  if (!parsed.success) return { ok: false, error: "Invalid update." };

  try {
    await prisma.kitRequest.update({ where: { id }, data: parsed.data });
    revalidatePath("/admin/dashboard/brandlab");
    return { ok: true };
  } catch (error) {
    console.error("Brand Lab admin update error:", error);
    return { ok: false, error: "Could not save that change." };
  }
}
