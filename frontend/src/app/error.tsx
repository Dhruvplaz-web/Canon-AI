"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertOctagon, RotateCcw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log exception to console for audit trail
    console.error("Canon Runtime Error Caught:", error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center text-[#111827]">
      <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mb-6 shadow-xs">
        <AlertOctagon className="w-8 h-8" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-red-200 bg-red-50 text-red-800 text-xs font-mono font-medium mb-4">
        HTTP 500 · System Exception Intercepted
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
        Unexpected Execution Anomaly
      </h1>
      <p className="text-sm text-[#4B5563] max-w-md mx-auto mb-8 leading-relaxed">
        The application encountered an unexpected boundary condition. The deterministic audit pipeline has preserved your session state.
      </p>

      {error.digest && (
        <p className="font-mono text-xs text-[#9CA3AF] mb-6 bg-[#F3F4F6] px-3 py-1.5 rounded-lg border border-[#E5E7EB]">
          Error Digest: {error.digest}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          type="button"
          className="neo-btn neo-btn-teal flex items-center gap-2 px-4 py-2.5 text-xs font-semibold"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Retry Operation</span>
        </button>

        <Link
          href="/"
          className="neo-btn neo-btn-white flex items-center gap-2 px-4 py-2.5 text-xs font-semibold"
        >
          <Home className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
