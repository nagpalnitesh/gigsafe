import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
  weight: ["300", "400", "500", "600", "700", "800"],
});
import { AppWalletProvider } from "@/components/WalletProvider";
import { Navbar } from "@/components/Navbar";
import { ToastProvider } from "@/components/Toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  metadataBase: new URL("https://gigsafe.pixxmo.com"),
  title: "GigSafe — Trustless Freelance Escrow on Solana",
  description: "Secure freelance payments with on-chain escrow, milestone tracking, and AI-powered dispute resolution. 0.5% fee.",
  keywords: ["freelance", "escrow", "solana", "crypto", "USDC", "AI dispute", "milestone payments"],
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "GigSafe — Trustless Freelance Escrow on Solana",
    description: "0.5% fee. Instant payouts. AI disputes. Built on Solana.",
    url: "https://gigsafe.pixxmo.com",
    siteName: "GigSafe",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@gigsafe_sol",
    creator: "@gigsafe_sol",
    title: "GigSafe — Trustless Freelance Escrow on Solana",
    description: "0.5% fee. Instant payouts. AI disputes. Built on Solana.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script type="text/javascript" dangerouslySetInnerHTML={{ __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "wa5c7ul8wr");` }} />

        {/* AEO: Organization + WebSite schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://gigsafe.pixxmo.com/#organization",
              "name": "GigSafe",
              "url": "https://gigsafe.pixxmo.com",
              "logo": { "@type": "ImageObject", "url": "https://gigsafe.pixxmo.com/android-chrome-192x192.png" },
              "description": "Trustless freelance escrow on Solana with milestone payments, AI dispute resolution, and 0.5% fees.",
              "sameAs": ["https://x.com/gigsafe_sol", "https://github.com/indiebyte/gigsafe"]
            },
            {
              "@type": "WebSite",
              "@id": "https://gigsafe.pixxmo.com/#website",
              "url": "https://gigsafe.pixxmo.com",
              "name": "GigSafe — Trustless Freelance Escrow on Solana",
              "description": "On-chain escrow with milestone payments, AI dispute resolution, and 0.5% fees. Instant USDC payouts. No banking required.",
              "publisher": { "@id": "https://gigsafe.pixxmo.com/#organization" },
              "dateModified": "2026-04-23"
            },
            {
              "@type": "SoftwareApplication",
              "name": "GigSafe",
              "applicationCategory": "FinanceApplication",
              "operatingSystem": "Web",
              "url": "https://gigsafe.pixxmo.com",
              "description": "Trustless freelance escrow protocol on Solana. Create gigs with milestone payments, fund escrow with USDC, and resolve disputes with AI arbitration.",
              "offers": { "@type": "Offer", "price": "0.5", "priceCurrency": "percent", "description": "0.5% transaction fee" },
              "featureList": ["On-chain escrow", "Milestone payments", "AI dispute resolution", "Instant USDC payouts", "0.5% fee", "Non-custodial"]
            }
          ]
        }) }} />

        {/* AEO: FAQPage schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What is GigSafe and how does it work?",
              "acceptedAnswer": { "@type": "Answer", "text": "GigSafe is a trustless freelance escrow platform built on Solana. Clients deposit USDC into a non-custodial smart contract, freelancers complete milestone-based work, and funds release automatically upon approval. If disputes arise, AI analyzes evidence and splits funds fairly. The protocol charges 0.5% — versus 20% on Upwork." }
            },
            {
              "@type": "Question",
              "name": "How much does GigSafe charge?",
              "acceptedAnswer": { "@type": "Answer", "text": "GigSafe charges 0.5% per transaction. By comparison, Upwork charges 10–20% and Fiverr charges 20%. On a $5,000 project, GigSafe costs $25 versus $750–$1,000 on traditional platforms." }
            },
            {
              "@type": "Question",
              "name": "How does GigSafe's AI dispute resolution work?",
              "acceptedAnswer": { "@type": "Answer", "text": "When either party raises a dispute, both submit text evidence. GigSafe's AI (powered by Llama 3.3 70B via Groq) analyzes the evidence, milestone completion, and communication history, then recommends a percentage split of the escrowed funds. Either party can accept the ruling, which executes automatically on-chain within minutes." }
            },
            {
              "@type": "Question",
              "name": "Is GigSafe non-custodial? Who holds the funds?",
              "acceptedAnswer": { "@type": "Answer", "text": "GigSafe is fully non-custodial. Funds are held in Program Derived Accounts (PDAs) on Solana — smart contracts that no single party controls. GigSafe, the client, and the freelancer cannot unilaterally access the escrow. Funds only move when both parties agree or a dispute is formally resolved." }
            },
            {
              "@type": "Question",
              "name": "What tokens does GigSafe support?",
              "acceptedAnswer": { "@type": "Answer", "text": "GigSafe currently supports USDC on Solana devnet, with mainnet USDC integration planned. USDC provides stable, dollar-pegged payments so freelancers aren't exposed to crypto price volatility. SOL native support is on the roadmap." }
            },
            {
              "@type": "Question",
              "name": "How is GigSafe different from Upwork or Fiverr?",
              "acceptedAnswer": { "@type": "Answer", "text": "GigSafe differs in four key ways: (1) 0.5% fee vs. 10–20% on Upwork and 20% on Fiverr; (2) instant USDC payouts vs. 7–14 day wait; (3) funds held in non-custodial blockchain escrow, not a company's bank account; (4) AI dispute resolution in minutes, not weeks of manual review." }
            },
            {
              "@type": "Question",
              "name": "Can I cancel a gig and get a refund?",
              "acceptedAnswer": { "@type": "Answer", "text": "Clients can cancel a gig and receive a full refund of escrowed funds as long as no freelancer has accepted the gig yet. Once a freelancer accepts, cancellation requires mutual agreement or dispute resolution. This protects freelancers from clients who cancel after work begins." }
            }
          ]
        }) }} />
      </head>
      <body className={`${jakarta.variable} font-sans bg-[#030712] text-white antialiased min-h-screen`}>
        <AppWalletProvider>
          <ToastProvider>
            <Navbar />
            <ErrorBoundary>
              <main>{children}</main>
            </ErrorBoundary>
          </ToastProvider>
        </AppWalletProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').catch(() => {});
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
