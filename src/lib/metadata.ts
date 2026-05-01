/**
 * Gig metadata client — uses server API with localStorage cache.
 * Server persists data in JSON files; localStorage is a fast cache.
 */

export interface GigMetadata {
  description?: string;
  milestoneNames?: string[];
  category?: string;
  createdBy?: string;
  updatedAt?: number;
}

const STORAGE_KEY = "gigsafe_metadata";

// ── localStorage cache ──────────────────────────────────

function getLocalStore(): Record<string, GigMetadata> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setLocalStore(store: Record<string, GigMetadata>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

// ── Server API calls ────────────────────────────────────

/**
 * Save metadata — writes to server AND localStorage cache.
 */
export async function saveGigMetadata(
  gigPda: string,
  meta: GigMetadata
): Promise<void> {
  // Save to localStorage immediately (optimistic)
  const store = getLocalStore();
  store[gigPda] = { ...store[gigPda], ...meta, updatedAt: Date.now() };
  setLocalStore(store);

  // Persist to server
  try {
    await fetch("/api/metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gigPda,
        description: meta.description,
        milestoneNames: meta.milestoneNames,
        category: meta.category,
        createdBy: meta.createdBy,
      }),
    });
  } catch (err) {
    console.warn("Failed to save metadata to server:", err);
  }
}

/**
 * Get metadata — tries server first, falls back to localStorage.
 */
export async function fetchGigMetadata(gigPda: string): Promise<GigMetadata | null> {
  try {
    const res = await fetch(`/api/metadata?gigPda=${encodeURIComponent(gigPda)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && (data.description || data.milestoneNames)) {
        // Update local cache
        const store = getLocalStore();
        store[gigPda] = data;
        setLocalStore(store);
        return data;
      }
    }
  } catch {
    // Server unavailable, fall through to localStorage
  }

  // Fallback to localStorage
  return getGigMetadata(gigPda);
}

/**
 * Sync read from localStorage (for immediate/synchronous access).
 */
export function getGigMetadata(gigPda: string): GigMetadata | null {
  const store = getLocalStore();
  return store[gigPda] ?? null;
}

/**
 * Get all stored metadata from localStorage.
 */
export function getAllGigMetadata(): Record<string, GigMetadata> {
  return getLocalStore();
}
