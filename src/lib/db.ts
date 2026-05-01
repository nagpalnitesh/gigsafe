/**
 * SQLite database layer for GigSafe.
 * Replaces JSON file store with proper database.
 * 
 * Uses better-sqlite3 for synchronous, fast SQLite access.
 * Data stored in /data/gigsafe.db
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "gigsafe.db");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Singleton database connection
let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL"); // Better concurrent read performance
    _db.pragma("foreign_keys = ON");
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS gig_metadata (
      gig_pda TEXT PRIMARY KEY,
      description TEXT,
      milestone_names TEXT, -- JSON array
      category TEXT,
      created_by TEXT,
      created_at INTEGER DEFAULT (unixepoch() * 1000),
      updated_at INTEGER DEFAULT (unixepoch() * 1000)
    );

    CREATE TABLE IF NOT EXISTS profiles (
      wallet TEXT PRIMARY KEY,
      display_name TEXT,
      bio TEXT,
      avatar TEXT,
      skills TEXT, -- JSON array
      twitter TEXT,
      github TEXT,
      website TEXT,
      created_at INTEGER DEFAULT (unixepoch() * 1000),
      updated_at INTEGER DEFAULT (unixepoch() * 1000)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_address TEXT NOT NULL, -- who is being reviewed
      gig_pda TEXT NOT NULL,
      gig_title TEXT,
      reviewer TEXT NOT NULL,
      reviewer_role TEXT CHECK(reviewer_role IN ('client', 'freelancer')),
      rating INTEGER CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at INTEGER DEFAULT (unixepoch() * 1000),
      UNIQUE(wallet_address, gig_pda, reviewer)
    );
    CREATE INDEX IF NOT EXISTS idx_reviews_wallet ON reviews(wallet_address);

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      wallet TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      gig_pda TEXT,
      gig_title TEXT,
      read INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch() * 1000)
    );
    CREATE INDEX IF NOT EXISTS idx_notifications_wallet ON notifications(wallet);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(wallet, read);

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      gig_pda TEXT NOT NULL,
      sender TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch() * 1000)
    );
    CREATE INDEX IF NOT EXISTS idx_messages_gig ON messages(gig_pda);

    CREATE TABLE IF NOT EXISTS activity_feed (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      gig_pda TEXT,
      gig_title TEXT,
      actor TEXT, -- wallet that did the action
      amount REAL,
      created_at INTEGER DEFAULT (unixepoch() * 1000)
    );
    CREATE INDEX IF NOT EXISTS idx_activity_time ON activity_feed(created_at DESC);

    CREATE TABLE IF NOT EXISTS bids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gig_pda TEXT NOT NULL,
      bidder TEXT NOT NULL,
      amount REAL NOT NULL, -- proposed total in USDC
      message TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
      created_at INTEGER DEFAULT (unixepoch() * 1000),
      UNIQUE(gig_pda, bidder)
    );
    CREATE INDEX IF NOT EXISTS idx_bids_gig ON bids(gig_pda);
    CREATE INDEX IF NOT EXISTS idx_bids_bidder ON bids(bidder);

    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gig_pda TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT,
      size INTEGER,
      type TEXT,
      url TEXT,
      milestone_index INTEGER,
      uploaded_by TEXT,
      created_at INTEGER DEFAULT (unixepoch() * 1000)
    );
    CREATE INDEX IF NOT EXISTS idx_files_gig ON files(gig_pda);
  `);
}

// ============================================================
// Gig Metadata
// ============================================================

export function dbGetMetadata(gigPda: string) {
  const row = getDb().prepare("SELECT * FROM gig_metadata WHERE gig_pda = ?").get(gigPda) as any;
  if (!row) return null;
  return {
    description: row.description,
    milestoneNames: row.milestone_names ? JSON.parse(row.milestone_names) : undefined,
    category: row.category,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
  };
}

export function dbSaveMetadata(gigPda: string, meta: { description?: string; milestoneNames?: string[]; category?: string; createdBy?: string }) {
  const db = getDb();
  db.prepare(`
    INSERT INTO gig_metadata (gig_pda, description, milestone_names, category, created_by, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(gig_pda) DO UPDATE SET
      description = COALESCE(excluded.description, gig_metadata.description),
      milestone_names = COALESCE(excluded.milestone_names, gig_metadata.milestone_names),
      category = COALESCE(excluded.category, gig_metadata.category),
      created_by = COALESCE(excluded.created_by, gig_metadata.created_by),
      updated_at = excluded.updated_at
  `).run(
    gigPda,
    meta.description ?? null,
    meta.milestoneNames ? JSON.stringify(meta.milestoneNames) : null,
    meta.category ?? null,
    meta.createdBy ?? null,
    Date.now()
  );
}

export function dbGetAllMetadata(): Record<string, any> {
  const rows = getDb().prepare("SELECT * FROM gig_metadata").all() as any[];
  const result: Record<string, any> = {};
  for (const row of rows) {
    result[row.gig_pda] = {
      description: row.description,
      milestoneNames: row.milestone_names ? JSON.parse(row.milestone_names) : undefined,
      category: row.category,
      createdBy: row.created_by,
      updatedAt: row.updated_at,
    };
  }
  return result;
}

// ============================================================
// Profiles
// ============================================================

export function dbGetProfile(wallet: string) {
  const row = getDb().prepare("SELECT * FROM profiles WHERE wallet = ?").get(wallet) as any;
  if (!row) return null;
  return {
    wallet: row.wallet,
    displayName: row.display_name,
    bio: row.bio,
    avatar: row.avatar,
    skills: row.skills ? JSON.parse(row.skills) : undefined,
    twitter: row.twitter,
    github: row.github,
    website: row.website,
    updatedAt: row.updated_at,
  };
}

export function dbSaveProfile(wallet: string, profile: {
  displayName?: string; bio?: string; avatar?: string;
  skills?: string[]; twitter?: string; github?: string; website?: string;
}) {
  const db = getDb();
  db.prepare(`
    INSERT INTO profiles (wallet, display_name, bio, avatar, skills, twitter, github, website, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(wallet) DO UPDATE SET
      display_name = COALESCE(excluded.display_name, profiles.display_name),
      bio = COALESCE(excluded.bio, profiles.bio),
      avatar = COALESCE(excluded.avatar, profiles.avatar),
      skills = COALESCE(excluded.skills, profiles.skills),
      twitter = COALESCE(excluded.twitter, profiles.twitter),
      github = COALESCE(excluded.github, profiles.github),
      website = COALESCE(excluded.website, profiles.website),
      updated_at = excluded.updated_at
  `).run(
    wallet,
    profile.displayName ?? null,
    profile.bio ?? null,
    profile.avatar ?? null,
    profile.skills ? JSON.stringify(profile.skills) : null,
    profile.twitter ?? null,
    profile.github ?? null,
    profile.website ?? null,
    Date.now()
  );
}

// ============================================================
// Reviews
// ============================================================

export function dbGetReviews(wallet: string) {
  return getDb().prepare(`
    SELECT * FROM reviews WHERE wallet_address = ? ORDER BY created_at DESC
  `).all(wallet) as any[];
}

export function dbSubmitReview(walletAddress: string, review: {
  gigPda: string; gigTitle: string; reviewer: string;
  reviewerRole: string; rating: number; comment: string;
}) {
  getDb().prepare(`
    INSERT INTO reviews (wallet_address, gig_pda, gig_title, reviewer, reviewer_role, rating, comment, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(wallet_address, gig_pda, reviewer) DO UPDATE SET
      rating = excluded.rating, comment = excluded.comment, created_at = excluded.created_at
  `).run(
    walletAddress, review.gigPda, review.gigTitle,
    review.reviewer, review.reviewerRole, review.rating,
    review.comment, Date.now()
  );
}

export function dbHasReviewed(walletAddress: string, gigPda: string, reviewer: string): boolean {
  const row = getDb().prepare(
    "SELECT 1 FROM reviews WHERE wallet_address = ? AND gig_pda = ? AND reviewer = ?"
  ).get(walletAddress, gigPda, reviewer);
  return !!row;
}

export function dbGetReputation(wallet: string) {
  const reviews = dbGetReviews(wallet);
  const totalRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0);
  return {
    reviews: reviews.map((r: any) => ({
      gigPda: r.gig_pda, gigTitle: r.gig_title, reviewer: r.reviewer,
      reviewerRole: r.reviewer_role, rating: r.rating, comment: r.comment,
      timestamp: r.created_at,
    })),
    averageRating: reviews.length > 0 ? totalRating / reviews.length : 0,
    totalGigs: reviews.length,
  };
}

// ============================================================
// Notifications
// ============================================================

export function dbGetNotifications(wallet: string, limit = 50) {
  return getDb().prepare(`
    SELECT * FROM notifications WHERE wallet = ? ORDER BY created_at DESC LIMIT ?
  `).all(wallet, limit) as any[];
}

export function dbAddNotification(wallet: string, notif: {
  type: string; title: string; message: string; gigPda?: string; gigTitle?: string;
}) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  getDb().prepare(`
    INSERT INTO notifications (id, wallet, type, title, message, gig_pda, gig_title, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, wallet, notif.type, notif.title, notif.message, notif.gigPda ?? null, notif.gigTitle ?? null, Date.now());
  
  // Prune old notifications (keep last 100 per wallet)
  getDb().prepare(`
    DELETE FROM notifications WHERE wallet = ? AND id NOT IN (
      SELECT id FROM notifications WHERE wallet = ? ORDER BY created_at DESC LIMIT 100
    )
  `).run(wallet, wallet);
}

export function dbMarkNotificationsRead(wallet: string, ids?: string[]) {
  if (ids && ids.length > 0) {
    const placeholders = ids.map(() => "?").join(",");
    getDb().prepare(`UPDATE notifications SET read = 1 WHERE wallet = ? AND id IN (${placeholders})`).run(wallet, ...ids);
  } else {
    getDb().prepare("UPDATE notifications SET read = 1 WHERE wallet = ?").run(wallet);
  }
}

export function dbGetUnreadCount(wallet: string): number {
  const row = getDb().prepare("SELECT COUNT(*) as count FROM notifications WHERE wallet = ? AND read = 0").get(wallet) as any;
  return row?.count ?? 0;
}

// ============================================================
// Messages
// ============================================================

export function dbGetMessages(gigPda: string, limit = 200) {
  return getDb().prepare(`
    SELECT * FROM messages WHERE gig_pda = ? ORDER BY created_at ASC LIMIT ?
  `).all(gigPda, limit) as any[];
}

export function dbAddMessage(gigPda: string, sender: string, message: string) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  getDb().prepare(`
    INSERT INTO messages (id, gig_pda, sender, message, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, gigPda, sender, message, Date.now());
  return { id, gigPda, sender, message, timestamp: Date.now() };
}

// ============================================================
// Activity Feed
// ============================================================

export function dbGetActivityFeed(limit = 50) {
  return getDb().prepare(
    "SELECT * FROM activity_feed ORDER BY created_at DESC LIMIT ?"
  ).all(limit) as any[];
}

export function dbAddActivity(activity: {
  type: string; title: string; description?: string;
  gigPda?: string; gigTitle?: string; actor?: string; amount?: number;
}) {
  getDb().prepare(`
    INSERT INTO activity_feed (type, title, description, gig_pda, gig_title, actor, amount, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    activity.type, activity.title, activity.description ?? null,
    activity.gigPda ?? null, activity.gigTitle ?? null,
    activity.actor ?? null, activity.amount ?? null, Date.now()
  );
  
  // Keep only last 500 entries
  getDb().prepare(`
    DELETE FROM activity_feed WHERE id NOT IN (
      SELECT id FROM activity_feed ORDER BY created_at DESC LIMIT 500
    )
  `).run();
}

// ============================================================
// Bids
// ============================================================

export function dbGetBids(gigPda: string) {
  return getDb().prepare(
    "SELECT * FROM bids WHERE gig_pda = ? ORDER BY created_at DESC"
  ).all(gigPda) as any[];
}

export function dbGetBidsByBidder(bidder: string) {
  return getDb().prepare(
    "SELECT * FROM bids WHERE bidder = ? ORDER BY created_at DESC"
  ).all(bidder) as any[];
}

export function dbSubmitBid(gigPda: string, bidder: string, amount: number, message?: string) {
  getDb().prepare(`
    INSERT INTO bids (gig_pda, bidder, amount, message, created_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(gig_pda, bidder) DO UPDATE SET
      amount = excluded.amount, message = excluded.message,
      status = 'pending', created_at = excluded.created_at
  `).run(gigPda, bidder, amount, message ?? null, Date.now());
}

export function dbUpdateBidStatus(gigPda: string, bidder: string, status: string) {
  getDb().prepare(
    "UPDATE bids SET status = ? WHERE gig_pda = ? AND bidder = ?"
  ).run(status, gigPda, bidder);
}

export function dbGetBidCount(gigPda: string): number {
  const row = getDb().prepare(
    "SELECT COUNT(*) as count FROM bids WHERE gig_pda = ? AND status = 'pending'"
  ).get(gigPda) as any;
  return row?.count ?? 0;
}

// ============================================================
// Files
// ============================================================

export function dbGetFiles(gigPda: string) {
  return getDb().prepare("SELECT * FROM files WHERE gig_pda = ? ORDER BY created_at ASC").all(gigPda) as any[];
}

export function dbAddFile(gigPda: string, file: {
  filename: string; originalName: string; size: number;
  type: string; url: string; milestoneIndex: number; uploadedBy?: string;
}) {
  getDb().prepare(`
    INSERT INTO files (gig_pda, filename, original_name, size, type, url, milestone_index, uploaded_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(gigPda, file.filename, file.originalName, file.size, file.type, file.url, file.milestoneIndex, file.uploadedBy ?? null, Date.now());
}
