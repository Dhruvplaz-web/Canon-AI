"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Lock, ArrowRight, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from "@/components/ui";

interface SessionExpiredEventDetail {
  draftText?: string;
  sourceView?: string;
}

export function SessionExpiredDialog() {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [draftBackup, setDraftBackup] = React.useState<string | null>(null);

  React.useEffect(() => {
    function handleSessionExpired(event: Event) {
      const customEvent = event as CustomEvent<SessionExpiredEventDetail>;
      const text = customEvent.detail?.draftText;
      if (text) {
        setDraftBackup(text);
        try {
          localStorage.setItem("canon_draft_backup", text);
          localStorage.setItem("canon_draft_backup_timestamp", new Date().toISOString());
        } catch {
          // Ignore localStorage errors
        }
      }
      setIsOpen(true);
    }

    window.addEventListener("canon:session-expired", handleSessionExpired);
    return () => window.removeEventListener("canon:session-expired", handleSessionExpired);
  }, []);

  const handleSignInAgain = () => {
    setIsOpen(false);
    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
    router.push(`/login?returnUrl=${returnUrl}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="w-10 h-10 rounded-full bg-[var(--status-critical-bg)] text-[var(--status-critical-accent)] flex items-center justify-center mb-2">
            <Lock className="w-5 h-5 stroke-[2]" />
          </div>
          <DialogTitle>Your Session Has Expired</DialogTitle>
          <DialogDescription>
            Your authentication token is no longer active. To protect your workspace, please sign in again.
          </DialogDescription>
        </DialogHeader>

        {draftBackup && (
          <div className="p-3 rounded-lg border border-[var(--status-pass-border)] bg-[var(--status-pass-bg)] text-xs text-[var(--status-pass)] flex items-start gap-2.5">
            <Save className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Unsaved Draft Preserved</p>
              <p className="text-[11px] opacity-90 mt-0.5">
                Your draft ({draftBackup.length} characters) was safely backed up and will be restored upon sign-in.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="mt-2">
          <Button variant="primary" onClick={handleSignInAgain} className="w-full">
            <span>Sign In to Continue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Dispatches a global session expired notification preserving any draft text.
 */
export function triggerSessionExpired(draftText?: string, sourceView?: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("canon:session-expired", {
        detail: { draftText, sourceView },
      })
    );
  }
}
