"use client";

import React, { useRef, useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export interface FindingSpan {
  id: string;
  start_offset: number;
  end_offset: number;
  severity: "CRITICAL" | "WARNING" | "INFO";
}

interface CopyEditorProps {
  content: string;
  onChange: (val: string) => void;
  findings?: FindingSpan[];
  selectedFindingId?: string | null;
  onSelectFinding?: (id: string) => void;
  title: string;
  onTitleChange: (val: string) => void;
  channel?: string;
}

export function CopyEditor({
  content,
  onChange,
  findings = [],
  selectedFindingId = null,
  onSelectFinding,
  title,
  onTitleChange,
  channel,
}: CopyEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Sync scroll between textarea and backdrop
  const handleScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Scroll to selected finding span
  useEffect(() => {
    if (!selectedFindingId || !textareaRef.current) return;
    const target = findings.find((f) => f.id === selectedFindingId);
    if (!target) return;

    // Focus textarea and set selection range
    try {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(target.start_offset, target.end_offset);
    } catch {
      // Ignore if out of range
    }
  }, [selectedFindingId, findings]);

  // Compute highlight spans for backdrop
  const renderBackdropSpans = () => {
    if (!findings || findings.length === 0) {
      return <span>{content}</span>;
    }

    // Sort findings by start_offset
    const sorted = [...findings]
      .filter((f) => f.start_offset >= 0 && f.end_offset <= content.length && f.start_offset < f.end_offset)
      .sort((a, b) => a.start_offset - b.start_offset);

    const segments: React.ReactNode[] = [];
    let currentIdx = 0;

    sorted.forEach((f, idx) => {
      // Prevent overlapping index errors
      if (f.start_offset < currentIdx) return;

      // Plain unhighlighted text before finding
      if (f.start_offset > currentIdx) {
        segments.push(
          <span key={`plain-${currentIdx}`}>
            {content.substring(currentIdx, f.start_offset)}
          </span>
        );
      }

      const isSelected = selectedFindingId === f.id;
      const highlightClass =
        f.severity === "CRITICAL"
          ? isSelected
            ? "bg-rose-500/40 text-transparent border-b-2 border-rose-600 dark:border-rose-400"
            : "bg-rose-500/20 text-transparent border-b border-rose-500"
          : isSelected
          ? "bg-amber-500/40 text-transparent border-b-2 border-amber-600 dark:border-amber-400"
          : "bg-amber-500/20 text-transparent border-b border-amber-500";

      segments.push(
        <mark
          key={`highlight-${f.id}-${idx}`}
          className={`rounded-xs transition-colors p-0 font-inherit ${highlightClass}`}
        >
          {content.substring(f.start_offset, f.end_offset)}
        </mark>
      );

      currentIdx = f.end_offset;
    });

    if (currentIdx < content.length) {
      segments.push(
        <span key={`plain-tail-${currentIdx}`}>
          {content.substring(currentIdx)}
        </span>
      );
    }

    return segments;
  };

  const trimmedContent = content.trim();
  const wordCount = trimmedContent ? trimmedContent.split(/\s+/).length : 0;
  const charCount = content.length;
  const readingTime = wordCount === 0 ? "0 min read" : `${(wordCount / 200).toFixed(1)} min read`;

  const isAdCopy = channel === "ad_copy";
  const adCopyLimit = 280;
  const isAdOverLimit = isAdCopy && charCount > adCopyLimit;
  const adCharsRemaining = isAdCopy ? adCopyLimit - charCount : null;

  return (
    <div className="flex flex-col rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-xs overflow-hidden">
      {/* Title & Metadata Input Bar */}
      <div className="px-4 py-2.5 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Draft Submission Title..."
          className="bg-transparent text-sm font-semibold text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none flex-1 min-w-[200px]"
          aria-label="Submission Title"
        />
        <div className="flex items-center flex-wrap gap-2 text-[11px] font-mono shrink-0">
          <span className="px-2 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] font-semibold">
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>
          <span
            className={`px-2 py-0.5 rounded border font-semibold ${
              isAdOverLimit
                ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                : "bg-[var(--color-surface)] border-[var(--color-border-subtle)] text-[var(--color-text-primary)]"
            }`}
          >
            {isAdCopy ? `${charCount} / ${adCopyLimit} chars` : `${charCount} chars`}
          </span>
          <span className="px-2 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-muted)]">
            {readingTime}
          </span>
          {isAdCopy && (
            <span
              className={`px-2 py-0.5 rounded border font-semibold ${
                isAdOverLimit
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {isAdOverLimit ? `+${charCount - adCopyLimit} over limit` : `${adCharsRemaining} left`}
            </span>
          )}
        </div>
      </div>

      {/* Channel Constraint Warning Banner (Ad Copy > 280 chars) */}
      {isAdOverLimit && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Channel Constraint:</strong> Paid ad copy exceeds the standard 280-character limit ({charCount} / 280 chars, <strong>{charCount - adCopyLimit} characters over</strong>). Text may be truncated in ad placements.
          </span>
        </div>
      )}

      {/* Synchronized Editor Viewport */}
      <div className="relative h-[420px] font-mono text-xs leading-relaxed">
        {/* Backdrop Highlight Layer */}
        <div
          ref={backdropRef}
          aria-hidden="true"
          className="absolute inset-0 p-4 overflow-y-auto whitespace-pre-wrap break-words pointer-events-none text-transparent select-none z-0"
        >
          {renderBackdropSpans()}
        </div>

        {/* Interactive Textarea Layer */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          placeholder="Type or paste draft marketing copy here..."
          spellCheck={false}
          className="absolute inset-0 p-4 w-full h-full resize-none bg-transparent text-[var(--color-text-primary)] focus:outline-none leading-relaxed whitespace-pre-wrap break-words z-10 font-mono text-xs selection:bg-blue-500/30"
          aria-label="Marketing Copy Body Text"
        />
      </div>
    </div>
  );
}
