"""Unicode NFKC normalization and bi-directional character offset mapping service."""

import unicodedata


def normalize_text(raw_text: str) -> tuple[str, list[int]]:
    """
    Normalizes raw document text using Unicode NFKC normalization while building
    a bi-directional character offset map.

    Returns:
        tuple of (normalized_text, offset_map) where offset_map[normalized_idx]
        stores the exact character index in the original raw_text.
    """
    if not raw_text:
        return "", []

    normalized_chars: list[str] = []
    offset_map: list[int] = []

    for raw_idx, char in enumerate(raw_text):
        # Normalize each character into NFKC decomposition/composition
        nfkc_char = unicodedata.normalize("NFKC", char)

        # Replace non-breaking spaces with standard space
        if nfkc_char == "\u00a0":
            nfkc_char = " "

        # Each decomposed character points back to the original raw index
        for sub_char in nfkc_char:
            normalized_chars.append(sub_char)
            offset_map.append(raw_idx)

    normalized_text = "".join(normalized_chars)
    return normalized_text, offset_map


def map_span_to_raw(
    start_norm: int,
    end_norm: int,
    offset_map: list[int],
    raw_len: int,
) -> tuple[int, int]:
    """
    Translates a slice [start_norm:end_norm] in the normalized text back to the
    exact character boundaries [start_raw:end_raw] in the original raw text.
    Prevents highlight drift (RSK-02).
    """
    if not offset_map or start_norm >= len(offset_map):
        return 0, 0

    start_norm_clamped = max(0, min(start_norm, len(offset_map) - 1))
    end_norm_clamped = max(0, min(end_norm - 1, len(offset_map) - 1))

    start_raw = offset_map[start_norm_clamped]
    # The end boundary is 1 past the last matched raw character
    end_raw = min(raw_len, offset_map[end_norm_clamped] + 1)

    return start_raw, max(start_raw, end_raw)
