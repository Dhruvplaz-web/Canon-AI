"""Unit tests for Unicode NFKC normalization and bi-directional offset mapping."""

from app.services.normalizer import map_span_to_raw, normalize_text


def test_basic_normalization_and_offset():
    """Verify standard text produces 1-to-1 offset mapping."""
    raw = "Hello World"
    norm, offsets = normalize_text(raw)

    assert norm == "Hello World"
    assert offsets == list(range(len(raw)))
    assert len(offsets) == len(norm)


def test_ligature_decomposition_offsets():
    """Verify ligatures decompose into multiple characters pointing to the same raw index."""
    # 'ﬁ' is a single Unicode character (U+FB01)
    raw = "The ﬁntech app"
    norm, offsets = normalize_text(raw)

    assert norm == "The fintech app"
    assert len(norm) == len(raw) + 1  # 'fi' is 2 characters instead of 1

    # Indices 4 ('f') and 5 ('i') in normalized string must point to index 4 ('ﬁ') in raw
    assert offsets[4] == 4
    assert offsets[5] == 4

    # Characters after ligature must point to their respective raw indices
    assert offsets[6] == 5  # 'n'


def test_smart_quotes_and_nbsp():
    """Verify smart quotes and non-breaking spaces are normalized with faithful offsets."""
    raw = "“Partner with Acme”\u00a0now"
    norm, offsets = normalize_text(raw)

    assert "\u00a0" not in norm
    assert " " in norm
    assert len(norm) == len(raw)
    assert len(offsets) == len(raw)


def test_map_span_to_raw_roundtrip():
    """Verify slice translation from normalized text back to raw string."""
    raw = "Bank on us for “great” yields"
    norm, offsets = normalize_text(raw)

    # Search for term in normalized text
    term = "Bank on us"
    start_norm = norm.index(term)
    end_norm = start_norm + len(term)

    start_raw, end_raw = map_span_to_raw(start_norm, end_norm, offsets, len(raw))

    # Assert exact slice matches in original raw text
    assert raw[start_raw:end_raw] == "Bank on us"
