/**
 * Reputation client — uses server API with localStorage cache.
 */

export interface Review {
  gigPda: string;
  gigTitle: string;
  reviewer: string;
  reviewerRole: "client" | "freelancer";
  rating: number; // 1-5
  comment: string;
  timestamp: number;
}

export interface WalletReputation {
  reviews: Review[];
  averageRating: number;
  totalGigs: number;
}

const STORAGE_KEY = "gigsafe_reviews";

// ── localStorage cache ──────────────────────────────────

function getLocalStore(): Record<string, Review[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setLocalStore(store: Record<string, Review[]>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

// ── Server-backed functions ─────────────────────────────

/**
 * Submit a review — writes to server AND localStorage.
 */
export async function submitReview(walletAddress: string, review: Review): Promise<void> {
  // Optimistic local save
  const store = getLocalStore();
  if (!store[walletAddress]) store[walletAddress] = [];
  const existing = store[walletAddress].findIndex(
    (r) => r.gigPda === review.gigPda && r.reviewer === review.reviewer
  );
  if (existing >= 0) {
    store[walletAddress][existing] = review;
  } else {
    store[walletAddress].push(review);
  }
  setLocalStore(store);

  // Persist to server
  try {
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress, review }),
    });
  } catch (err) {
    console.warn("Failed to save review to server:", err);
  }
}

/**
 * Get reputation — tries server first, falls back to localStorage.
 */
export async function fetchReputation(walletAddress: string): Promise<WalletReputation> {
  try {
    const res = await fetch(`/api/reviews?wallet=${encodeURIComponent(walletAddress)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.reviews) {
        // Update local cache
        const store = getLocalStore();
        store[walletAddress] = data.reviews;
        setLocalStore(store);
        return data;
      }
    }
  } catch {
    // Fall through
  }

  return getReputation(walletAddress);
}

/**
 * Synchronous local read for immediate access.
 */
export function getReputation(walletAddress: string): WalletReputation {
  const store = getLocalStore();
  const reviews = store[walletAddress] ?? [];
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);

  return {
    reviews,
    averageRating: reviews.length > 0 ? totalRating / reviews.length : 0,
    totalGigs: reviews.length,
  };
}

/**
 * Check if reviewed — tries server, falls back to local.
 */
export async function fetchHasReviewed(
  walletAddress: string,
  gigPda: string,
  reviewer: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `/api/reviews?wallet=${encodeURIComponent(walletAddress)}&gigPda=${encodeURIComponent(gigPda)}&reviewer=${encodeURIComponent(reviewer)}`
    );
    if (res.ok) {
      const data = await res.json();
      return data.hasReviewed ?? false;
    }
  } catch {
    // Fall through
  }

  return hasReviewed(walletAddress, gigPda, reviewer);
}

/**
 * Synchronous local check.
 */
export function hasReviewed(walletAddress: string, gigPda: string, reviewer: string): boolean {
  const store = getLocalStore();
  const reviews = store[walletAddress] ?? [];
  return reviews.some((r) => r.gigPda === gigPda && r.reviewer === reviewer);
}
