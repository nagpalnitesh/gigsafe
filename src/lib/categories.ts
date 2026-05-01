/**
 * Gig categories for discovery and filtering.
 */

export interface Category {
  id: string;
  label: string;
  icon: string; // emoji
  description: string;
}

export const GIG_CATEGORIES: Category[] = [
  { id: "development", label: "Development", icon: "💻", description: "Web, mobile, smart contracts, backend" },
  { id: "design", label: "Design", icon: "🎨", description: "UI/UX, branding, graphics, illustrations" },
  { id: "writing", label: "Writing", icon: "✍️", description: "Content, copywriting, technical docs" },
  { id: "marketing", label: "Marketing", icon: "📢", description: "SEO, social media, growth, ads" },
  { id: "video", label: "Video & Animation", icon: "🎬", description: "Editing, motion graphics, 3D" },
  { id: "audio", label: "Audio & Music", icon: "🎵", description: "Production, voiceover, podcasting" },
  { id: "consulting", label: "Consulting", icon: "💼", description: "Strategy, advisory, coaching" },
  { id: "data", label: "Data & AI", icon: "📊", description: "Analytics, ML models, data pipelines" },
  { id: "security", label: "Security", icon: "🔒", description: "Audits, pen testing, smart contract review" },
  { id: "translation", label: "Translation", icon: "🌍", description: "Languages, localization, transcription" },
  { id: "other", label: "Other", icon: "📦", description: "Everything else" },
];

export function getCategoryById(id: string): Category | undefined {
  return GIG_CATEGORIES.find((c) => c.id === id);
}

export function getCategoryLabel(id: string): string {
  return getCategoryById(id)?.label ?? id;
}
