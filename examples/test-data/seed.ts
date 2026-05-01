/**
 * Seed script — populates the database with demo data.
 * Usage: bun run examples/test-data/seed.ts
 */

const BASE = process.env.BASE_URL || "http://127.0.0.1:3001";

async function post(endpoint: string, data: any) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function main() {
  console.log("🌱 Seeding GigSafe demo data...\n");

  // Seed profiles
  const profiles = require("./seed-profiles.json");
  console.log(`👤 Seeding ${profiles.length} profiles...`);
  for (const p of profiles) {
    await post("/api/profile", p);
    console.log(`  ✓ ${p.displayName}`);
  }

  // Seed gig metadata
  const gigs = require("./seed-gigs.json");
  console.log(`\n📦 Seeding ${gigs.length} gig metadata...`);
  for (let i = 0; i < gigs.length; i++) {
    const gig = gigs[i];
    const gigPda = `demo-gig-${String(i + 1).padStart(3, "0")}`;
    await post("/api/metadata", {
      gigPda,
      description: gig.description,
      milestoneNames: gig.milestones.map((m: any) => m.name),
      category: gig.category,
      createdBy: "client-demo-wallet-001",
    });
    console.log(`  ✓ ${gig.title}`);
  }

  // Seed reviews
  const reviews = require("./seed-reviews.json");
  console.log(`\n⭐ Seeding ${reviews.length} reviews...`);
  for (const r of reviews) {
    await post("/api/reviews", r);
    console.log(`  ✓ Review for ${r.walletAddress} on ${r.review.gigTitle}`);
  }

  // Seed some activity
  console.log("\n📊 Seeding activity feed...");
  const activities = [
    { type: "gig_created", title: "New Gig Posted", description: "Landing Page for SaaS Startup", gigPda: "demo-gig-001", gigTitle: "Landing Page", actor: "client-demo-wallet-001", amount: 200 },
    { type: "gig_accepted", title: "Gig Accepted", description: "Priya accepted the gig", gigPda: "demo-gig-001", gigTitle: "Landing Page", actor: "freelancer-demo-wallet-001" },
    { type: "milestone_approved", title: "Milestone Approved", description: "Design Mockups approved. 50 USDC released.", gigPda: "demo-gig-001", gigTitle: "Landing Page", actor: "client-demo-wallet-001", amount: 50 },
    { type: "gig_created", title: "New Gig Posted", description: "Smart Contract Security Audit", gigPda: "demo-gig-002", gigTitle: "Security Audit", actor: "client-demo-wallet-001", amount: 1000 },
    { type: "review_received", title: "New Review ⭐", description: "5-star review on Landing Page gig", gigPda: "demo-gig-001", actor: "freelancer-demo-wallet-001" },
  ];
  for (const a of activities) {
    await post("/api/activity", a);
    console.log(`  ✓ ${a.title}`);
  }

  // Seed some messages
  console.log("\n💬 Seeding messages...");
  const messages = [
    { gigPda: "demo-gig-001", sender: "client-demo-wallet-001", message: "Hey Priya! Welcome to the project. Here's the Figma link: figma.com/..." },
    { gigPda: "demo-gig-001", sender: "freelancer-demo-wallet-001", message: "Thanks Alex! I've reviewed the designs. Starting on the mockups today. Should have v1 by Thursday." },
    { gigPda: "demo-gig-001", sender: "client-demo-wallet-001", message: "Sounds great! Let me know if you need any brand assets." },
    { gigPda: "demo-gig-001", sender: "freelancer-demo-wallet-001", message: "Mockups are ready! Uploaded to milestone 1. Take a look when you get a chance." },
  ];
  for (const m of messages) {
    await post("/api/messages", m);
    console.log(`  ✓ Message from ${m.sender.slice(0, 10)}...`);
  }

  // Seed notifications
  console.log("\n🔔 Seeding notifications...");
  const notifs = [
    { wallet: "client-demo-wallet-001", type: "gig_accepted", title: "Gig Accepted! 🎉", message: "Priya accepted your Landing Page gig.", gigPda: "demo-gig-001", gigTitle: "Landing Page" },
    { wallet: "client-demo-wallet-001", type: "milestone_submitted", title: "Milestone Submitted", message: "Design Mockups submitted for review.", gigPda: "demo-gig-001", gigTitle: "Landing Page" },
    { wallet: "freelancer-demo-wallet-001", type: "milestone_approved", title: "Milestone Approved! 💰", message: "Design Mockups approved. 50.00 USDC sent.", gigPda: "demo-gig-001", gigTitle: "Landing Page" },
  ];
  for (const n of notifs) {
    await post("/api/notifications", n);
    console.log(`  ✓ ${n.title}`);
  }

  console.log("\n✅ Seeding complete!");
  console.log(`  ${profiles.length} profiles`);
  console.log(`  ${gigs.length} gig metadata`);
  console.log(`  ${reviews.length} reviews`);
  console.log(`  ${activities.length} activities`);
  console.log(`  ${messages.length} messages`);
  console.log(`  ${notifs.length} notifications`);
}

main().catch(console.error);
