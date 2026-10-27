"use client";

import * as React from "react";
import { AlertOctagon, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { Badge } from "./Badge";

export type SeverityType = "CRITICAL" | "WARNING" | "INFO" | "PASSED";

export interface StatusBadgeProps {
  severity?: SeverityType | string;
  status?: SeverityType | string;
  className?: string;
  showIcon?: boolean;
}

export function StatusBadge({
  severity,
  status,
  className,
  showIcon = true,
}: StatusBadgeProps) {
  const raw = severity || status || "INFO";
  const norm = raw.toUpperCase();

  switch (norm) {
    case "CRITICAL":
      return (
        <Badge variant="critical" className={className}>
          {showIcon && <AlertOctagon className="w-3 h-3 text-[var(--status-critical-accent)]" aria-hidden="true" />}
          <span>CRITICAL</span>
        </Badge>
      );
    case "WARNING":
    case "MAJOR":
      return (
        <Badge variant="warning" className={className}>
          {showIcon && <AlertTriangle className="w-3 h-3 text-[var(--status-warn-accent)]" aria-hidden="true" />}
          <span>WARNING</span>
        </Badge>
      );
    case "INFO":
    case "MINOR":
      return (
        <Badge variant="info" className={className}>
          {showIcon && <Info className="w-3 h-3 text-[var(--status-minor-accent)]" aria-hidden="true" />}
          <span>INFO</span>
        </Badge>
      );
    case "PASSED":
    case "SUCCESS":
      return (
        <Badge variant="success" className={className}>
          {showIcon && <CheckCircle2 className="w-3 h-3 text-[var(--status-pass-accent)]" aria-hidden="true" />}
          <span>PASSED</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className={className}>
          <span>{severity}</span>
        </Badge>
      );
  }
}
