/**
 * Gig templates — pre-filled structures for common freelance jobs.
 * Reduces friction in gig creation.
 */

export interface GigTemplate {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  milestones: { name: string; amount: string }[];
  suggestedDeadlineDays: number;
}

export const GIG_TEMPLATES: GigTemplate[] = [
  {
    id: "landing-page",
    name: "Landing Page Design & Dev",
    category: "development",
    icon: "🌐",
    description: "Modern responsive landing page with hero section, features, pricing, testimonials, and CTA. Includes design mockups and coded implementation.",
    milestones: [
      { name: "Design Mockups", amount: "100" },
      { name: "Frontend Development", amount: "200" },
      { name: "Responsive QA & Launch", amount: "100" },
    ],
    suggestedDeadlineDays: 14,
  },
  {
    id: "smart-contract-audit",
    name: "Smart Contract Security Audit",
    category: "security",
    icon: "🔍",
    description: "Comprehensive security audit of a Solana/EVM smart contract. Includes vulnerability report, severity ratings, and remediation recommendations.",
    milestones: [
      { name: "Initial Review & Scope", amount: "200" },
      { name: "Deep Analysis & Report", amount: "500" },
      { name: "Fix Verification & Final Report", amount: "300" },
    ],
    suggestedDeadlineDays: 21,
  },
  {
    id: "logo-branding",
    name: "Logo & Brand Identity",
    category: "design",
    icon: "🎨",
    description: "Complete brand identity package including logo, color palette, typography, and brand guidelines document.",
    milestones: [
      { name: "Mood Board & Concepts", amount: "75" },
      { name: "Logo Design (3 options)", amount: "150" },
      { name: "Brand Guidelines Document", amount: "75" },
    ],
    suggestedDeadlineDays: 10,
  },
  {
    id: "technical-docs",
    name: "Technical Documentation",
    category: "writing",
    icon: "📝",
    description: "Write comprehensive technical documentation for a software project. Includes API reference, getting started guide, and deployment instructions.",
    milestones: [
      { name: "Architecture & API Reference", amount: "150" },
      { name: "User Guide & Tutorials", amount: "150" },
      { name: "Review & Polish", amount: "50" },
    ],
    suggestedDeadlineDays: 10,
  },
  {
    id: "dapp-frontend",
    name: "DApp Frontend",
    category: "development",
    icon: "⚡",
    description: "Build a web3 decentralized application frontend with wallet integration, smart contract interactions, and modern UI.",
    milestones: [
      { name: "UI/UX Design", amount: "200" },
      { name: "Core App Development", amount: "500" },
      { name: "Wallet Integration & Testing", amount: "200" },
      { name: "Deployment & QA", amount: "100" },
    ],
    suggestedDeadlineDays: 30,
  },
  {
    id: "social-media",
    name: "Social Media Campaign",
    category: "marketing",
    icon: "📱",
    description: "30-day social media campaign including content calendar, graphic assets, copy, and posting schedule for Twitter/LinkedIn.",
    milestones: [
      { name: "Strategy & Content Calendar", amount: "100" },
      { name: "Content Creation (Graphics + Copy)", amount: "200" },
      { name: "Campaign Execution & Report", amount: "100" },
    ],
    suggestedDeadlineDays: 35,
  },
  {
    id: "video-explainer",
    name: "Explainer Video",
    category: "video",
    icon: "🎬",
    description: "2-3 minute animated explainer video with script, storyboard, voiceover, and background music.",
    milestones: [
      { name: "Script & Storyboard", amount: "100" },
      { name: "Animation & Voiceover", amount: "300" },
      { name: "Revisions & Final Render", amount: "100" },
    ],
    suggestedDeadlineDays: 21,
  },
  {
    id: "data-pipeline",
    name: "Data Pipeline / ETL",
    category: "data",
    icon: "📊",
    description: "Build a data pipeline for extracting, transforming, and loading data. Includes documentation and monitoring setup.",
    milestones: [
      { name: "Architecture & Schema Design", amount: "150" },
      { name: "Pipeline Development", amount: "350" },
      { name: "Testing & Documentation", amount: "100" },
    ],
    suggestedDeadlineDays: 21,
  },
];
