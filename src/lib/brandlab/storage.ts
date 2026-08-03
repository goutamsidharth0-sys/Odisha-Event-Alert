// Supabase Storage over its REST API.
//
// Deliberately no @supabase/supabase-js dependency: uploading and deleting an
// object is two fetch calls, and the SDK would be a megabyte of client surface
// for that.
//
// When the storage variables are unset the whole module no-ops and returns null.
// Brand Lab still works end to end — renders live in the browser and the lead
// still reaches the inbox — it just cannot keep a copy of the artwork. Same
// pattern as the auto-scan engine without SERPAPI_KEY.

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "brandlab";

interface StorageConfig {
  url: string;
  key: string;
}

function config(): StorageConfig | null {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export function storageEnabled(): boolean {
  return config() !== null;
}

function objectUrl(cfg: StorageConfig, path: string): string {
  return `${cfg.url}/storage/v1/object/${BUCKET}/${path}`;
}

/**
 * Upload bytes and return the public URL, or null when storage is not
 * configured. Never throws: a storage outage must not cost a lead.
 */
export async function uploadObject(
  path: string,
  body: ArrayBuffer | Uint8Array,
  contentType: string
): Promise<string | null> {
  const cfg = config();
  if (!cfg) return null;

  try {
    const response = await fetch(objectUrl(cfg, path), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.key}`,
        "Content-Type": contentType,
        "x-upsert": "true",
        "cache-control": "public, max-age=31536000, immutable",
      },
      body: body as BodyInit,
    });
    if (!response.ok) {
      console.error("Brand Lab storage upload failed:", response.status, await response.text());
      return null;
    }
    return `${cfg.url}/storage/v1/object/public/${BUCKET}/${path}`;
  } catch (error) {
    console.error("Brand Lab storage upload error:", error);
    return null;
  }
}

/** Delete objects by path. Used by the 30-day purge of unconverted renders. */
export async function deleteObjects(paths: string[]): Promise<number> {
  const cfg = config();
  if (!cfg || paths.length === 0) return 0;

  try {
    const response = await fetch(`${cfg.url}/storage/v1/object/${BUCKET}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${cfg.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prefixes: paths }),
    });
    if (!response.ok) {
      console.error("Brand Lab storage delete failed:", response.status);
      return 0;
    }
    return paths.length;
  } catch (error) {
    console.error("Brand Lab storage delete error:", error);
    return 0;
  }
}

/** Recover the in-bucket path from a public URL, for deletion. */
export function pathFromPublicUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : url.slice(index + marker.length);
}
