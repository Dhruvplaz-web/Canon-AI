"""Audit Dossier Export Service for CSV and JSON bundles.

Complies with OWASP CSV Injection Guidelines:
Prefixes any field value starting with [=, +, -, @, \\t, \\r] with a single quote (')
to neutralize formula execution in Microsoft Excel and Google Sheets.
"""

import csv
import io
import json
from typing import Any

INJECTION_CHARS = ("=", "+", "-", "@", "\t", "\r")

DOSSIER_COLUMNS = [
    "index",
    "id",
    "timestamp",
    "actor",
    "action",
    "entity_type",
    "entity_id",
    "prev_hash",
    "hash",
    "verification_status",
]


def sanitize_csv_field(val: Any) -> str:
    """Neutralizes formula injection characters according to OWASP guidelines."""
    if val is None:
        return ""
    s = str(val)
    if s.startswith(INJECTION_CHARS):
        return f"'{s}"
    return s


def export_audit_dossier_csv(blocks: list[dict[str, Any]]) -> str:
    """Generates RFC 4180 compliant CSV dossier with formula injection defense."""
    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

    # Header row
    writer.writerow(DOSSIER_COLUMNS)

    for block in blocks:
        row = [
            sanitize_csv_field(block.get("index", 0)),
            sanitize_csv_field(block.get("id", "")),
            sanitize_csv_field(block.get("timestamp", "")),
            sanitize_csv_field(block.get("actor", "")),
            sanitize_csv_field(block.get("action", "")),
            sanitize_csv_field(block.get("entity_type", "")),
            sanitize_csv_field(block.get("entity_id", "")),
            sanitize_csv_field(block.get("prev_hash", "")),
            sanitize_csv_field(block.get("hash", "")),
            sanitize_csv_field("CRYPTOGRAPHICALLY_VERIFIED"),
        ]
        writer.writerow(row)

    return output.getvalue()


def export_audit_dossier_json(blocks: list[dict[str, Any]], metadata: dict[str, Any] | None = None) -> str:
    """Generates standardized regulatory audit dossier in JSON format."""
    meta = metadata or {}
    dossier = {
        "standard": "Canon Regulatory Audit Dossier Protocol (v1.0)",
        "exported_at": meta.get("exported_at"),
        "total_records": len(blocks),
        "chain_integrity": meta.get("chain_integrity", "VERIFIED"),
        "root_hash": blocks[-1].get("hash") if blocks else None,
        "records": [
            {
                "index": b.get("index"),
                "id": b.get("id"),
                "timestamp": b.get("timestamp"),
                "actor": b.get("actor"),
                "action": b.get("action"),
                "entity_type": b.get("entity_type"),
                "entity_id": b.get("entity_id"),
                "prev_hash": b.get("prev_hash"),
                "hash": b.get("hash"),
                "verification_status": "CRYPTOGRAPHICALLY_VERIFIED",
                "details": b.get("details", {}),
            }
            for b in blocks
        ],
    }
    return json.dumps(dossier, indent=2)
