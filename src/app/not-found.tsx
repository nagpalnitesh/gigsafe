import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <div className="text-8xl font-black text-emerald-500/10 mb-4">404</div>
      <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
      <p className="text-gray-400 mb-8">
        This page doesn&apos;t exist. Maybe the gig was cancelled?
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/"
          className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black text-sm font-semibold transition"
        >
          Go Home
        </Link>
        <Link
          href="/gigs"
          className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold transition"
        >
          Browse Gigs
        </Link>
      </div>
    </div>
  );
}
