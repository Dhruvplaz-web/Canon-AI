"use client";

import * as React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col items-center justify-center p-6 bg-neutral-900 text-white font-sans">
        <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-500/30 text-red-400 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Application Boundary Fault</h1>
        <p className="text-sm text-neutral-400 mb-6 max-w-md text-center">
          A critical system boundary fault occurred. Your state is preserved.
        </p>
        {error?.digest && (
          <p className="text-xs font-mono text-neutral-500 mb-6 bg-neutral-800 px-3 py-1.5 rounded">
            Diagnostic ID: {error.digest}
          </p>
        )}
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reload Application</span>
        </button>
      </body>
    </html>
  );
}

