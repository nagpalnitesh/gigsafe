# GigSafe Demo Video Script

**Target length:** 3-4 minutes  
**Style:** Screen recording with voiceover (or text captions)  
**Music:** Lo-fi beats or minimal synth (background only)  

---

## Setup Before Recording

### You'll need:
1. **Two browser windows** (or profiles) — one for Client, one for Freelancer
2. **Two Phantom wallets** with devnet SOL + test USDC
3. Go to **gigsafe.wildsnap.in/faucet** to get test USDC on both wallets
4. Use a clean browser (no other tabs, dark mode looks best)
5. Screen resolution: 1920x1080 or 2560x1440

### Get test tokens:
- Switch Phantom to **Devnet** (Settings → Developer Settings → Testnet Mode)
- Airdrop SOL: `solana airdrop 2 <wallet>` or use a devnet faucet
- Get test USDC: visit gigsafe.wildsnap.in/faucet with each wallet

---

## Scene 1: Hook (0:00–0:15)

**Show:** Text on dark background (or landing page hero)

**Text/Voiceover:**
> "Freelancers lose 20% to platforms like Upwork and wait weeks to get paid.
> GigSafe fixes this. Trustless escrow on Solana. 0.5% fees. Instant payouts."

**Action:** Quick flash of the landing page → scroll past comparison table

---

## Scene 2: Landing Page (0:15–0:30)

**Show:** gigsafe.wildsnap.in

**Action:**
1. Scroll down slowly — show the hero, how it works section, comparison table
2. Pause on the fee comparison (0.5% vs 20%)
3. Quick scroll to FAQ

**Voiceover:**
> "GigSafe is a non-custodial escrow protocol. Funds are locked in Solana smart contracts — not in anyone's bank account."

---

## Scene 3: Connect Wallet & Create Gig — CLIENT (0:30–1:15)

**Show:** Client's browser

**Action:**
1. Click "Launch App" or navigate to /create
2. Connect Phantom wallet (Client wallet)
3. Fill in the form:
   - **Title:** "Build a Landing Page for SaaS Startup"
   - **Description:** "Modern landing page with hero section, pricing, testimonials, and CTA. Must be responsive and fast-loading."
   - **Milestone 1:** "Design Mockups" — 50 USDC
   - **Milestone 2:** "Frontend Development" — 100 USDC
   - **Milestone 3:** "Deploy & QA" — 50 USDC
   - **Deadline:** 2 weeks from now
4. Click **"Create Gig & Lock 200.00 USDC"**
5. Approve BOTH transactions in Phantom (create + fund)
6. Show the success toast + redirect to gig detail page

**Voiceover:**
> "The client creates a gig with 3 milestones. 200 USDC is deposited into a program-derived escrow account on Solana. Nobody — not even GigSafe — can touch these funds."

---

## Scene 4: Browse & Accept Gig — FREELANCER (1:15–1:45)

**Show:** Switch to Freelancer's browser

**Action:**
1. Navigate to /gigs (Browse Gigs)
2. Show the gig appearing with "Open" status and "Funded ✓" badge
3. Click into the gig
4. Show the gig detail: milestones, budget breakdown, PDA address
5. Click **"Accept This Gig — 200.00 USDC Escrowed"**
6. Approve transaction in Phantom
7. Show status change to "Active"

**Voiceover:**
> "The freelancer browses open gigs, sees the 200 USDC locked in escrow, and accepts. The gig is now active."

---

## Scene 5: Submit & Approve Milestone (1:45–2:30)

**Show:** Freelancer's browser first, then Client's

**Action (Freelancer):**
1. On the gig detail page, click **"Upload Deliverable"** on Milestone 1
2. Upload a mockup image/PDF
3. Click **"Submit"** on Milestone 1
4. Approve transaction — milestone status changes to "Submitted" (yellow)

**Action (switch to Client):**
1. Refresh the gig page — see Milestone 1 is "Submitted"
2. Click **"Approve & Pay"**
3. Approve transaction
4. 🎉 Show the success toast: "Milestone 1 approved & paid!"
5. **Key moment:** Show the progress bar moving, released amount updating
6. Click the Solana Explorer link — show the actual on-chain transaction

**Voiceover:**
> "The freelancer submits deliverables. The client reviews and approves. 50 USDC is released instantly — directly from the escrow to the freelancer's wallet. On-chain. Verifiable. Instant."

---

