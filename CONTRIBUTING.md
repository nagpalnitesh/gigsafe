# Contributing to GigSafe

## Getting Started

```bash
git clone https://github.com/indiebyte/gigsafe.git
cd gigsafe

# Install dependencies
bun install

# Set up environment
cp .env.local.example .env.local
# Edit .env.local with your GROQ_API_KEY

# Run development server
bun run dev

# Smart contract (needs Anchor CLI + Solana CLI + Rust)
cd programs/gigsafe-protocol
anchor build && anchor test
```

## Project Structure

```
gigsafe/
├── src/
│   ├── app/              Pages + API routes (Next.js App Router)
│   │   ├── api/          Server-side API routes
│   │   ├── create/       Create gig page
│   │   ├── dashboard/    User dashboard
│   │   ├── faucet/       Devnet USDC faucet
│   │   ├── gig/[id]/     Gig detail + dispute resolution
│   │   ├── gigs/         Browse gigs
│   │   ├── profile/      Edit profile
│   │   └── u/[wallet]/   Public profile
│   ├── components/       React components
│   ├── hooks/            Custom React hooks
│   └── lib/              Core libraries (db, auth, AI, etc.)
├── programs/             Solana program (Anchor/Rust)
├── sdk/                  TypeScript SDK (@gigsafe/sdk)
├── tests/                Integration tests
├── docs/                 Documentation
├── data/                 SQLite database (gitignored)
└── uploads/              Uploaded files (gitignored)
```

## API Routes

| Route | Purpose |
|-------|---------|
| `/api/metadata` | Gig descriptions, milestone names, categories |
| `/api/profile` | User profiles |
| `/api/reviews` | Reputation + reviews |
| `/api/notifications` | In-app notifications |
| `/api/messages` | Per-gig messaging |
| `/api/files` | File references |
| `/api/upload` | File upload |
| `/api/risk` | AI risk assessment |
| `/api/dispute/resolve` | AI dispute resolution |
| `/api/faucet` | Devnet USDC mint |
| `/api/og` | Dynamic OG images |

See [docs/API.md](./docs/API.md) for full API documentation.

## Testing

```bash
# API integration tests (31 tests)
bash tests/api.test.sh

# On-chain tests (needs Anchor)
anchor test
```

## Commit Convention

```
feat: add milestone approval
fix: handle overflow in escrow release
docs: update API documentation
test: add review validation tests
infra: migrate to SQLite database
security: add rate limiting
polish: mobile responsive fixes
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React, TailwindCSS, Framer Motion |
| Smart Contract | Rust, Anchor |
| Database | SQLite (better-sqlite3) |
| AI | Groq (Llama 3.3 70B) |
| Wallets | Phantom, Solflare, Backpack |
| Auth | Ed25519 wallet signatures |

## Security

Found a vulnerability? **Don't open a public issue.** DM [@nagpalnitesh](https://x.com/nagpalnitesh) on Twitter.

## License

MIT — contributions welcome.
