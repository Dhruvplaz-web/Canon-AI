"""Composite SHA-256 response cache for LLM provider calls."""

import hashlib
from typing import Any


class LLMCache:
    """In-memory SHA-256 composite cache for zero-temperature LLM queries."""

    def __init__(self):
        self._cache: dict[str, dict[str, Any]] = {}

    def _compute_key(self, model: str, system_prompt: str, user_prompt: str) -> str:
        composite = f"{model}:{system_prompt.strip()}:{user_prompt.strip()}"
        return hashlib.sha256(composite.encode("utf-8")).hexdigest()

    def get(self, model: str, system_prompt: str, user_prompt: str) -> dict[str, Any] | None:
        key = self._compute_key(model, system_prompt, user_prompt)
        return self._cache.get(key)

    def set(
        self,
        model: str,
        system_prompt: str,
        user_prompt: str,
        response_data: dict[str, Any],
    ) -> str:
        key = self._compute_key(model, system_prompt, user_prompt)
        self._cache[key] = response_data
        return key

    def clear(self) -> None:
        self._cache.clear()


# Global cache singleton
llm_cache = LLMCache()
