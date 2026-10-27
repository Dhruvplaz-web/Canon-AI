"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  Button,
} from "@/components/ui";

const SHORTCUTS = [
  { key: "?", description: "Open this keyboard shortcuts cheat sheet" },
  { key: "Esc", description: "Close any active modal, drawer, or dialog" },
  { key: "Tab", description: "Navigate between interactive controls" },
  { key: "Shift + Tab", description: "Navigate backwards through interactive controls" },
  { key: "Enter / Space", description: "Activate selected button, link, or tab" },
  { key: "Ctrl / Cmd + Enter", description: "Submit active form or run pre-flight check" },
];

export interface KeyboardShortcutsDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: KeyboardShortcutsDialogProps = {}) {
  const [internalOpen, setInternalOpen] = React.useState(false);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Never trigger while typing in an input, textarea, or contentEditable element
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if (isInput) return;

      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setIsOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md" aria-describedby="shortcuts-desc">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription id="shortcuts-desc">
            Use these shortcuts to navigate the Canon workspace rapidly and accessibly.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 divide-y divide-[var(--color-border-subtle)] text-xs">
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="flex items-center justify-between py-2.5">
              <span className="text-[var(--color-text-secondary)]">{s.description}</span>
              <kbd className="px-2 py-0.5 rounded border border-[var(--color-border-default)] bg-[var(--color-surface-muted)] font-mono text-[11px] font-semibold text-[var(--color-text-primary)] shadow-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Dismiss
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
