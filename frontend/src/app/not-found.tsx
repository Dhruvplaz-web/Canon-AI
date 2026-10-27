import Link from "next/link";
import { AlertTriangle, ArrowLeft, Home, FileText, CheckCircle2 } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center text-[#111827]">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-6 shadow-xs">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-800 text-xs font-mono font-medium mb-4">
        HTTP 404 · Resource Not Found
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
        Page Not Located
      </h1>
      <p className="text-sm text-[#4B5563] max-w-md mx-auto mb-8 leading-relaxed">
        The requested URL does not exist in the active Canon workspace or the route has been migrated to a new policy namespace.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="neo-btn neo-btn-teal flex items-center gap-2 px-4 py-2.5 text-xs font-semibold"
        >
          <Home className="w-4 h-4" />
          <span>Return Home</span>
        </Link>

        <Link
          href="/submissions"
          className="neo-btn neo-btn-white flex items-center gap-2 px-4 py-2.5 text-xs font-semibold"
        >
          <FileText className="w-4 h-4" />
          <span>Creator Studio</span>
        </Link>

        <Link
          href="/demo"
          className="neo-btn neo-btn-white flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#2563EB]"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Evaluator Demo</span>
        </Link>
      </div>

      <div className="mt-12 pt-6 border-t border-[#E5E7EB] max-w-sm w-full text-xs text-[#6B7280]">
        <p>Looking for API documentation? See <Link href="/transparency" className="underline hover:text-[#2563EB]">AI Transparency Ledger</Link> or consult <Link href="/llms.txt" className="font-mono text-[#2563EB]">llms.txt</Link>.</p>
      </div>
    </div>
  );
}
