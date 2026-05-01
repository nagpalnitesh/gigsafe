"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchProfile, UserProfile, getDisplayName, getAvatarColor } from "@/lib/profile";

interface UserBadgeProps {
  wallet: string;
  showAvatar?: boolean;
  size?: "sm" | "md";
  link?: boolean;
}

/**
 * Displays a user's display name (or shortened wallet) with optional avatar.
 * Fetches profile from server automatically.
 */
export function UserBadge({ wallet, showAvatar = true, size = "sm", link = true }: UserBadgeProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (wallet) {
      fetchProfile(wallet).then(setProfile);
    }
  }, [wallet]);

  const name = getDisplayName(profile, wallet);
  const color = getAvatarColor(wallet);
  const avatarSize = size === "sm" ? "w-5 h-5 text-[9px]" : "w-7 h-7 text-xs";

  const content = (
    <span className="inline-flex items-center gap-1.5 group">
      {showAvatar && (
        <span
          className={`${avatarSize} rounded-md flex items-center justify-center font-bold text-white shrink-0`}
          style={{ backgroundColor: color }}
        >
          {(profile?.displayName ?? wallet)[0].toUpperCase()}
        </span>
      )}
      <span className={`${size === "sm" ? "text-xs" : "text-sm"} ${link ? "group-hover:text-emerald-400 transition" : ""}`}>
        {name}
      </span>
    </span>
  );

  if (link) {
    return (
      <Link
        href={`/u/${wallet}`}
        className="inline-flex"
      >
        {content}
      </Link>
    );
  }

  return content;
}
