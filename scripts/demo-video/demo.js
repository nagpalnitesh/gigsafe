/**
 * GigSafe Demo Video Automation
 * 
 * Automates a full product walkthrough:
 * 1. Landing page hero
 * 2. Features/comparison scroll
 * 3. Connect wallet (simulated — devnet)
 * 4. Faucet page
 * 5. Browse gigs page
 * 6. Create gig page
 * 7. Gig detail page
 * 8. Dashboard
 * 9. AI dispute resolution
 * 10. Closing
 */

const puppeteer = require("puppeteer");

const BASE_URL = "https://gigsafe.wildsnap.in";
const VIEWPORT = { width: 1920, height: 1080 };

// Timing helpers
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function type(page, selector, text, delay = 50) {
  await page.focus(selector);
  await page.keyboard.type(text, { delay });
}

async function slowScroll(page, to, duration = 1500) {
  const steps = 30;
  const stepSize = to / steps;
  const stepDelay = duration / steps;
  for (let i = 0; i < steps; i++) {
    await page.evaluate((s) => window.scrollBy(0, s), stepSize);
    await wait(stepDelay);
  }
}

async function main() {
  console.log("Launching browser...");
  
  const browser = await puppeteer.launch({
    headless: false, // Must be non-headless to show in Xvfb
    executablePath: "/usr/bin/chromium-browser",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
      "--start-maximized",
      "--disable-extensions",
      // Dark theme
      "--force-dark-mode",
      "--enable-features=WebUIDarkMode",
      "--color-scheme=dark",
    ],
    defaultViewport: null, // Use window size
  });

  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  try {
    // ── SCENE 1: Landing Page Hero (8s) ──────────────────────────────
    console.log("Scene 1: Landing page...");
    await page.goto(BASE_URL, { waitUntil: "networkidle2", timeout: 15000 });
    await wait(3000); // Let animations play

    // Slow scroll through landing page
    await slowScroll(page, 600, 2000); // Scroll to "How it works"
    await wait(2000);
    await slowScroll(page, 800, 2000); // Scroll to comparison
    await wait(2000);
    await slowScroll(page, 600, 1500); // Scroll to CTA
    await wait(1000);

    // Scroll back to top
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await wait(1500);

    // ── SCENE 2: Faucet (5s) ─────────────────────────────────────────
    console.log("Scene 2: Faucet page...");
    await page.goto(`${BASE_URL}/faucet`, { waitUntil: "networkidle2", timeout: 15000 });
    await wait(3000);
    // Show "get test USDC" message
    await wait(2000);

    // ── SCENE 3: Browse Gigs (8s) ────────────────────────────────────
    console.log("Scene 3: Browse gigs...");
    await page.goto(`${BASE_URL}/gigs`, { waitUntil: "networkidle2", timeout: 15000 });
    await wait(3000); // Let gigs load from chain (may take time)
    await slowScroll(page, 400, 2000);
    await wait(2000);
    
    // Simulate hovering over a gig card
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await wait(1000);

    // ── SCENE 4: Create Gig page (10s) ───────────────────────────────
    console.log("Scene 4: Create gig page...");
    await page.goto(`${BASE_URL}/create`, { waitUntil: "networkidle2", timeout: 15000 });
    await wait(3000);

    // Scroll down to show the form
    await slowScroll(page, 300, 1500);
    await wait(1000);

    // Scroll to templates if visible
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await wait(1000);

    // ── SCENE 5: Dashboard (8s) ──────────────────────────────────────
    console.log("Scene 5: Dashboard...");
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle2", timeout: 15000 });
    await wait(3000);
    await slowScroll(page, 400, 2000);
    await wait(2000);

    // ── SCENE 6: Activity Feed (5s) ──────────────────────────────────
    console.log("Scene 6: Activity feed...");
    await page.goto(`${BASE_URL}/activity`, { waitUntil: "networkidle2", timeout: 15000 });
    await wait(3000);
    await slowScroll(page, 300, 1500);
    await wait(1500);

    // ── SCENE 7: Profile page (5s) ───────────────────────────────────
    console.log("Scene 7: Profile...");
    await page.goto(`${BASE_URL}/profile`, { waitUntil: "networkidle2", timeout: 15000 });
    await wait(3000);
    await slowScroll(page, 300, 1500);
    await wait(1500);

    // ── SCENE 8: Back to landing — close (5s) ────────────────────────
    console.log("Scene 8: Closing on landing page...");
    await page.goto(BASE_URL, { waitUntil: "networkidle2", timeout: 15000 });
    await wait(4000);

    // Final fade — hold on hero
    await wait(2000);

    console.log("✅ All scenes complete");

  } catch (err) {
    console.error("❌ Demo error:", err.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
