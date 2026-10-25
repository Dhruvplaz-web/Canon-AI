"""Unit tests for the LLM Provider Adapter and SHA-256 Composite Cache."""

from app.pipeline.llm.adapter import DeterministicMockAdapter
from app.pipeline.llm.cache import llm_cache


def test_mock_adapter_conforming_json():
    llm_cache.clear()
    adapter = DeterministicMockAdapter()
    prompt = "Please evaluate this marketing text: Partner with our team."
    res = adapter.generate(prompt=prompt, system_prompt="You are a brand compliance engine.")

    assert res.cached is False
    assert res.parsed_json is not None
    assert "evaluation_status" in res.parsed_json
    assert res.provider_name == "mock-groq"


def test_composite_sha256_cache_hit_under_50ms():
    llm_cache.clear()
    adapter = DeterministicMockAdapter()
    prompt = "Check text: Bank on us for rapid financing."
    sys_prompt = "Return valid JSON."

    # First call: cache miss
    res1 = adapter.generate(prompt=prompt, system_prompt=sys_prompt)
    assert res1.cached is False

    # Second call: cache hit
    res2 = adapter.generate(prompt=prompt, system_prompt=sys_prompt)
    assert res2.cached is True
    assert res2.latency_ms < 50.0  # < 50ms acceptance check
    assert res2.content == res1.content
    assert res2.parsed_json == res1.parsed_json


def test_cache_differentiation_by_prompt():
    llm_cache.clear()
    adapter = DeterministicMockAdapter()
    resA = adapter.generate(prompt="Prompt A", system_prompt="Sys")
    resB = adapter.generate(prompt="Prompt B", system_prompt="Sys")

    assert resA.cached is False
    assert resB.cached is False
