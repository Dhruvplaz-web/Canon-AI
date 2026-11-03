/**
 * Canonical Cryptographic Hash Chain Verifier & Audit Ledger Service.
 * Implements Canon's 3rd Core Invariant: Append-only verifiable audit trail.
 */

import crypto from "crypto";

export const GENESIS_PREV_HASH = "0".repeat(64);

export interface AuditBlock {
  index: number;
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entity_type: string;
  entity_id: string;
  payload_hash: string;
  prev_hash: string;
  hash: string;
  details?: Record<string, unknown>;
}

export interface ChainVerificationReport {
  is_valid: boolean;
  total_blocks: number;
  verified_blocks: number;
  broken_links: number;
  failed_at_index?: number;
  failure_reason?: string;
  root_hash: string | null;
  genesis_hash?: string;
  message: string;
}

export function computePayloadHash(payload: unknown): string {
  if (payload === null || payload === undefined) {
    return crypto.createHash("sha256").update("").digest("hex");
  }
  const serialized =
    typeof payload === "string" ? payload : JSON.stringify(payload);
  return crypto.createHash("sha256").update(serialized).digest("hex");
}

export function computeBlockHash(
  index: number,
  timestamp: string,
  action: string,
  entityId: string,
  payloadHash: string,
  prevHash: string
): string {
  const canonicalRepr = `${index}:${timestamp}:${action}:${entityId}:${payloadHash}:${prevHash}`;
  return crypto.createHash("sha256").update(canonicalRepr).digest("hex");
}

export function buildAuditChain(
  rawEntries: Array<{
    id?: string;
    timestamp?: string;
    actor?: string;
    action?: string;
    entity_type?: string;
    entity_id?: string;
    payload?: unknown;
  }>
): AuditBlock[] {
  const chain: AuditBlock[] = [];
  let currentPrevHash = GENESIS_PREV_HASH;

  rawEntries.forEach((entry, idx) => {
    const ts = entry.timestamp || new Date(Date.now() - (rawEntries.length - idx) * 60000).toISOString();
    const act = entry.action || "UNKNOWN_ACTION";
    const entityId = entry.entity_id || `ent_${idx}`;
    const pHash = computePayloadHash(entry.payload);

    const blockHash = computeBlockHash(idx, ts, act, entityId, pHash, currentPrevHash);

    const block: AuditBlock = {
      index: idx,
      id: entry.id || `aud_blk_${idx.toString().padStart(4, "0")}`,
      timestamp: ts,
      actor: entry.actor || "Authorized Reviewer",
      action: act,
      entity_type: entry.entity_type || "SUBMISSION",
      entity_id: entityId,
      payload_hash: pHash,
      prev_hash: currentPrevHash,
      hash: blockHash,
      details: (entry.payload as Record<string, unknown>) || {},
    };

    chain.push(block);
    currentPrevHash = blockHash;
  });

  return chain;
}