## Scene 5.5: Chat + Notifications (2:15–2:30)

**Show:** Gig detail page

**Action:**
1. Expand the **Chat** section on the gig page
2. Client sends: "Design looks great! Can you start development?"
3. Switch to freelancer — show the message appears
4. Freelancer replies: "On it! Starting frontend now."
5. Show the **notification bell** in the navbar — has unread count badge
6. Click the bell — show the notification dropdown with "Milestone Approved! 💰"

**Voiceover:**
> "Built-in messaging keeps all communication tied to the gig. Both parties get real-time notifications for every event."

---

## Scene 6: Profile + Dashboard (2:30–2:50)

**Show:** Profile page, then Dashboard

**Action:**
1. Navigate to /profile
2. Show setting up a profile: name, bio, skills ("React", "Solana", "UI Design")
3. Save profile
4. Navigate to /dashboard
5. Show the stats: Total Gigs, Completed, Total Spent
6. Show "My Gigs as Client" with the active gig

**Voiceover:**
> "Users build reputation on-platform. Profiles, skills, and reviews create trust — backed by on-chain transaction history."

---

## Scene 6.5: AI Risk Assessment (2:50–3:00)

**Show:** Create gig page

**Action:**
1. Start filling in a new gig with a single milestone and tight deadline
2. **Show the AI Risk Indicator** appearing — "Medium Risk" with score
3. Click to expand — shows factors: "Single milestone — all-or-nothing risk"
4. Shows suggestion: "💡 Break into 2-3 milestones for safer incremental payments"
5. Add a second milestone — risk drops to "Low Risk"

**Voiceover:**
> "Our AI memory system learns from platform patterns. It provides real-time risk assessment during gig creation — helping both parties structure safer deals."

---

## Scene 7: Dispute Resolution — THE WOW MOMENT (3:00–3:45)

**Show:** Gig detail page

**Action:**
1. Click **"Raise Dispute"** (either party can do this)
2. Approve transaction — gig status changes to "Disputed" (red)
3. Click **"Resolve with AI"**
4. Enter client evidence: "Only received rough wireframes, not polished design mockups as agreed"
5. Enter freelancer evidence: "Delivered 3 design iterations. Client kept changing requirements without updating the brief"
6. Click **"Analyze with AI"**
7. Show the loading state: "AI is analyzing evidence..."
8. **THE REVEAL:** Show the AI ruling appear:
   - Split bar: 70% freelancer / 30% client
   - Reasoning: "Freelancer delivered multiple iterations showing good faith effort..."
   - Confidence: High
9. Click **"Accept & Execute Ruling On-Chain"**
10. Show funds split on-chain

**Voiceover:**
> "If there's a disagreement, AI analyzes both sides and recommends a fair split. The ruling executes on-chain — funds are distributed automatically. Minutes, not weeks. Fair, transparent, and verifiable."

---

## Scene 8: Closing (3:45–4:00)

**Show:** Landing page or text overlay

**Text/Voiceover:**
> "GigSafe. Trustless escrow on Solana.
> 0.5% fees. Instant payouts. AI disputes. AI risk intelligence.
> Profiles, messaging, notifications — a complete platform.
> Open source. Built for the future of freelancing.
> 
> gigsafe.wildsnap.in
> @nagpalnitesh"

**Show:** GitHub link, Twitter handle

---

## Recording Tips

1. **Use 2x display zoom** if on 4K — makes text readable in video
2. **Close all other browser tabs** — clean look
3. **Pre-fund both wallets** so there's no waiting for faucet
4. **Pre-approve Phantom** for the site so connection is instant
5. **Record at 60fps** if possible
6. Transactions on devnet are fast but can occasionally lag — have patience
7. **Record each scene separately** if needed — edit together later
8. Wallet addresses will be visible — that's fine, it's devnet

## Tools for Recording

- **macOS:** QuickTime (free) or OBS
- **Windows:** OBS (free) or ShareX
- **Voiceover:** Record separately, mix in editing
- **Editing:** CapCut (free), DaVinci Resolve (free), or iMovie
- **Captions:** CapCut auto-captions are great

## Demo-Ready Test Data

Before recording, create 2-3 additional gigs from different wallets so the Browse Gigs page looks populated:
- "Smart Contract Security Audit" — 500 USDC
- "Design a NFT Collection (10 pieces)" — 300 USDC  
- "Write Technical Documentation" — 150 USDC
