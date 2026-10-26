"""LLM Provider Protocol Adapter and Telemetry Recorder."""

import json
import logging
import time
from dataclasses import dataclass, field
from typing import Any, Protocol

import httpx

from app.core.config import settings
from app.pipeline.llm.cache import llm_cache

logger = logging.getLogger("canon.llm")


@dataclass
class LLMResponse:
    """Standardized response from LLM adapter with telemetry metadata."""

    content: str
    parsed_json: dict[str, Any] | None
    provider_name: str
    model_name: str
    prompt_tokens: int
    completion_tokens: int
    latency_ms: float
    cached: bool = False
    metadata: dict[str, Any] = field(default_factory=dict)


class LLMProvider(Protocol):
    """Protocol contract for all downstream LLM calls (AI Rules Sec 7.3)."""

    def generate(
        self,
        prompt: str,
        system_prompt: str = "",
        model: str | None = None,
    ) -> LLMResponse: ...


class HttpLLMAdapter:
    """HTTP client adapter supporting Groq or Mistral single-provider endpoints."""

    def __init__(
        self,
        api_key: str | None = None,
        provider_name: str = "groq",
        default_model: str = "llama-3.3-70b-versatile",
        base_url: str = "https://api.groq.com/openai/v1",
    ):
        self.api_key = api_key or settings.LLM_API_KEY or settings.GROQ_API_KEY
        self.provider_name = provider_name
        self.default_model = default_model
        self.base_url = base_url

    def generate(
        self,
        prompt: str,
        system_prompt: str = "You are a brand compliance evaluation engine. Return JSON only.",
        model: str | None = None,
    ) -> LLMResponse:
        target_model = model or self.default_model

        # 1. Check composite SHA-256 cache
        cached = llm_cache.get(target_model, system_prompt, prompt)
        if cached:
            return LLMResponse(
                content=cached["content"],
                parsed_json=cached.get("parsed_json"),
                provider_name=self.provider_name,
                model_name=target_model,
                prompt_tokens=cached.get("prompt_tokens", 0),
                completion_tokens=cached.get("completion_tokens", 0),
                latency_ms=1.5,
                cached=True,
            )

        # 2. If no API key configured, use deterministic mock fallback
        if not self.api_key or self.api_key == "change-me-to-groq-key":
            return DeterministicMockAdapter().generate(prompt, system_prompt, target_model)

        # 3. Execute HTTP request with temperature=0.0
        start_time = time.perf_counter()
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": target_model,
            "temperature": 0.0,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
        }

        try:
            with httpx.Client(timeout=10.0) as client:
                res = client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
                res.raise_for_status()
                data = res.json()

            latency_ms = (time.perf_counter() - start_time) * 1000.0
            choice = data["choices"][0]["message"]["content"]
            usage = data.get("usage", {})

            try:
                parsed_json = json.loads(choice)
            except (json.JSONDecodeError, TypeError):
                parsed_json = None

            response = LLMResponse(
                content=choice,
                parsed_json=parsed_json,
                provider_name=self.provider_name,
                model_name=target_model,
                prompt_tokens=usage.get("prompt_tokens", 0),
                completion_tokens=usage.get("completion_tokens", 0),
                latency_ms=round(latency_ms, 2),
                cached=False,
            )

            # Store in cache
            llm_cache.set(
                target_model,
                system_prompt,
                prompt,
                {
                    "content": response.content,
                    "parsed_json": response.parsed_json,
                    "prompt_tokens": response.prompt_tokens,
                    "completion_tokens": response.completion_tokens,
                },
            )
            return response

        except (httpx.HTTPError, OSError) as e:
            logger.warning("LLM call failed (%s). Falling back to deterministic evaluation.", e)
            return DeterministicMockAdapter().generate(prompt, system_prompt, target_model)


class DeterministicMockAdapter:
    """Deterministic offline adapter for reproducible tests and CI runs."""

    def __init__(self, provider_name: str = "mock-groq"):
        self.provider_name = provider_name
        self.default_model = "llama-3.3-70b-mock"

    def generate(
        self,
        prompt: str,
        system_prompt: str = "",
        model: str | None = None,
    ) -> LLMResponse:
        target_model = model or self.default_model

        # Check cache first
        cached = llm_cache.get(target_model, system_prompt, prompt)
        if cached:
            return LLMResponse(
                content=cached["content"],
                parsed_json=cached.get("parsed_json"),
                provider_name=self.provider_name,
                model_name=target_model,
                prompt_tokens=cached.get("prompt_tokens", 50),
                completion_tokens=cached.get("completion_tokens", 25),
                latency_ms=1.2,
                cached=True,
            )

        start_time = time.perf_counter()
        mock_findings = []
        lower_prompt = prompt.lower()
        if "bank on us" in lower_prompt:
            mock_findings.append({
                "rule_code": "TERM-001",
                "severity": "CRITICAL",
                "flagged_span": "bank on us",
                "matched_text": "bank on us",
                "reason": "Unqualified banking verb prohibited.",
                "suggested_fix": "Partner with Acme Financial Technologies, an FDIC-insured banking partner.",
            })
        if "don't get left behind" in lower_prompt:
            mock_findings.append({
                "rule_code": "TONE-001",
                "severity": "WARNING",
                "flagged_span": "Don't get left behind!",
                "matched_text": "Don't get left behind!",
                "reason": "High-pressure urgency tactic prohibited by brand guidelines.",
                "suggested_fix": "Explore our portfolio solutions at your convenience.",
            })
        if "moon shot" in lower_prompt:
            mock_findings.append({
                "rule_code": "TONE-002",
                "severity": "WARNING",
                "flagged_span": "moon shot",
                "matched_text": "moon shot",
                "reason": "Hype slang terminology prohibited across corporate releases.",
                "suggested_fix": "sustainable capital growth",
            })

        mock_payload = {
            "evaluation_status": "COMPLETED",
            "findings_count": len(mock_findings),
            "findings": mock_findings,
        }
        content = json.dumps(mock_payload)
        latency_ms = (time.perf_counter() - start_time) * 1000.0

        response = LLMResponse(
            content=content,
            parsed_json=mock_payload,
            provider_name=self.provider_name,
            model_name=target_model,
            prompt_tokens=len(prompt.split()),
            completion_tokens=len(content.split()),
            latency_ms=round(latency_ms, 2),
            cached=False,
        )

        llm_cache.set(
            target_model,
            system_prompt,
            prompt,
            {
                "content": content,
                "parsed_json": mock_payload,
                "prompt_tokens": response.prompt_tokens,
                "completion_tokens": response.completion_tokens,
            },
        )
        return response


# Global default adapter
default_llm_adapter = HttpLLMAdapter()
