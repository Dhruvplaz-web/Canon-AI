/**
 * Calculates genuine SHA-256 cryptographic hash of any uploaded file
 * for Indian Evidence Act Section 65B legal admissibility.
 * Uses browser-native Web Crypto API (zero external runtime dependencies).
 */
export async function calculateFileSha256(file: File | Blob): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface MerkleEvidenceAttestation {
  merkleRoot: string;
  leafHashes: {
    binarySha256: string;
    geometryLayoutHash: string;
    statutoryViolationsHash: string;
    timestampHash: string;
  };
  certifiedTimestamp: string;
  legalStandard: string;
}

/**
 * Computes a verifiable cryptographic Merkle tree combining binary creative hash,
 * bounding-box layout geometry, and statutory violations for immutable court submission.
 */
export async function generateMerkleAttestation(
  binarySha256: string,
  geometryPayload: unknown,
  violationsPayload: unknown,
  timestamp: string
): Promise<MerkleEvidenceAttestation> {
  const encoder = new TextEncoder();

  const hashString = async (str: string): Promise<string> => {
    const buffer = await crypto.subtle.digest("SHA-256", encoder.encode(str));
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  const geometryLayoutHash = await hashString(JSON.stringify(geometryPayload));
  const statutoryViolationsHash = await hashString(JSON.stringify(violationsPayload));
  const timestampHash = await hashString(timestamp);

  // Level 1 hashes
  const leftBranch = await hashString(`${binarySha256}:${geometryLayoutHash}`);
  const rightBranch = await hashString(`${statutoryViolationsHash}:${timestampHash}`);

  // Merkle Root
  const merkleRoot = await hashString(`${leftBranch}:${rightBranch}`);

  return {
    merkleRoot,
    leafHashes: {
      binarySha256,
      geometryLayoutHash,
      statutoryViolationsHash,
      timestampHash,
    },
    certifiedTimestamp: timestamp,
    legalStandard: "Section 65B Indian Evidence Act 1872 & IT Act 2000 Rule 3",
  };
}


