#!/usr/bin/env node
// Generate favicons from the pangolin logo using sharp
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const srcImage = join(publicDir, "pangolin-logo.png");

const sizes = [
  { name: "favicon-16x16.png", size: 16 },
  { name: "favicon-32x32.png", size: 32 },
  { name: "favicon-48x48.png", size: 48 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "android-chrome-192x192.png", size: 192 },
  { name: "android-chrome-512x512.png", size: 512 },
  { name: "logo-400.png", size: 400 },
];

// Also generate favicon.ico (we'll use the 32x32 PNG as .ico is tricky, 
// but we can make a proper one with the 48px)
async function main() {
  console.log("Generating favicons from pangolin logo...\n");

  for (const { name, size } of sizes) {
    const outPath = join(publicDir, name);
    await sharp(srcImage)
      .resize(size, size, { fit: "contain", background: { r: 3, g: 7, b: 18, alpha: 1 } })
      .png()
      .toFile(outPath);
    console.log(`  ✅ ${name} (${size}x${size})`);
  }

  // Generate favicon.ico from 32x32
  // Sharp can't write .ico natively, so we'll use the 32x32 PNG as favicon
  // and copy it to favicon.ico (browsers accept PNG favicons)
  const favicon32 = await sharp(srcImage)
    .resize(32, 32, { fit: "contain", background: { r: 3, g: 7, b: 18, alpha: 1 } })
    .png()
    .toBuffer();
  
  const faviconPath = join(publicDir, "..", "src", "app", "favicon.ico");
  writeFileSync(faviconPath, favicon32);
  console.log("  ✅ favicon.ico (32x32 PNG)");

  // Generate OG image (1200x630) with logo centered on dark bg
  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 3, g: 7, b: 18, alpha: 255 }
    }
  })
    .composite([{
      input: await sharp(srcImage)
        .resize(300, 300, { fit: "contain", background: { r: 3, g: 7, b: 18, alpha: 1 } })
        .png()
        .toBuffer(),
      gravity: "centre"
    }])
    .png()
    .toFile(join(publicDir, "og-image.png"));
  console.log("  ✅ og-image.png (1200x630)");

  // Web manifest
  const manifest = {
    name: "GigSafe",
    short_name: "GigSafe",
    description: "Trustless freelance escrow on Solana",
    start_url: "/",
    display: "standalone",
    background_color: "#030712",
    theme_color: "#10b981",
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  };
  writeFileSync(join(publicDir, "site.webmanifest"), JSON.stringify(manifest, null, 2));
  console.log("  ✅ site.webmanifest");

  console.log("\n🎉 All favicons generated!");
}

main().catch(console.error);
