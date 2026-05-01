/**
 * User profile client — server-backed with in-memory cache.
 */

export interface UserProfile {
  wallet: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  skills?: string[];
  twitter?: string;
  github?: string;
  website?: string;
  updatedAt?: number;
}

// In-memory cache to avoid refetching on every render
const profileCache = new Map<string, { profile: UserProfile; fetchedAt: number }>();
const CACHE_TTL = 60_000; // 1 minute

/**
 * Fetch a user profile from the server.
 */
export async function fetchProfile(wallet: string): Promise<UserProfile> {
  // Check cache
  const cached = profileCache.get(wallet);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.profile;
  }

  try {
    const res = await fetch(`/api/profile?wallet=${encodeURIComponent(wallet)}`);
    if (res.ok) {
      const profile = await res.json();
      profileCache.set(wallet, { profile, fetchedAt: Date.now() });
      return profile;
    }
  } catch {
    // Fall through
  }

  return { wallet };
}

/**
 * Save a user profile to the server.
 */
export async function saveProfile(profile: Partial<UserProfile> & { wallet: string }): Promise<boolean> {
  try {
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    if (res.ok) {
      // Update cache
      const existing = profileCache.get(profile.wallet)?.profile ?? { wallet: profile.wallet };
      const updated = { ...existing, ...profile, updatedAt: Date.now() };
      profileCache.set(profile.wallet, { profile: updated, fetchedAt: Date.now() });
      return true;
    }
  } catch {
    // Fall through
  }

  return false;
}

/**
 * Get display name or shortened wallet.
 */
export function getDisplayName(profile: UserProfile | null, wallet: string): string {
  if (profile?.displayName) return profile.displayName;
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

/**
 * Generate a deterministic avatar color from wallet address.
 */
export function getAvatarColor(wallet: string): string {
  let hash = 0;
  for (let i = 0; i < wallet.length; i++) {
    hash = wallet.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 45%)`;
}
