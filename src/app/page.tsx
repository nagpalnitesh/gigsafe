"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Zap,
  Bot,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  Clock,
  FileText,
  Users,
  Lock,
  Globe,
  Code2,
  ChevronRight,
  Milestone,
} from "lucide-react";

const ease = { duration: 0.7, ease: [0.23, 1, 0.32, 1] as const };

const features = [
  {
    icon: <Lock className="w-5 h-5" />,
    title: "On-Chain Escrow",
    desc: "Client funds are locked in a Solana PDA. No middlemen. No trust required. Code is the contract.",
  },
  {
    icon: <Milestone className="w-5 h-5" />,
    title: "Milestone Payments",
    desc: "Break projects into milestones. Funds release as each milestone is approved. Fair for both sides.",
  },
  {
    icon: <Bot className="w-5 h-5" />,
    title: "AI Dispute Resolution",
    desc: "Disagreement? AI analyzes evidence from both parties and suggests a fair resolution. Fast, unbiased.",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Instant USDC Payouts",
    desc: "Freelancers get paid the moment work is approved. No 30-day terms. No bank delays.",
  },
  {
    icon: <DollarSign className="w-5 h-5" />,
    title: "0.5% Fee (vs 20%)",
    desc: "Upwork charges 10-20%. Fiverr takes 20%. GigSafe takes 0.5%. The math speaks for itself.",
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: "Borderless",
    desc: "Pay anyone, anywhere. No banking restrictions. No currency conversion headaches. Just USDC.",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Create a Gig",
    desc: "Client posts a gig with description, milestones, budget, and deadline. Gets a shareable link.",
    color: "text-emerald-400",
  },
  {
    step: "02",
    title: "Fund Escrow",
    desc: "Client deposits USDC/SOL into a smart contract escrow. Funds are locked and visible on-chain.",
    color: "text-emerald-400",
  },
  {
    step: "03",
    title: "Work & Submit",
    desc: "Freelancer completes milestones and submits deliverables. Progress tracked on-chain.",
    color: "text-emerald-400",
  },
  {
    step: "04",
    title: "Approve & Pay",
    desc: "Client reviews and approves. Funds release instantly to freelancer's wallet. Done.",
    color: "text-emerald-400",
  },
];

const comparison = [
  { name: "Upwork", fee: "10-20%", payout: "7-14 days", dispute: "Manual (weeks)", global: "Limited" },
  { name: "Fiverr", fee: "20%", payout: "14 days", dispute: "Manual (weeks)", global: "Limited" },
  { name: "Freelancer.com", fee: "10%", payout: "15 days", dispute: "Manual", global: "Limited" },
  { name: "GigSafe", fee: "0.5%", payout: "Instant", dispute: "AI (minutes)", global: "Anywhere", highlight: true },
];

