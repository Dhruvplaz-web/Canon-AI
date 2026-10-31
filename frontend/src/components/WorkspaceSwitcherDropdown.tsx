"use client";

import React, { useState, useRef, useEffect } from "react";
import { Building2, ChevronDown, Check, Plus, Shield, Globe } from "lucide-react";

export interface WorkspaceOrg {
  id: string;
  name: string;
  regulators: string;
  region: string;
  active: boolean;
}

const WORKSPACES: WorkspaceOrg[] = [
  {
    id: "wks_01j7acme_india",
    name: "Acme Financial (India)",
    regulators: "RBI • ASCI • CCPA",
    region: "IN / INR",
    active: true,
  },
  {
    id: "wks_01j7acme_uk",
    name: "Acme Global Wealth (UK)",
    regulators: "FCA • ASA • CMA",
    region: "GB / GBP",
    active: false,
  },
  {
    id: "wks_01j7acme_us",
    name: "Acme Digital Assets (US)",
    regulators: "SEC • FTC • CFPB",
    region: "US / USD",
    active: false,
  },
];

export function WorkspaceSwitcherDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkspaceOrg[]>(WORKSPACES);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("reviewer");
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeWorkspace = workspaces.find((w) => w.active) || workspaces[0];

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

  const handleSelectWorkspace = (id: string) => {
    setWorkspaces((prev) =>
      prev.map((w) => ({
        ...w,
        active: w.id === id,
      }))
    );
    setIsOpen(false);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviteSuccess(true);
    setTimeout(() => {
      setIsInviteOpen(false);
      setInviteSuccess(false);
      setInviteEmail("");
    }, 1200);
  };

  return (
    <>
      <div className="relative hidden lg:block" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-default)] transition text-xs font-semibold cursor-pointer"
        >
          <Building2 className="w-3.5 h-3.5 text-blue-500" />
          <span className="truncate max-w-[150px]">{activeWorkspace.name}</span>
          <ChevronDown className="w-3 h-3 text-[var(--color-text-muted)]" />
        </button>

        {isOpen && (
          <div className="absolute left-0 mt-2 w-72 rounded-2xl border-2 border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Active Organization
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 font-bold">
                Multi-Tenant
              </span>
            </div>

            <div className="p-2 space-y-1">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => handleSelectWorkspace(ws.id)}
                  className={`w-full p-2.5 rounded-xl text-left transition flex items-center justify-between text-xs ${
                    ws.active
                      ? "bg-blue-500/10 text-[var(--color-text-primary)] font-bold border border-blue-500/30"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-500" />
                      <span>{ws.name}</span>
                    </div>
                    <div className="text-[10px] font-mono text-[var(--color-text-muted)]">
                      {ws.regulators}
                    </div>
                  </div>
                  {ws.active && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                </button>
              ))}
            </div>

            <div className="p-2 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)]">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsInviteOpen(true);
                }}
                className="w-full py-2 px-3 rounded-lg border border-dashed border-[var(--color-border-default)] hover:bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] font-semibold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5 text-blue-500" />
                <span>Invite Team Member</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[var(--color-surface)] border-2 border-[var(--color-border-subtle)] rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-[var(--color-text-primary)]">
                  Invite Compliance Teammate
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-sm"
              >
                ✕
              </button>
            </div>

            {inviteSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold text-center">
                Invitation sent successfully with RBAC role delegation!
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-[var(--color-text-secondary)]">
                    Work Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="counsel@acmefinancial.com"
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-[var(--color-text-secondary)]">
                    Assigned RBAC Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="creator">Creator (Copywriter authoring drafts)</option>
                    <option value="reviewer">Reviewer (Compliance officer adjudicating findings)</option>
                    <option value="brand_manager">Brand Manager (Dual-key release signoff authority)</option>
                    <option value="legal_counsel">Legal Counsel (Statutory regulatory oversight)</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInviteOpen(false)}
                    className="px-3.5 py-2 rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#111111] dark:bg-white text-white dark:text-black font-semibold rounded-xl"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
