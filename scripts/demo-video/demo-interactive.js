/**
 * GigSafe Interactive Demo — Full Product Walkthrough
 * Shows every major flow with realistic user interactions
 */

const puppeteer = require("puppeteer");

const BASE_URL = "https://gigsafe.wildsnap.in";
const VIEWPORT = { width: 1920, height: 1080 };

// Helpers
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function smoothScroll(page, targetY, duration = 1500) {
  const startY = await page.evaluate(() => window.scrollY);
  const distance = targetY - startY;
  const steps = Math.floor(duration / 16);
  for (let i = 0; i <= steps; i++) {
    const p = i / steps;
    const eased = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
    await page.evaluate((y) => window.scrollTo(0, y), startY + distance * eased);
    await wait(16);
  }
}

async function showCaption(page, text, duration = 3500, style = "normal") {
  const colors = {
    normal: { bg: "rgba(0,0,0,0.85)", border: "rgba(255,255,255,0.15)", color: "white" },
    green: { bg: "rgba(16,185,129,0.9)", border: "rgba(16,185,129,0.5)", color: "white" },
    orange: { bg: "rgba(249,115,22,0.9)", border: "rgba(249,115,22,0.5)", color: "white" },
    blue: { bg: "rgba(59,130,246,0.9)", border: "rgba(59,130,246,0.5)", color: "white" },
  };
  const c = colors[style] || colors.normal;

  await page.evaluate((t, c) => {
    const existing = document.getElementById("demo-caption");
    if (existing) existing.remove();
    const div = document.createElement("div");
    div.id = "demo-caption";
    div.style.cssText = `
      position: fixed; bottom: 50px; left: 50%; transform: translateX(-50%);
      background: ${c.bg}; color: ${c.color}; padding: 14px 36px;
      border-radius: 32px; font-size: 24px; font-family: 'SF Mono', monospace;
      z-index: 999999; border: 1px solid ${c.border};
      backdrop-filter: blur(16px); max-width: 75%; text-align: center;
      box-shadow: 0 8px 32px rgba(0,0,0,0.6);
      animation: fadeIn 0.3s ease;
    `;
    const style = document.createElement("style");
    style.textContent = "@keyframes fadeIn { from { opacity:0; transform: translateX(-50%) translateY(10px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }";
    document.head.appendChild(style);
    div.textContent = t;
    document.body.appendChild(div);
  }, text, c);

  await wait(duration);
  await page.evaluate(() => {
    const el = document.getElementById("demo-caption");
    if (el) { el.style.transition = "opacity 0.3s"; el.style.opacity = "0"; setTimeout(() => el.remove(), 300); }
  });
  await wait(300);
}

async function showSceneTitle(page, title, subtitle = "") {
  await page.evaluate((t, s) => {
    const existing = document.getElementById("demo-scene");
    if (existing) existing.remove();
    const div = document.createElement("div");
    div.id = "demo-scene";
    div.style.cssText = `
      position: fixed; top: 30px; left: 30px;
      background: rgba(0,0,0,0.8); color: white; padding: 10px 20px;
      border-radius: 12px; font-family: monospace; z-index: 999999;
      border-left: 3px solid #10b981; backdrop-filter: blur(12px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    `;
    div.innerHTML = `<div style="font-size:14px;color:#10b981;font-weight:bold">${t}</div>${s ? `<div style="font-size:12px;color:#9ca3af;margin-top:2px">${s}</div>` : ''}`;
    document.body.appendChild(div);
  }, title, subtitle);
}

async function clearScene(page) {
  await page.evaluate(() => {
    document.getElementById("demo-scene")?.remove();
    document.getElementById("demo-caption")?.remove();
  });
}

async function typeInField(page, selector, text, delay = 60) {
  await page.waitForSelector(selector, { timeout: 5000 }).catch(() => {});
  await page.click(selector);
  await wait(300);
  await page.type(selector, text, { delay });
}

async function clickVisible(page, selector) {
  await page.waitForSelector(selector, { visible: true, timeout: 5000 }).catch(() => {});
  await page.click(selector);
}