export function verifyAuditChain(blocks: AuditBlock[]): ChainVerificationReport {
  if (!Array.isArray(blocks)) {
    return {
      is_valid: false,
      total_blocks: 0,
      verified_blocks: 0,
      broken_links: 0,
      root_hash: null,
      failure_reason: "INVALID_INPUT",
      message: "Input must be an array of audit blocks.",
    };
  }

  const total = blocks.length;
  if (total === 0) {
    return {
      is_valid: true,
      total_blocks: 0,
      verified_blocks: 0,
      broken_links: 0,
      root_hash: null,
      message: "Genesis state valid (0 blocks in chain).",
    };
  }

  for (let i = 0; i < total; i++) {
    const block = blocks[i];

    if (!block || typeof block !== "object") {
      return {
        is_valid: false,
        total_blocks: total,
        verified_blocks: i,
        broken_links: 1,
        failed_at_index: i,
        failure_reason: "MALFORMED_RECORD",
        root_hash: null,
        message: `Block at index ${i} is malformed.`,
      };
    }

    if (block.index !== i) {
      return {
        is_valid: false,
        total_blocks: total,
        verified_blocks: i,
        broken_links: 1,
        failed_at_index: i,
        failure_reason: "REORDERED_OR_MISSING_BLOCK",
        root_hash: null,
        message: `Block sequence break at position ${i}: expected index ${i}, got ${block.index}.`,
      };
    }

    const expectedPrev = i === 0 ? GENESIS_PREV_HASH : blocks[i - 1].hash;
    if (block.prev_hash !== expectedPrev) {
      return {
        is_valid: false,
        total_blocks: total,
        verified_blocks: i,
        broken_links: 1,
        failed_at_index: i,
        failure_reason: "BROKEN_CHAIN_LINK",
        root_hash: null,
        message: `Cryptographic link broken at Block #${i}: prev_hash does not match predecessor Block #${i - 1}.`,
      };
    }

    const pHash = block.payload_hash || computePayloadHash(block.details);
    const recomputed = computeBlockHash(
      block.index,
      block.timestamp,
      block.action,
      block.entity_id,
      pHash,
      block.prev_hash
    );

    if (recomputed !== block.hash) {
      return {
        is_valid: false,
        total_blocks: total,
        verified_blocks: i,
        broken_links: 1,
        failed_at_index: i,
        failure_reason: "ALTERED_RECORD_CONTENT",
        root_hash: null,
        message: `Data tampering detected at Block #${i} (${block.action}): recomputed SHA-256 hash does not match stored block hash.`,
      };
    }
  }

  return {
    is_valid: true,
    total_blocks: total,
    verified_blocks: total,
    broken_links: 0,
    genesis_hash: blocks[0].hash,
    root_hash: blocks[total - 1].hash,
    message: `100% Cryptographic Integrity Verified: ${total} / ${total} blocks verified with zero broken links. Root Hash: ${blocks[total - 1].hash.slice(0, 16)}...`,
  };
}

export const CANONICAL_AUDIT_LOGS = [
  {
    id: "aud_blk_0000",
    timestamp: "2026-10-29T08:00:00.000Z",
    actor: "Alice BrandManager (admin)",
    action: "GENESIS_WORKSPACE_INITIALIZED",
    entity_type: "WORKSPACE",
    entity_id: "ws_acme_corp",
    payload: { name: "Acme Financial Technologies", jurisdiction: "US_FEDERAL" },
  },
  {
    id: "aud_blk_0001",
    timestamp: "2026-10-29T08:30:00.000Z",
    actor: "Alice BrandManager (admin)",
    action: "POLICY_ADOPT_V1_0",
    entity_type: "POLICY_VERSION",
    entity_id: "pol_v1_0",
    payload: { version: "1.0", compiled_rules_count: 12, approved_claims_count: 3 },
  },
  {
    id: "aud_blk_0002",
    timestamp: "2026-10-29T09:15:00.000Z",
    actor: "Charlie Creator (author)",
    action: "SUBMISSION_CREATED",
    entity_type: "SUBMISSION",
    entity_id: "sub_q1_growth_ad",
    payload: { title: "Q1 Digital Treasury Campaign", channel: "ad_copy" },
  },
  {
    id: "aud_blk_0003",
    timestamp: "2026-10-29T09:16:00.000Z",
    actor: "Automated Pre-Flight Engine",
    action: "COMPLIANCE_CHECK_RUN",
    entity_type: "CHECK_RUN",
    entity_id: "chk_0916_ad",
    payload: { total_findings: 2, critical_count: 1, flagged_rules: ["TERM-001", "TERM-006"] },
  },
  {
    id: "aud_blk_0004",
    timestamp: "2026-10-29T09:45:00.000Z",
    actor: "Rachel Reviewer (compliance)",
    action: "FINDING_OVERRIDE_RECORDED",
    entity_type: "FINDING",
    entity_id: "fnd_term_006",
    payload: { rule_code: "TERM-006", reason_code: "CO_MARKETING_EXCLUSION", notes: "Qualifying disclaimer inserted in footnote." },
  },
  {
    id: "aud_blk_0005",
    timestamp: "2026-10-29T10:00:00.000Z",
    actor: "Rachel Reviewer (compliance)",
    action: "FINAL_SIGNOFF_CERTIFICATE_ISSUED",
    entity_type: "RELEASE_CERTIFICATE",
    entity_id: "cert_acme_2026_01",
    payload: { certificate_id: "CERT-ACME-20261029-A1B2C3D4", standard: "Canon EU AI Act Art. 14 Attestation" },
  },
];

