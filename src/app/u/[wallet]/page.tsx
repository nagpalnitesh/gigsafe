"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  Star,
  ExternalLink,
  Loader2,
  Briefcase,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { fetchProfile, UserProfile, getAvatarColor } from "@/lib/profile";
import { fetchReputation, WalletReputation } from "@/lib/reputation";

export default function PublicProfilePage() {
  const params = useParams();
  const wallet = params.wallet as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [rep, setRep] = useState<WalletReputation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wallet) return;
    setLoading(true);
    Promise.all([fetchProfile(wallet), fetchReputation(wallet)])
      .then(([p, r]) => {
        setProfile(p);
        setRep(r);
      })
      .finally(() => setLoading(false));
  }, [wallet]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  const name = profile?.displayName || `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
  const color = getAvatarColor(wallet);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Profile Header */}
        <div className="flex items-start gap-5 mb-8">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shrink-0"
            style={{ backgroundColor: color }}
          >
            {name[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{name}</h1>
            <p className="text-sm text-gray-500 font-mono mt-0.5">
              {wallet.slice(0, 12)}...{wallet.slice(-8)}
            </p>
            {rep && rep.totalGigs > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-semibold text-yellow-400">
                  {rep.averageRating.toFixed(1)}
                </span>
                <span className="text-xs text-gray-500">
                  ({rep.totalGigs} review{rep.totalGigs !== 1 ? "s" : ""})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile?.bio && (
          <p className="text-sm text-gray-300 leading-relaxed mb-6">
            {profile.bio}
          </p>
        )}

        {/* Skills */}
        {profile?.skills && profile.skills.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Social Links */}
        {(profile?.twitter || profile?.github || profile?.website) && (
          <div className="mb-8 space-y-2">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-2">Links</h3>
            {profile?.twitter && (
              <a
                href={`https://x.com/${profile.twitter.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
              >
                <MessageSquare className="w-4 h-4" />
                @{profile.twitter.replace("@", "")}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {profile?.github && (
              <a
                href={`https://github.com/${profile.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
              >
                <Briefcase className="w-4 h-4" />
                {profile.github}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {profile?.website && (
              <a
                href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
              >
                <ExternalLink className="w-4 h-4" />
                {profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>
        )}

        {/* Reviews */}
        {rep && rep.reviews.length > 0 && (
          <div>
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">
              Reviews ({rep.totalGigs})
            </h3>
            <div className="space-y-3">
              {rep.reviews.map((review, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/5"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= review.rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      {review.reviewerRole === "client" ? "From client" : "From freelancer"}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-300">{review.comment}</p>
                  )}
                  <Link
                    href={`/gig/${review.gigPda}`}
                    className="text-xs text-emerald-400 hover:underline mt-1 inline-block"
                  >
                    {review.gigTitle}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explorer link */}
        <div className="mt-8 p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <a
            href={`https://explorer.solana.com/address/${wallet}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-emerald-400 hover:underline"
          >
            <User className="w-4 h-4" />
            View on Solana Explorer
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </motion.div>
    </div>
  );
}
