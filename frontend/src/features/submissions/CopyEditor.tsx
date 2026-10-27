"use client";

import React, { useRef, useEffect } from "react";

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
}

export function CopyEditor({
  content,
  onChange,
  findings = [],
  selectedFindingId = null,
  onSelectFinding,
  title,
  onTitleChange,
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

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div className="flex flex-col rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-xs overflow-hidden">
      {/* Title Input Bar */}
      <div className="px-4 py-2.5 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] flex items-center justify-between gap-4">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Draft Submission Title..."
          className="bg-transparent text-sm font-semibold text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none flex-1"
          aria-label="Submission Title"
        />
        <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--color-text-muted)] shrink-0">
          <span>{wordCount} words</span>
          <span>&bull;</span>
          <span>{charCount} chars</span>
        </div>
      </div>

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
