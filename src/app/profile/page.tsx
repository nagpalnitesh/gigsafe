"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  User,
  Save,
  Loader2,
  Shield,
  ExternalLink,
  Star,
  X,
  Plus,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import {
  fetchProfile,
  saveProfile,
  UserProfile,
  getAvatarColor,
} from "@/lib/profile";
import { fetchReputation, WalletReputation } from "@/lib/reputation";

export default function ProfilePage() {
  const { connected, publicKey } = useWallet();
  const toast = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [rep, setRep] = useState<WalletReputation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [twitter, setTwitter] = useState("");
  const [github, setGithub] = useState("");
  const [website, setWebsite] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  const wallet = publicKey?.toString() ?? "";

  useEffect(() => {
    if (!wallet) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([fetchProfile(wallet), fetchReputation(wallet)])
      .then(([p, r]) => {
        setProfile(p);
        setRep(r);
        setDisplayName(p.displayName ?? "");
        setBio(p.bio ?? "");
        setTwitter(p.twitter ?? "");
        setGithub(p.github ?? "");
        setWebsite(p.website ?? "");
        setSkills(p.skills ?? []);
      })
      .finally(() => setLoading(false));
  }, [wallet]);

  const handleSave = async () => {
    if (!wallet) return;
    setSaving(true);

    const success = await saveProfile({
      wallet,
      displayName: displayName.trim() || undefined,
      bio: bio.trim() || undefined,
      twitter: twitter.trim() || undefined,
      github: github.trim() || undefined,
      website: website.trim() || undefined,
      skills: skills.length > 0 ? skills : undefined,
    });

    if (success) {
      toast.success("Profile saved! 🎉");
    } else {
      toast.error("Failed to save profile");
    }
    setSaving(false);
  };

  const addSkill = () => {
    const skill = newSkill.trim();
    if (skill && skills.length < 10 && !skills.includes(skill)) {
      setSkills([...skills, skill]);
      setNewSkill("");
    }
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  if (!connected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Your Profile</h1>
        <p className="text-gray-400 mb-6">
          Connect your wallet to set up your profile
        </p>
        <WalletMultiButton className="!bg-emerald-500 hover:!bg-emerald-600 !rounded-lg !text-black" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  const avatarColor = getAvatarColor(wallet);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0"
            style={{ backgroundColor: avatarColor }}
          >
            {displayName ? displayName[0].toUpperCase() : wallet.slice(0, 2)}
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {displayName || "Set up your profile"}
            </h1>
            <p className="text-sm text-gray-500 font-mono">
              {wallet.slice(0, 8)}...{wallet.slice(-8)}
            </p>
            {rep && rep.totalGigs > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span className="text-sm text-yellow-400">
                  {rep.averageRating.toFixed(1)}
                </span>
                <span className="text-xs text-gray-500">
                  ({rep.totalGigs} review{rep.totalGigs !== 1 ? "s" : ""})
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Display Name */}
          <div>
            <label className="text-sm text-gray-400 block mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., Alex Chen"
              maxLength={50}
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="text-sm text-gray-400 block mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people about yourself and your work..."
              rows={3}
              maxLength={280}
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none text-sm resize-none"
            />
            <p className="text-xs text-gray-600 mt-1 text-right">
              {bio.length}/280
            </p>
          </div>

          {/* Skills */}
          <div>
            <label className="text-sm text-gray-400 block mb-2">
              Skills (up to 10)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {skills.map((skill, i) => (
                <motion.span
                  key={skill}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm"
                >
                  {skill}
                  <button
                    onClick={() => removeSkill(i)}
                    className="text-emerald-400/50 hover:text-red-400 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.span>
              ))}
            </div>
            {skills.length < 10 && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSkill()}
                  placeholder="Add a skill..."
                  maxLength={30}
                  className="flex-1 p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none"
                />
                <button
                  onClick={addSkill}
                  disabled={!newSkill.trim()}
                  className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-emerald-400 hover:border-emerald-500/30 transition disabled:opacity-30"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            <label className="text-sm text-gray-400 block">Links</label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-sm text-gray-500 sm:w-20">Twitter</span>
              <input
                type="text"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="@username"
                className="flex-1 p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-sm text-gray-500 sm:w-20">GitHub</span>
              <input
                type="text"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="username"
                className="flex-1 p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-sm text-gray-500 sm:w-20">Website</span>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                className="flex-1 p-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-800 text-black font-semibold transition flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" /> Save Profile
              </>
            )}
          </button>
        </div>

        {/* Wallet Info */}
        <div className="mt-8 p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <User className="w-4 h-4" />
            <span className="font-mono text-xs">{wallet}</span>
          </div>
          <a
            href={`https://explorer.solana.com/address/${wallet}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline mt-2"
          >
            View on Explorer <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </motion.div>
    </div>
  );
}
