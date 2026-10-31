"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, ShieldAlert, CheckCircle2, Zap, ArrowRight, Eye, Check } from "lucide-react";

export interface AuditNotificationItem {
  id: string;
  type: "CIRCUIT_BREAKER" | "PENDING_SIGNOFF" | "OCR_SCAN" | "POLICY_PROPOSAL";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  actionUrl: string;
  severity: "CRITICAL" | "HIGH" | "INFO";
}

const INITIAL_NOTIFICATIONS: AuditNotificationItem[] = [
  {
    id: "notif-01",
    type: "CIRCUIT_BREAKER",
    title: "Meta Ads Circuit Breaker Tripped",
    description: "Campaign 'Royal Challenge Club Soda' halted on ASCI-SURR-01. ₹3,50,000 media spend protected.",
    timestamp: "2 mins ago",
    read: false,
    actionUrl: "/governance?tab=firewall",
    severity: "CRITICAL",
  },
  {
    id: "notif-02",
    type: "PENDING_SIGNOFF",
    title: "Dual-Key Review Sign-Off Required",
    description: "Submission 'Acme Q4 Global Growth' needs final sign-off from Brand Manager.",
    timestamp: "14 mins ago",
    read: false,
    actionUrl: "/review?tab=signoff",
    severity: "HIGH",
  },
  {
    id: "notif-03",
    type: "OCR_SCAN",
    title: "Dual-OCR Layout Scan Cleared",
    description: "Tesseract Tier-1 OCR parsed 4 bounding boxes for IAB 728×90 Leaderboard proof.",
    timestamp: "1 hour ago",
    read: false,
    actionUrl: "/submissions?tab=visual",
    severity: "INFO",
  },
  {
    id: "notif-04",
    type: "POLICY_PROPOSAL",
    title: "Empirical Backtest Complete",
    description: "Policy v1.1 proposal passed with 99.4% precision across 2,500 historical submissions.",
    timestamp: "3 hours ago",
    read: true,
    actionUrl: "/governance",
    severity: "INFO",
  },
];

export function NotificationCenterDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AuditNotificationItem[]>(INITIAL_NOTIFICATIONS);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-default)] transition cursor-pointer"
        aria-label={`Audit Notifications (${unreadCount} unread)`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold font-mono flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Center Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border-2 border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[var(--color-text-primary)]">
                Audit Alert Stream
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List of Notifications */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[var(--color-border-subtle)]">
            {notifications.map((notif) => (
              <Link
                key={notif.id}
                href={notif.actionUrl}
                onClick={() => {
                  markAsRead(notif.id);
                  setIsOpen(false);
                }}
                className={`p-3.5 block transition-colors hover:bg-[var(--color-surface-hover)] ${
                  notif.read ? "opacity-75" : "bg-blue-50/20 dark:bg-blue-950/10"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0">
                    {notif.type === "CIRCUIT_BREAKER" ? (
                      <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 flex items-center justify-center">
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                    ) : notif.type === "PENDING_SIGNOFF" ? (
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 flex items-center justify-center">
                        <ShieldAlert className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-600 flex items-center justify-center">
                        <Eye className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs text-[var(--color-text-primary)] truncate">
                        {notif.title}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--color-text-muted)] shrink-0">
                        {notif.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-2 leading-snug">
                      {notif.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] text-center">
            <Link
              href="/audit"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-[var(--color-primary)] hover:underline inline-flex items-center gap-1"
            >
              <span>View full cryptographic audit ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
