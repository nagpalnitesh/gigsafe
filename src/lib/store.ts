/**
 * Server-side JSON file store for GigSafe.
 * Replaces localStorage for gig metadata, reviews, and file references.
 * 
 * Data is stored in /data directory as JSON files.
 * This is a hackathon-grade solution — in production, use a proper DB.
 */

import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJSON<T>(filename: string): Promise<T | null> {
  try {
    const filepath = path.join(DATA_DIR, filename);
    const raw = await fs.readFile(filepath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeJSON<T>(filename: string, data: T): Promise<void> {
  await ensureDir();
  const filepath = path.join(DATA_DIR, filename);
  await fs.writeFile(filepath, JSON.stringify(data, null, 2), "utf-8");
}

// ============================================================
// Gig Metadata (descriptions, milestone names)
// ============================================================

export interface GigMetadataStore {
  description?: string;
  milestoneNames?: string[];
  createdBy?: string;
  updatedAt?: number;
}

export async function getGigMetadata(gigPda: string): Promise<GigMetadataStore | null> {
  const store = await readJSON<Record<string, GigMetadataStore>>("metadata.json");
  return store?.[gigPda] ?? null;
}

export async function saveGigMetadata(gigPda: string, meta: GigMetadataStore): Promise<void> {
  const store = (await readJSON<Record<string, GigMetadataStore>>("metadata.json")) ?? {};
  store[gigPda] = { ...store[gigPda], ...meta, updatedAt: Date.now() };
  await writeJSON("metadata.json", store);
}

export async function getAllGigMetadata(): Promise<Record<string, GigMetadataStore>> {
  return (await readJSON<Record<string, GigMetadataStore>>("metadata.json")) ?? {};
}

// ============================================================
// Reviews & Reputation
// ============================================================

export interface ReviewStore {
  gigPda: string;
  gigTitle: string;
  reviewer: string;
  reviewerRole: "client" | "freelancer";
  rating: number;
  comment: string;
  timestamp: number;
}

export async function getReviews(walletAddress: string): Promise<ReviewStore[]> {
  const store = (await readJSON<Record<string, ReviewStore[]>>("reviews.json")) ?? {};
  return store[walletAddress] ?? [];
}

export async function submitReview(walletAddress: string, review: ReviewStore): Promise<void> {
  const store = (await readJSON<Record<string, ReviewStore[]>>("reviews.json")) ?? {};
  if (!store[walletAddress]) {
    store[walletAddress] = [];
  }
  // Prevent duplicate reviews for same gig from same reviewer
  const existing = store[walletAddress].findIndex(
    (r) => r.gigPda === review.gigPda && r.reviewer === review.reviewer
  );
  if (existing >= 0) {
    store[walletAddress][existing] = review;
  } else {
    store[walletAddress].push(review);
  }
  await writeJSON("reviews.json", store);
}

export async function hasReviewed(walletAddress: string, gigPda: string, reviewer: string): Promise<boolean> {
  const reviews = await getReviews(walletAddress);
  return reviews.some((r) => r.gigPda === gigPda && r.reviewer === reviewer);
}

export async function getReputation(walletAddress: string) {
  const reviews = await getReviews(walletAddress);
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  return {
    reviews,
    averageRating: reviews.length > 0 ? totalRating / reviews.length : 0,
    totalGigs: reviews.length,
  };
}

// ============================================================
// User Profiles
// ============================================================

export interface UserProfile {
  wallet: string;
  displayName?: string;
  bio?: string;
  avatar?: string; // URL or base64
  skills?: string[];
  twitter?: string;
  github?: string;
  website?: string;
  updatedAt?: number;
}

export async function getProfile(wallet: string): Promise<UserProfile | null> {
  const store = (await readJSON<Record<string, UserProfile>>("profiles.json")) ?? {};
  return store[wallet] ?? null;
}

export async function saveProfile(wallet: string, profile: Partial<UserProfile>): Promise<void> {
  const store = (await readJSON<Record<string, UserProfile>>("profiles.json")) ?? {};
  store[wallet] = { ...store[wallet], ...profile, wallet, updatedAt: Date.now() };
  await writeJSON("profiles.json", store);
}

export async function getAllProfiles(): Promise<Record<string, UserProfile>> {
  return (await readJSON<Record<string, UserProfile>>("profiles.json")) ?? {};
}

// ============================================================
// Notifications
// ============================================================

export interface Notification {
  id: string;
  wallet: string;
  type: "gig_created" | "gig_accepted" | "milestone_submitted" | "milestone_approved" | "dispute_raised" | "dispute_resolved" | "gig_cancelled" | "review_received";
  title: string;
  message: string;
  gigPda?: string;
  gigTitle?: string;
  read: boolean;
  createdAt: number;
}

export async function getNotifications(wallet: string): Promise<Notification[]> {
  const store = (await readJSON<Record<string, Notification[]>>("notifications.json")) ?? {};
  return (store[wallet] ?? []).sort((a, b) => b.createdAt - a.createdAt);
}

export async function addNotification(wallet: string, notif: Omit<Notification, "id" | "read" | "createdAt">): Promise<void> {
  const store = (await readJSON<Record<string, Notification[]>>("notifications.json")) ?? {};
  if (!store[wallet]) store[wallet] = [];
  store[wallet].push({
    ...notif,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    read: false,
    createdAt: Date.now(),
  });
  // Keep only last 50 notifications per wallet
  if (store[wallet].length > 50) {
    store[wallet] = store[wallet].slice(-50);
  }
  await writeJSON("notifications.json", store);
}

export async function markNotificationsRead(wallet: string, ids?: string[]): Promise<void> {
  const store = (await readJSON<Record<string, Notification[]>>("notifications.json")) ?? {};
  if (!store[wallet]) return;
  store[wallet] = store[wallet].map((n) => {
    if (!ids || ids.includes(n.id)) return { ...n, read: true };
    return n;
  });
  await writeJSON("notifications.json", store);
}

export async function getUnreadCount(wallet: string): Promise<number> {
  const notifs = await getNotifications(wallet);
  return notifs.filter((n) => !n.read).length;
}

// ============================================================
// Messaging (per-gig chat)
// ============================================================

export interface ChatMessage {
  id: string;
  gigPda: string;
  sender: string; // wallet address
  message: string;
  timestamp: number;
}

export async function getMessages(gigPda: string): Promise<ChatMessage[]> {
  const store = (await readJSON<Record<string, ChatMessage[]>>("messages.json")) ?? {};
  return (store[gigPda] ?? []).sort((a, b) => a.timestamp - b.timestamp);
}

export async function addMessage(gigPda: string, msg: Omit<ChatMessage, "id" | "timestamp">): Promise<ChatMessage> {
  const store = (await readJSON<Record<string, ChatMessage[]>>("messages.json")) ?? {};
  if (!store[gigPda]) store[gigPda] = [];
  const chatMsg: ChatMessage = {
    ...msg,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
  };
  store[gigPda].push(chatMsg);
  // Keep last 200 messages per gig
  if (store[gigPda].length > 200) {
    store[gigPda] = store[gigPda].slice(-200);
  }
  await writeJSON("messages.json", store);
  return chatMsg;
}

export async function getMessageCount(gigPda: string): Promise<number> {
  const msgs = await getMessages(gigPda);
  return msgs.length;
}

// ============================================================
// File references (track uploaded deliverables)
// ============================================================

export interface FileRef {
  filename: string;
  originalName: string;
  size: number;
  type: string;
  url: string;
  milestoneIndex: number;
  uploadedAt: number;
  uploadedBy?: string;
}

export async function getGigFiles(gigPda: string): Promise<FileRef[]> {
  const store = (await readJSON<Record<string, FileRef[]>>("files.json")) ?? {};
  return store[gigPda] ?? [];
}

export async function addGigFile(gigPda: string, file: FileRef): Promise<void> {
  const store = (await readJSON<Record<string, FileRef[]>>("files.json")) ?? {};
  if (!store[gigPda]) {
    store[gigPda] = [];
  }
  store[gigPda].push(file);
  await writeJSON("files.json", store);
}