async function main() {
  console.log("Launching browser...");

  const browser = await puppeteer.launch({
    headless: false,
    executablePath: "/usr/bin/chromium-browser",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
      "--start-maximized",
      "--disable-blink-features=AutomationControlled",
    ],
    defaultViewport: null,
  });

  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  try {
    // ╔═══════════════════════════════════════════════════════════════╗
    // SCENE 1: Landing Page — The Problem & Solution (20s)
    // ╚═══════════════════════════════════════════════════════════════╝
    console.log("Scene 1: Landing page...");
    await page.goto(BASE_URL, { waitUntil: "networkidle2", timeout: 20000 });
    await wait(1500);
    await showSceneTitle(page, "Scene 1: The Problem", "Why freelancers lose 20% to platforms");
    await showCaption(page, "Freelancers lose 20% on Upwork. Wait 2 weeks. Get nothing on disputes.", 4000);
    await smoothScroll(page, 400, 2000);
    await showCaption(page, "GigSafe: 0.5% fee. Instant payouts. AI disputes.", 3500, "green");
    await smoothScroll(page, 900, 2000);
    await showCaption(page, "How it works: Create gig → Fund escrow → Work → Approve → Get paid", 4000);
    await smoothScroll(page, 2000, 2000);
    await showCaption(page, "Comparison: GigSafe vs Upwork vs Fiverr", 3000, "orange");
    await wait(2000);
    await clearScene(page);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await wait(1000);

    // ╔═══════════════════════════════════════════════════════════════╗
    // SCENE 2: Faucet — Get Test USDC (10s)
    // ╚═══════════════════════════════════════════════════════════════╝
    console.log("Scene 2: Faucet...");
    await page.goto(`${BASE_URL}/faucet`, { waitUntil: "networkidle2", timeout: 15000 });
    await wait(1500);
    await showSceneTitle(page, "Scene 2: Get Test USDC", "Devnet faucet — free test tokens");
    await showCaption(page, "Connect wallet and get 1000 test USDC for free", 3000);
    await wait(2000);
    await showCaption(page, "Both client and freelancer need test USDC to demo", 3000, "blue");
    await wait(2000);
    await clearScene(page);

    // ╔═══════════════════════════════════════════════════════════════╗
    // SCENE 3: Browse Gigs (12s)
    // ╚═══════════════════════════════════════════════════════════════╝
    console.log("Scene 3: Browse gigs...");
    await page.goto(`${BASE_URL}/gigs`, { waitUntil: "networkidle2", timeout: 15000 });
    await wait(2000);
    await showSceneTitle(page, "Scene 3: Browse Open Gigs", "Find work. Get paid instantly. Keep 99.5%.");
    await showCaption(page, "Browse all open gigs from the Solana blockchain — live data", 3500);

    // Try to interact with search
    const searchInput = await page.$("input[placeholder*='Search']");
    if (searchInput) {
      await page.click("input[placeholder*='Search']");
      await wait(300);
      await page.type("input[placeholder*='Search']", "landing", { delay: 80 });
      await showCaption(page, "Search gigs by title or wallet address", 2500);
      await wait(500);
      // Clear search
      await page.click("input[placeholder*='Search']");
      await page.keyboard.down("Control");
      await page.keyboard.press("a");
      await page.keyboard.up("Control");
      await page.keyboard.press("Backspace");
    }

    // Show filter section
    const filterBtn = await page.$("button[class*=\"rounded\"][class*=\"border\"]");
    if (filterBtn) {
      await filterBtn.click();
      await wait(1000);
      await showCaption(page, "Filter by status (Open, Active, Completed) and category", 3000);
      await wait(1000);
      await filterBtn.click();
    }

    await smoothScroll(page, 400, 2000);
    await showCaption(page, "Each gig shows: budget, milestones, deadline, client", 3000);
    await wait(2000);
    await clearScene(page);

    // ╔═══════════════════════════════════════════════════════════════╗
    // SCENE 4: Create a Gig (20s)
    // ╚═══════════════════════════════════════════════════════════════╝
    console.log("Scene 4: Create gig...");
    await page.goto(`${BASE_URL}/create`, { waitUntil: "networkidle2", timeout: 15000 });
    await wait(2000);
    await showSceneTitle(page, "Scene 4: Create a Gig", "Client posts work with milestone payments");
    await showCaption(page, "Start from a template — AI pre-fills milestones, deadlines, amounts", 4000);
    await smoothScroll(page, 300, 1500);
    await wait(1000);

    // Click a template if available
    const templateBtn = await page.$("button.text-left");
    if (templateBtn) {
      await templateBtn.click();
      await wait(1500);
      await showCaption(page, "Template applied! Milestones auto-filled with suggested amounts", 3500, "green");
    }

    await smoothScroll(page, 600, 1500);
    await showCaption(page, "AI Risk Assessment: real-time analysis of your gig structure", 3000, "orange");
    await smoothScroll(page, 1000, 1500);
    await showCaption(page, "3 milestones: design → develop → launch. Total: 200 USDC", 3000);
    await smoothScroll(page, 1400, 1500);
    await showCaption(page, "Click 'Create Gig & Lock USDC' → 2 transactions: create + fund", 3500);
    await wait(1500);
    await clearScene(page);

    // ╔═══════════════════════════════════════════════════════════════╗
    // SCENE 5: Gig Detail — The Core Flow (20s)
    // ╚═══════════════════════════════════════════════════════════════╝
    console.log("Scene 5: Gig detail...");
    // Navigate to browse and click first gig
    await page.goto(`${BASE_URL}/gigs`, { waitUntil: "networkidle2", timeout: 15000 });
    await wait(2000);
    
    const gigCard = await page.$("a[href^='/gig/']");
    if (gigCard) {
      const href = await page.evaluate(el => el.getAttribute("href"), gigCard);
      await page.goto(`${BASE_URL}${href}`, { waitUntil: "networkidle2", timeout: 15000 });
      await wait(2000);
      await showSceneTitle(page, "Scene 5: Gig Detail", "Full milestone tracking — on-chain");
      await showCaption(page, "Gig detail: status, escrow balance, milestones progress", 3500);
      await smoothScroll(page, 300, 1500);
      await showCaption(page, "Client wallet, freelancer wallet — all verifiable on Solana Explorer", 3000);
      await smoothScroll(page, 600, 1500);
      await showCaption(page, "Milestone status: Pending → Submitted → Approved → Funds Released", 3500);
      await smoothScroll(page, 900, 1500);
      await showCaption(page, "Freelancer submits deliverable file → Client approves → USDC instant", 3500, "green");
      await smoothScroll(page, 1200, 1500);
      
      // Show chat section
      const chatHeader = await page.$("button:has(.w-4.h-4)");
      if (chatHeader) {
        await chatHeader.click();
        await wait(500);
        await showCaption(page, "Built-in messaging: client and freelancer communicate in-gig", 3000, "blue");
        await wait(1500);
      }
      await wait(1000);
    } else {
      // No gigs on chain — show create page instead
      await page.goto(`${BASE_URL}/create`, { waitUntil: "networkidle2", timeout: 15000 });
      await wait(2000);
      await showCaption(page, "No gigs on devnet right now — in production you'd see gig detail here", 3000);
    }
    await clearScene(page);

    // ╔═══════════════════════════════════════════════════════════════╗
    // SCENE 6: AI Dispute Resolution (15s)
    // ╚═══════════════════════════════════════════════════════════════╝
    console.log("Scene 6: AI Dispute Resolution...");
    if (gigCard) {
      const href = await page.evaluate(el => el.getAttribute("href"), gigCard);
      const gigId = href.split("/gig/")[1];
      await page.goto(`${BASE_URL}/gig/${gigId}/dispute`, { waitUntil: "networkidle2", timeout: 15000 });
      await wait(2000);
      await showSceneTitle(page, "Scene 6: AI Dispute Resolution", "Minutes. Not weeks.");
      await showCaption(page, "Either party raises a dispute. AI analyzes evidence from both sides.", 4000);
      await smoothScroll(page, 200, 1500);
      await showCaption(page, "Client submits: 'Work was incomplete...' — Freelancer submits: 'Changed requirements...'", 4000);
      await smoothScroll(page, 500, 1500);
      await showCaption(page, "AI ruling: 70% to freelancer / 30% refund to client — with reasoning", 4000, "orange");
      await smoothScroll(page, 700, 1500);
      await showCaption(page, "Execute on-chain: funds split automatically. No appeals. No weeks of waiting.", 4000, "green");
      await wait(2000);
    } else {
      // Show dispute UI from landing
      await page.goto(BASE_URL, { waitUntil: "networkidle2", timeout: 15000 });
      await smoothScroll(page, 3000, 2000);
      await showSceneTitle(page, "Scene 6: AI Dispute Resolution", "Minutes. Not weeks.");
      await showCaption(page, "Dispute → both submit evidence → AI analyzes → funds split on-chain", 5000, "orange");
    }
    await clearScene(page);

    // ╔═══════════════════════════════════════════════════════════════╗
    // SCENE 7: Dashboard & Analytics (12s)
    // ╚═══════════════════════════════════════════════════════════════╝
    console.log("Scene 7: Dashboard...");
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle2", timeout: 15000 });
    await wait(2000);
    await showSceneTitle(page, "Scene 7: Dashboard", "Complete overview of your gig activity");
    await showCaption(page, "Dashboard: all your gigs as client and freelancer", 3500);
    await smoothScroll(page, 400, 1500);
    await showCaption(page, "Stats: total gigs, completed, earned, active disputes", 3000);
    await wait(2000);
    await clearScene(page);

    // ╔═══════════════════════════════════════════════════════════════╗
    // SCENE 8: User Profiles & Reputation (10s)
    // ╚═══════════════════════════════════════════════════════════════╝
    console.log("Scene 8: Profile...");
    await page.goto(`${BASE_URL}/profile`, { waitUntil: "networkidle2", timeout: 15000 });
    await wait(2000);
    await showSceneTitle(page, "Scene 8: Profiles & Reputation", "Identity on-chain. Trust off-chain.");
    await showCaption(page, "Set up your profile: name, bio, skills, social links", 3500);
    await smoothScroll(page, 400, 1500);
    await showCaption(page, "Reputation from completed gigs — star ratings, public reviews", 3500, "blue");
    await wait(1500);
    await clearScene(page);

    // ╔═══════════════════════════════════════════════════════════════╗
    // SCENE 9: SDK for Developers (8s)
    // ╚═══════════════════════════════════════════════════════════════╝
    console.log("Scene 9: Landing page SDK section...");
    await page.goto(BASE_URL, { waitUntil: "networkidle2", timeout: 15000 });
    await smoothScroll(page, 4500, 2500);
    await showSceneTitle(page, "Scene 9: @gigsafe/sdk", "For developers building on GigSafe");
    await showCaption(page, "npm install @gigsafe/sdk — integrate escrow in any marketplace", 4000, "blue");
    await wait(2000);
    await clearScene(page);

    // ╔═══════════════════════════════════════════════════════════════╗
    // SCENE 10: Closing CTA (8s)
    // ╚═══════════════════════════════════════════════════════════════╝
    console.log("Scene 10: Closing...");
    await page.goto(BASE_URL, { waitUntil: "networkidle2", timeout: 15000 });
    await wait(2000);
    await showSceneTitle(page, "Scene 10: Summary", "Built for Solana Frontier 2026");
    await showCaption(page, "✅ Escrow on Solana  ✅ Milestone payments  ✅ AI dispute resolution", 4000, "green");
    await showCaption(page, "✅ File uploads  ✅ Messaging  ✅ Profiles  ✅ 0.5% fee", 4000, "green");
    await showCaption(page, "gigsafe.wildsnap.in — try it now on Solana devnet", 4000, "orange");
    await wait(3000);
    await clearScene(page);

    console.log("✅ All scenes complete!");

  } catch (err) {
    console.error("❌ Error at scene:", err.message);
  } finally {
    await wait(1000);
    await browser.close();
  }
}

main().catch(console.error);
