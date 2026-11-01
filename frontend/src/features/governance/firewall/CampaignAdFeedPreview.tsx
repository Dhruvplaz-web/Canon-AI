"use client";

import React from "react";
import {
  ShieldAlert,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { FirewallCampaign } from "./firewallTypes";

interface CampaignAdFeedPreviewProps {
  campaign: FirewallCampaign;
}

export function CampaignAdFeedPreview({ campaign }: CampaignAdFeedPreviewProps) {
  const isMeta = campaign.network === "META_ADS";
  const isPaused = campaign.status === "PAUSED_BY_CANON_FIREWALL";
  const isCompliant = campaign.status === "COMPLIANT_VERIFIED";

  if (isMeta) {
    // Instagram / Meta Sponsored Feed Mockup
    return (
      <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-xs max-w-sm mx-auto overflow-hidden text-xs">
        {/* Instagram Header */}
        <div className="flex items-center justify-between p-3 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[1.5px]">
              <div className="w-full h-full rounded-full bg-white dark:bg-black flex items-center justify-center font-bold text-[9px]">
                {campaign.name.slice(0, 2).toUpperCase()}
              </div>
            </div>
            <div>
              <div className="font-bold text-[11px] text-[var(--color-text-primary)] leading-tight">
                {campaign.name.split(" ")[0].toLowerCase()}_official
              </div>
              <div className="text-[9px] text-[var(--color-text-muted)] flex items-center gap-1">
                <span>Sponsored</span>
                <span>•</span>
                <span className="font-mono text-[8px]">{campaign.networkAccountId}</span>
              </div>
            </div>
          </div>
          <MoreHorizontal className="w-4 h-4 text-[var(--color-text-muted)]" />
        </div>

        {/* Ad Image / Graphic Container */}
        <div className="relative aspect-square bg-gradient-to-br from-slate-900 to-neutral-800 p-6 flex flex-col justify-between text-white overflow-hidden select-none">
          {/* Containment Overlay if Paused */}
          {isPaused && (
            <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-500 border border-rose-500/30 flex items-center justify-center mb-2">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <span className="text-xs font-bold text-rose-400 font-mono">
                AD DELIVERY HALTED BY CANON
              </span>
              <p className="text-[10px] text-slate-300 mt-1 max-w-xs">
                {campaign.detectedInfraction?.ruleTitle || "Statutory Breach Intercepted"}
              </p>
            </div>
          )}

          <div className="space-y-1">
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block">
              {campaign.creative.channel}
            </span>
            <h4 className="text-base font-extrabold tracking-tight text-white leading-snug">
              {campaign.creative.headline}
            </h4>
          </div>

          <div className="p-3 rounded-lg bg-black/40 backdrop-blur-xs border border-white/10 text-[10px] text-slate-200">
            {campaign.remediatedCopy || campaign.creative.bodyCopy}
          </div>
        </div>

        {/* Post Action Buttons */}
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="w-4 h-4 text-[var(--color-text-muted)]" />
              <MessageCircle className="w-4 h-4 text-[var(--color-text-muted)]" />
              <Send className="w-4 h-4 text-[var(--color-text-muted)]" />
            </div>
            <Bookmark className="w-4 h-4 text-[var(--color-text-muted)]" />
          </div>

          {/* Caption with Highlighted Infractions */}
          <div className="text-[11px] leading-relaxed">
            <span className="font-bold text-[var(--color-text-primary)] mr-1.5">
              {campaign.name.split(" ")[0].toLowerCase()}_official
            </span>
            <span className="text-[var(--color-text-secondary)]">
              {campaign.remediatedCopy || campaign.creative.bodyCopy}
            </span>
          </div>

          {/* Compliance Status Chip */}
          <div className="pt-2 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[10px] font-mono">
            <span>Status:</span>
            <span
              className={`font-bold ${
                isPaused
                  ? "text-rose-500"
                  : isCompliant
                  ? "text-emerald-500"
                  : "text-amber-500"
              }`}
            >
              {isPaused
                ? "PAUSED (FIREWALL)"
                : isCompliant
                ? "COMPLIANT VERIFIED"
                : "PENDING AUDIT"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Google Search Sponsored Ad Mockup
  return (
    <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-xs max-w-sm mx-auto p-4 space-y-2 text-xs">
      <div className="flex items-center gap-1.5 text-[11px]">
        <span className="font-bold text-slate-900 dark:text-slate-100">Sponsored</span>
        <span className="text-slate-400">•</span>
        <span className="text-slate-500 text-[10px] truncate max-w-xs">
          {campaign.creative.landingUrl}
        </span>
      </div>

      <div className="font-bold text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer leading-tight">
        {campaign.creative.headline}
      </div>

      <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
        {campaign.remediatedCopy || campaign.creative.bodyCopy}
      </p>

      {/* Infraction / Compliance Banner */}
      <div className="pt-2 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[10px] font-mono">
        <span className="text-[var(--color-text-muted)]">Google Ads ID: {campaign.campaignIdExternal}</span>
        <span
          className={`font-bold ${
            isPaused
              ? "text-rose-500"
              : isCompliant
              ? "text-emerald-500"
              : "text-blue-500"
          }`}
        >
          {isPaused ? "CAMPAIGN MUTATED: PAUSED" : "RUNNING"}
        </span>
      </div>
    </div>
  );
}
