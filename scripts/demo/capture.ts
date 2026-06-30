/**
 * GigSafe Demo Video Generator
 * 
 * Captures screenshots of all pages and key flows,
 * then assembles them into a video with ffmpeg.
 * 
 * Usage: bun run scripts/demo/capture.ts
 */

import puppeteer from "puppeteer";
import { mkdir, writeFile } from "fs/promises";
import { execSync } from "child_process";
import path from "path";

const BASE_URL = "https://gigsafe.wildsnap.in";
const OUTPUT_DIR = path.join(process.cwd(), "scripts/demo/frames");
const VIDEO_OUTPUT = path.join(process.cwd(), "scripts/demo/gigsafe-demo.mp4");

const VIEWPORT = { width: 1920, height: 1080 };
const FRAME_DURATION = 4; // seconds per frame

interface Scene {
  name: string;
  url: string;
  waitFor?: string; // CSS selector to wait for
  scrollTo?: number; // scroll position
  delay?: number; // extra delay in ms
  caption?: string;
}

const scenes: Scene[] = [
  // Scene 1: Landing page hero
  {
    name: "01-hero",
    url: "/",
    caption: "GigSafe — Trustless Freelance Escrow on Solana",
    delay: 1000,
  },
  // Scene 2: How it works
  {
    name: "02-how-it-works",
    url: "/",
    scrollTo: 800,
    caption: "4-step process: Create → Fund → Work → Pay",
    delay: 500,
  },
  // Scene 3: Features
  {
    name: "03-features",
    url: "/",
    scrollTo: 1600,
    caption: "On-chain escrow, AI disputes, instant payouts",
    delay: 500,
  },
  // Scene 4: Comparison table
  {
    name: "04-comparison",
    url: "/",
    scrollTo: 2800,
    caption: "0.5% fee vs Upwork's 20%",
    delay: 500,
  },
  // Scene 5: Pricing
  {
    name: "05-pricing",
    url: "/",
    scrollTo: 3600,
    caption: "Simple pricing — 4 tiers from 0.5% to 5%",
    delay: 500,
  },
  // Scene 6: Create gig — templates
  {
    name: "06-templates",
    url: "/create",
    caption: "Start from a template or build custom",
    delay: 1000,
  },
  // Scene 7: Create gig — form
  {
    name: "07-create-form",
    url: "/create",
    scrollTo: 600,
    caption: "Milestones, categories, AI risk assessment",
    delay: 500,
  },
  // Scene 8: Browse gigs
  {
    name: "08-browse",
    url: "/gigs",
    caption: "Browse, search, filter by status and category",
    delay: 1000,
  },
  // Scene 9: Dashboard
  {
    name: "09-dashboard",
    url: "/dashboard",
    caption: "Dashboard with stats — gigs, earnings, activity",
    delay: 1000,
  },
  // Scene 10: Profile
  {
    name: "10-profile",
    url: "/profile",
    caption: "User profiles — name, bio, skills, social links",
    delay: 1000,
  },
  // Scene 11: Faucet
  {
    name: "11-faucet",
    url: "/faucet",
    caption: "Devnet faucet — get test USDC to try it out",
    delay: 1000,
  },
  // Scene 12: FAQ
  {
    name: "12-faq",
    url: "/",
    scrollTo: 5200,
    caption: "Comprehensive FAQ — everything you need to know",
    delay: 500,
  },
  // Scene 13: CTA
  {
    name: "13-cta",
    url: "/",
    scrollTo: 6000,
    caption: "Built for Solana Frontier Hackathon 2026",
    delay: 500,
  },
];

async function addCaption(imgPath: string, caption: string, outputPath: string) {
  // Use ffmpeg to add caption overlay
  const cmd = `ffmpeg -y -i "${imgPath}" -vf "drawbox=y=ih-80:h=80:color=black@0.7:t=fill,drawtext=text='${caption.replace(/'/g, "\\'")}':fontcolor=white:fontsize=32:x=(w-text_w)/2:y=h-55:font=monospace" "${outputPath}"`;
  try {
    execSync(cmd, { stdio: "pipe" });
  } catch {
    // If caption fails, just copy the original
    execSync(`cp "${imgPath}" "${outputPath}"`, { stdio: "pipe" });
  }
}

async function main() {
  console.log("🎬 GigSafe Demo Video Generator");
  console.log("================================\n");

  // Create output directory
  await mkdir(OUTPUT_DIR, { recursive: true });

  // Launch browser
  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "/usr/bin/chromium-browser",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--window-size=1920,1080",
    ],
  });

  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  // Capture each scene
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    console.log(`📸 [${i + 1}/${scenes.length}] ${scene.name}: ${scene.caption}`);

    await page.goto(`${BASE_URL}${scene.url}`, { waitUntil: "networkidle2", timeout: 15000 });

    if (scene.waitFor) {
      await page.waitForSelector(scene.waitFor, { timeout: 5000 }).catch(() => {});
    }

    if (scene.scrollTo) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), scene.scrollTo);
      await new Promise((r) => setTimeout(r, 300));
    }

    if (scene.delay) {
      await new Promise((r) => setTimeout(r, scene.delay));
    }

    // Take screenshot
    const rawPath = path.join(OUTPUT_DIR, `${scene.name}-raw.png`);
    const captionedPath = path.join(OUTPUT_DIR, `${scene.name}.png`);
    await page.screenshot({ path: rawPath, fullPage: false });

    // Add caption
    if (scene.caption) {
      await addCaption(rawPath, scene.caption, captionedPath);
    } else {
      execSync(`cp "${rawPath}" "${captionedPath}"`);
    }
  }

  await browser.close();
  console.log("\n✅ All screenshots captured!\n");

  // Generate video from screenshots
  console.log("🎥 Assembling video...");

  // Create a file list for ffmpeg
  const fileList = scenes.map((s) => {
    const framePath = path.join(OUTPUT_DIR, `${s.name}.png`);
    return `file '${framePath}'\nduration ${FRAME_DURATION}`;
  }).join("\n");
  // Add last frame again (ffmpeg concat demuxer quirk)
  const lastFrame = path.join(OUTPUT_DIR, `${scenes[scenes.length - 1].name}.png`);
  const fullList = fileList + `\nfile '${lastFrame}'`;
  
  const listPath = path.join(OUTPUT_DIR, "frames.txt");
  await writeFile(listPath, fullList);

  // Assemble with ffmpeg
  const ffmpegCmd = `ffmpeg -y -f concat -safe 0 -i "${listPath}" -vf "fps=25,format=yuv420p" -c:v libx264 -pix_fmt yuv420p -preset slow -crf 20 "${VIDEO_OUTPUT}"`;

  try {
    execSync(ffmpegCmd, { stdio: "pipe" });
    console.log(`\n🎬 Video saved: ${VIDEO_OUTPUT}`);
    
    // Get file size
    const { statSync } = require("fs");
    const stats = statSync(VIDEO_OUTPUT);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
    console.log(`📦 Size: ${sizeMB} MB`);
    console.log(`⏱️  Duration: ~${scenes.length * FRAME_DURATION} seconds`);
  } catch (err) {
    console.error("❌ Video assembly failed:", err);
  }
}

main().catch(console.error);