const faq = [
  {
    q: "What is GigSafe and how does it work?",
    a: "GigSafe is a trustless freelance escrow protocol on Solana. Clients deposit USDC into a non-custodial smart contract (PDA), freelancers complete milestone-based work, and funds release automatically upon approval. The process: create gig → fund escrow → freelancer accepts → submit milestones → client approves → instant payout.",
  },
  {
    q: "How much does GigSafe charge in fees?",
    a: "GigSafe charges 0.5% per transaction — the lowest fee in the freelance industry. By comparison, Upwork charges 10–20% and Fiverr charges 20%. On a $5,000 project, GigSafe costs $25 versus $750–1,000 on traditional platforms. That's $725–$975 more in your pocket per project.",
  },
  {
    q: "How does GigSafe's AI dispute resolution work?",
    a: "When either party raises a dispute, both submit text evidence. GigSafe's AI (Llama 3.3 70B via Groq) analyzes the evidence, milestone completion status, and history, then recommends a percentage fund split. Either party accepts, which executes on-chain automatically. Resolution in minutes, not weeks.",
  },
  {
    q: "Is GigSafe non-custodial? Who holds the escrow funds?",
    a: "GigSafe is fully non-custodial. Funds are held in Program Derived Accounts (PDAs) on Solana — smart contracts that no single party controls. GigSafe, the client, and the freelancer cannot unilaterally access the escrow. Funds only move when both parties agree or a dispute is formally resolved.",
  },
  {
    q: "How is GigSafe different from Upwork or Fiverr?",
    a: "Four key differences: (1) 0.5% fee vs 10–20% on Upwork and 20% on Fiverr; (2) instant USDC payouts vs 7–14 day wait; (3) funds held in on-chain escrow, not a company bank account; (4) AI dispute resolution in minutes, not weeks of manual review. Non-custodial by design.",
  },
  {
    q: "Can I use GigSafe without crypto knowledge?",
    a: "You need a Solana wallet (Phantom takes 30 seconds to set up) and some USDC. Beyond that, the experience mirrors any freelance platform: post gig, fund escrow, approve work, get paid. The blockchain complexity is invisible to users.",
  },
  {
    q: "What tokens does GigSafe support?",
    a: "GigSafe currently supports USDC on Solana devnet, with mainnet USDC integration planned. USDC provides stable, dollar-pegged payments so freelancers aren't exposed to crypto price volatility. SOL native support is on the roadmap.",
  },
  {
    q: "Can I cancel a gig and get a refund on GigSafe?",
    a: "Clients can cancel a gig and receive a full refund as long as no freelancer has accepted yet. Once a freelancer accepts, cancellation requires mutual agreement or dispute resolution. This protects freelancers from clients who cancel after work has begun.",
  },
  {
    q: "Is GigSafe only for developers?",
    a: "No. GigSafe works for any freelance work: design, writing, marketing, consulting, smart contract audits, video production — anything where one person hires another for a deliverable. If you can break the work into milestones, GigSafe can escrow it.",
  },
];

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* BG effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-emerald-500/[0.04] blur-[180px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-cyan-500/[0.03] blur-[150px]" />
      </div>



      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-4 pt-24 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={ease}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 mb-8">
            <Shield className="w-3.5 h-3.5" />
            Solana Frontier Hackathon 2026
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            Freelance payments,
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              finally safe.
            </span>
          </h1>

          <p className="text-xl text-gray-400 mb-4 max-w-xl mx-auto">
            On-chain escrow. Milestone tracking. AI dispute resolution.
            <br />
            <strong className="text-gray-300">0.5% fee.</strong> Not 20%.
          </p>

          {/* Stats */}
          <div className="inline-flex items-center gap-4 sm:gap-8 px-4 sm:px-6 py-3 rounded-xl bg-white/[0.03] border border-white/5 mb-10 text-sm">
            <div className="text-center">
              <div className="text-emerald-400 font-bold text-lg">0.5%</div>
              <div className="text-gray-500">Platform fee</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <div className="text-emerald-400 font-bold text-lg">~0.4s</div>
              <div className="text-gray-500">Payout speed</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <div className="text-emerald-400 font-bold text-lg">$0</div>
              <div className="text-gray-500">Hidden charges</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/create"
              className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-semibold transition flex items-center gap-2"
            >
              Post a Gig <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#how-it-works"
              className="px-8 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-semibold transition"
            >
              See how it works
            </a>
          </div>
        </motion.div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 py-20">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-4"
        >
          How it works
        </motion.h2>
        <p className="text-gray-400 text-center mb-16 max-w-lg mx-auto">
          Four steps. Client to freelancer. No middlemen.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {howItWorks.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...ease, delay: i * 0.1 }}
              className="relative p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/20 transition"
            >
              <div className={`text-4xl font-black ${step.color} opacity-20 mb-3`}>
                {step.step}
              </div>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-gray-400 text-sm">{step.desc}</p>
              {i < howItWorks.length - 1 && (
                <ChevronRight className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/30 z-10" />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-20">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-4"
        >
          Built for freelancers. Secured by Solana.
        </motion.h2>
        <p className="text-gray-400 text-center mb-16 max-w-lg mx-auto">
          Everything you need for safe freelance payments, nothing you don't.
        </p>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...ease, delay: i * 0.06 }}
              className="p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/20 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section id="compare" className="max-w-6xl mx-auto px-4 py-20">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-4"
        >
          The numbers don't lie
        </motion.h2>
        <p className="text-gray-400 text-center mb-12">
          See how GigSafe compares to traditional platforms.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="overflow-x-auto -mx-4 px-4"
        >
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-4 px-4 text-gray-500 font-normal">Platform</th>
                <th className="text-left py-4 px-4 text-gray-500 font-normal">Fee</th>
                <th className="text-left py-4 px-4 text-gray-500 font-normal">Payout</th>
                <th className="text-left py-4 px-4 text-gray-500 font-normal">Disputes</th>
                <th className="text-left py-4 px-4 text-gray-500 font-normal">Global</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row, i) => (
                <tr
                  key={i}
                  className={`border-b border-white/5 ${
                    row.highlight
                      ? "bg-emerald-500/5"
                      : ""
                  }`}
                >
                  <td className={`py-4 px-4 font-semibold ${row.highlight ? "text-emerald-400" : ""}`}>
                    {row.highlight && <Shield className="w-4 h-4 inline mr-2" />}
                    {row.name}
                  </td>
                  <td className={`py-4 px-4 ${row.highlight ? "text-emerald-400 font-bold" : "text-red-400"}`}>
                    {row.fee}
                  </td>
                  <td className={`py-4 px-4 ${row.highlight ? "text-emerald-400 font-bold" : "text-gray-400"}`}>
                    {row.payout}
                  </td>
                  <td className={`py-4 px-4 ${row.highlight ? "text-emerald-400 font-bold" : "text-gray-400"}`}>
                    {row.dispute}
                  </td>
                  <td className={`py-4 px-4 ${row.highlight ? "text-emerald-400 font-bold" : "text-gray-400"}`}>
                    {row.global}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 py-20">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-4"
        >
          Simple pricing. No surprises.
        </motion.h2>
        <p className="text-gray-400 text-center mb-12">
          Still 4-10x cheaper than Upwork. Even at the highest tier.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              name: "Starter",
              fee: "0.5%",
              desc: "Escrow only",
              features: ["On-chain escrow", "Milestone payments", "Instant payouts", "Cancel + refund"],
              cta: "Get Started",
              popular: false,
            },
            {
              name: "Pro",
              fee: "1%",
              desc: "Most popular",
              features: ["Everything in Starter", "AI dispute resolution", "Invoice generation", "Priority support"],
              cta: "Go Pro",
              popular: true,
            },
            {
              name: "Platform",
              fee: "2.5%",
              desc: "For marketplaces",
              features: ["Everything in Pro", "Embeddable SDK", "Webhooks", "Analytics dashboard", "Custom branding"],
              cta: "Integrate SDK",
              popular: false,
            },
            {
              name: "Enterprise",
              fee: "5%",
              desc: "Full managed",
              features: ["Everything in Platform", "White-label", "SLA guarantee", "Dedicated support", "Custom integrations"],
              cta: "Contact Us",
              popular: false,
            },
          ].map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`p-6 rounded-2xl border flex flex-col ${
                plan.popular
                  ? "bg-emerald-500/5 border-emerald-500/30 relative"
                  : "bg-white/[0.02] border-white/5"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500 text-black text-xs font-bold">
                  Most Popular
                </div>
              )}
              <div className="text-sm text-gray-400 mb-1">{plan.name}</div>
              <div className="text-3xl font-bold mb-1">
                {plan.fee}
                <span className="text-sm font-normal text-gray-500"> per gig</span>
              </div>
              <div className="text-xs text-gray-500 mb-4">{plan.desc}</div>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f, fi) => (
                  <li key={fi} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-emerald-400 mt-0.5">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition ${
                  plan.popular
                    ? "bg-emerald-500 hover:bg-emerald-600 text-black"
                    : "bg-white/5 hover:bg-white/10 border border-white/10"
                }`}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Upwork charges 10-20%. Fiverr charges 20%. Our most expensive plan is 5%. Do the math.
        </p>
      </section>

      {/* Code embed preview */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-8 sm:gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 text-sm text-emerald-400 mb-4">
              <Code2 className="w-4 h-4" />
              For Developers
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Add escrow payments to your platform
            </h2>
            <p className="text-gray-400 mb-6">
              Our SDK lets any freelance marketplace, hiring platform, or task board add trustless escrow in minutes. Not months.
            </p>
            <ul className="space-y-3 text-sm text-gray-300">
              {["npm install @gigsafe/sdk", "One-line escrow creation", "Webhook on milestone + payout", "White-label embeddable widget"].map(
                (item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    {item}
                  </li>
                )
              )}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-4 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/5 font-mono text-xs sm:text-sm overflow-x-auto"
          >
            <div className="flex gap-1.5 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <pre className="text-gray-300 leading-relaxed overflow-x-auto">
              <span className="text-gray-500">{"// Create an escrow gig"}</span>{"\n"}
              <span className="text-red-400">const</span> gig = <span className="text-red-400">await</span>{" "}
              <span className="text-emerald-400">GigSafe.create</span>{"({\n"}
              {"  "}client: <span className="text-cyan-300">wallet.publicKey</span>,{"\n"}
              {"  "}freelancer: <span className="text-cyan-300">"freelancer.sol"</span>,{"\n"}
              {"  "}amount: <span className="text-yellow-300">500</span>,{"\n"}
              {"  "}token: <span className="text-cyan-300">USDC</span>,{"\n"}
              {"  "}milestones: [<span className="text-cyan-300">"Design"</span>, <span className="text-cyan-300">"Build"</span>, <span className="text-cyan-300">"Launch"</span>],{"\n"}
              {"}"});{"\n\n"}
              <span className="text-gray-500">{"// Funds locked in PDA escrow"}</span>{"\n"}
              <span className="text-gray-500">{"// Release per milestone"}</span>{"\n"}
              <span className="text-red-400">await</span> gig.<span className="text-emerald-400">approveMilestone</span>(<span className="text-yellow-300">0</span>);
            </pre>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      {/* AEO: Deep content section with expert quotes and answer-first structure */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-xs text-gray-600 text-center mb-12">
          Last updated: April 23, 2026
        </div>

        <div className="space-y-12 text-sm text-gray-400 leading-relaxed">

          <div>
            <h2 className="text-xl font-bold text-white mb-3">How Does Freelance Escrow on Solana Work?</h2>
            <p className="text-gray-300 mb-3">GigSafe's escrow is non-custodial — funds are locked in a Program Derived Account (PDA) that no single party controls until predefined conditions are met. This eliminates counterparty risk entirely.</p>
            <p>When a client creates a gig on GigSafe, they deposit USDC into a PDA escrow account derived from their wallet and a unique gig ID. The smart contract stores the total budget, milestone amounts, deadline, and status. The client's funds are visible on-chain to both parties throughout the engagement.</p>
            <p className="mt-3">Freelancers browse open gigs and accept by calling the <code className="text-emerald-400 text-xs bg-emerald-500/10 px-1 rounded">accept_gig</code> instruction. From that point, they submit milestones via <code className="text-emerald-400 text-xs bg-emerald-500/10 px-1 rounded">submit_milestone</code>, and clients release funds milestone-by-milestone with <code className="text-emerald-400 text-xs bg-emerald-500/10 px-1 rounded">approve_milestone</code>. Each approval triggers an immediate USDC transfer from the PDA to the freelancer's associated token account.</p>
            <blockquote className="mt-4 border-l-2 border-emerald-500/40 pl-4 italic text-gray-400">
              "Non-custodial escrow removes the trust problem from freelancing. You're not trusting a company with your money — you're trusting code."
              <footer className="mt-1 text-xs text-gray-600 not-italic">— GigSafe Protocol Design Doc, 2026</footer>
            </blockquote>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">Why Blockchain Escrow Beats Traditional Platforms</h2>
            <p className="text-gray-300 mb-3">Traditional freelance platforms hold your money in corporate bank accounts and charge 10–20% for the privilege. Blockchain escrow eliminates the intermediary entirely, reducing fees to near-zero while improving security.</p>
            <p>Upwork earned $637 million in revenue in 2023, primarily from platform fees. Freelancers on Upwork who earn over $10,000 per client pay 10%; those earning under $500 per client pay 20%. These fees compound over a career: a freelancer earning $100,000/year pays $10,000–$20,000 in fees annually.</p>
            <p className="mt-3">GigSafe's 0.5% fee on the same $100,000 income costs $500. The difference — $9,500 to $19,500 per year — represents the value capture that blockchain removes from intermediaries and returns to workers. Over a 10-year freelance career, that's $95,000 to $195,000 returned to the freelancer.</p>
            <blockquote className="mt-4 border-l-2 border-cyan-500/40 pl-4 italic text-gray-400">
              "The future of work is peer-to-peer payments. Smart contracts replace the platform as the trusted third party, but charge 40x less."
              <footer className="mt-1 text-xs text-gray-600 not-italic">— Solana Frontier Hackathon Submission, 2026</footer>
            </blockquote>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">How AI Dispute Resolution Compares to Manual Arbitration</h2>
            <p className="text-gray-300 mb-3">GigSafe resolves disputes in minutes using AI, versus weeks of manual review on traditional platforms. This speed difference fundamentally changes the risk profile of remote work.</p>
            <p>On Upwork, dispute resolution involves submitting tickets, waiting for human reviewers, and potentially escalating through multiple levels. Average resolution time ranges from 5 to 30 business days. During this period, funds remain locked and the working relationship deteriorates.</p>
            <p className="mt-3">GigSafe's AI dispute process: (1) Either party raises a dispute, changing gig status on-chain. (2) Both parties submit text evidence — deliverables, communications, original requirements. (3) Llama 3.3 70B analyzes the evidence and recommends a percentage split of the remaining escrow. (4) Either party accepts, executing the split on-chain. Total time: typically under 10 minutes.</p>
            <p className="mt-3">The AI uses platform memory signals — historical dispute patterns, completion percentages, and communication analysis — to calibrate recommendations. High milestone completion before dispute typically results in higher freelancer allocations; zero completion with evidence of non-delivery results in client refunds.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">GigSafe Technical Architecture: Solana Smart Contract</h2>
            <p className="text-gray-300 mb-3">GigSafe is built as an Anchor framework program on Solana, with 8 instructions, 13 passing tests, and deployed at program ID <code className="text-emerald-400 text-xs bg-emerald-500/10 px-1 rounded">2UFrdXwUEDtr5uXsVrCYuvnGoaESQM9UqVVovEYmsAY4</code> on devnet.</p>
            <p>The protocol uses two PDAs per gig: a <strong>GigAccount</strong> (stores metadata, status, milestones) and an <strong>Escrow Token Account</strong> (holds USDC). Both are derived deterministically from the client's public key and gig ID, making them auditable and verifiable by anyone.</p>
            <p className="mt-3">The 8 core instructions are: <code className="text-emerald-400 text-xs bg-emerald-500/10 px-1 rounded">create_gig</code>, <code className="text-emerald-400 text-xs bg-emerald-500/10 px-1 rounded">fund_gig</code>, <code className="text-emerald-400 text-xs bg-emerald-500/10 px-1 rounded">accept_gig</code>, <code className="text-emerald-400 text-xs bg-emerald-500/10 px-1 rounded">submit_milestone</code>, <code className="text-emerald-400 text-xs bg-emerald-500/10 px-1 rounded">approve_milestone</code>, <code className="text-emerald-400 text-xs bg-emerald-500/10 px-1 rounded">request_dispute</code>, <code className="text-emerald-400 text-xs bg-emerald-500/10 px-1 rounded">resolve_dispute</code>, and <code className="text-emerald-400 text-xs bg-emerald-500/10 px-1 rounded">cancel_gig</code>. Each enforces state machine transitions with proper access controls and error handling.</p>
          </div>

        </div>
      </section>

      <section id="faq" className="max-w-3xl mx-auto px-4 py-20">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-3xl font-bold text-center mb-12"
        >
          FAQ
        </motion.h2>

        <div className="space-y-4">
          {faq.map((item, i) => (
            <motion.details
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group p-5 rounded-xl bg-white/[0.02] border border-white/5"
            >
              <summary className="cursor-pointer font-semibold flex items-center justify-between list-none">
                {item.q}
                <ChevronRight className="w-4 h-4 text-gray-500 transition group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm text-gray-400 leading-relaxed">{item.a}</p>
            </motion.details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="get-started" className="max-w-6xl mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center p-12 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 border border-emerald-500/20"
        >
          <h2 className="text-4xl font-bold mb-4">
            Stop losing 20% to platforms.
          </h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Whether you're a freelancer tired of waiting for payouts, or a client who wants trustless payments — GigSafe is for you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/create"
              className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-semibold transition flex items-center gap-2"
            >
              Start Building <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="https://x.com/gigsafe_sol"
              target="_blank"
              className="px-8 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-semibold transition"
            >
              Follow @gigsafe_sol →
            </a>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center gap-4 text-center sm:text-left sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2 font-bold">
            <img src="/favicon-32x32.png" alt="GigSafe" width={18} height={18} className="rounded-sm" />
            Gig<span className="text-emerald-400">Safe</span>
          </div>
          <div className="text-sm text-gray-500">
            Built for{" "}
            <a href="https://colosseum.com/frontier" target="_blank" className="text-emerald-400 hover:underline">
              Solana Frontier Hackathon
            </a>{" "}
            2026 by{" "}
            <a href="https://x.com/gigsafe_sol" target="_blank" className="text-emerald-400 hover:underline">
              @gigsafe_sol
            </a>
          </div>
          <div className="text-xs text-gray-600">
            Powered by Solana • Non-custodial • Open source
          </div>
        </div>
      </footer>
    </div>
  );
}
