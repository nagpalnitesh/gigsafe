# Getting Started

## Prerequisites

Before you begin, make sure you have:

- **Node.js 18+** (we recommend 22.x)
- **Bun** or **npm** for package management
- **Solana CLI** (`solana-cli 3.x`)
- **Anchor CLI** (`anchor-cli 0.32.x`)
- **Rust** toolchain (`rustc 1.78+`)
- A **Solana wallet** (Phantom or Solflare recommended)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/indiebyte/gigsafe.git
cd gigsafe
```

### 2. Install Dependencies

```bash
bun install
# or
npm install
```

### 3. Configure Solana

Make sure your Solana CLI is pointed to devnet:

```bash
solana config set --url https://api.devnet.solana.com
```

Get some devnet SOL for testing:

```bash
solana airdrop 2
```

### 4. Run the Development Server

```bash
bun dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Connect Your Wallet

1. Install [Phantom](https://phantom.app) or [Solflare](https://solflare.com) browser extension
2. Switch to **Devnet** in wallet settings
3. Click "Select Wallet" in the navbar
4. Approve the connection

## Project Structure

```
gigsafe/
├── programs/               # Anchor smart contract (Rust)
│   └── gigsafe_protocol/
│       └── src/
│           └── lib.rs      # Main program logic
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── page.tsx        # Landing page
│   │   ├── create/         # Create gig page
│   │   ├── gigs/           # Browse gigs page
│   │   ├── gig/[id]/       # Gig detail page
│   │   ├── dashboard/      # User dashboard
│   │   ├── layout.tsx      # Root layout
│   │   └── globals.css     # Global styles
│   ├── components/         # Shared components
│   │   ├── Navbar.tsx      # Navigation bar
│   │   ├── WalletProvider.tsx  # Solana wallet config
│   │   └── Toast.tsx       # Toast notification system
│   ├── hooks/
│   │   └── useProgram.ts   # Hook to get Anchor program
│   └── lib/
│       ├── program.ts      # Program helpers, PDA derivation, instructions
│       ├── constants.ts    # Program ID, RPC endpoint, token addresses
│       └── idl/            # Auto-generated Anchor IDL
│           └── gigsafe_protocol.json
├── tests/                  # Anchor integration tests
├── docs/                   # Documentation (you are here)
├── public/                 # Static assets, favicons, logos
├── scripts/                # Build & utility scripts
├── Anchor.toml             # Anchor configuration
├── package.json
└── tsconfig.json
```

## Environment

The app connects to **Solana Devnet** by default. The RPC endpoint and program ID are configured in `src/lib/constants.ts`:

```typescript
export const GIGSAFE_PROGRAM_ID = new PublicKey(
  "2UFrdXwUEDtr5uXsVrCYuvnGoaESQM9UqVVovEYmsAY4"
);

export const RPC_ENDPOINT = "https://api.devnet.solana.com";

export const DEVNET_USDC = new PublicKey(
  "5ZpAiCXV9kgRm5Sa8755cJ9YYwuJtgZdZEKY1a5zPyYV"
);
```

To use a different RPC or switch to mainnet, update these values.

## Next Steps

- [Protocol Architecture →](./02-protocol-architecture.md)
- [Frontend Guide →](./03-frontend-guide.md)
- [Creating Your First Gig →](./04-creating-a-gig.md)
