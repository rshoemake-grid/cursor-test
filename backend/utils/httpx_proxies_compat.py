"""
httpx 0.28+ removed the ``proxies`` keyword from ``Client`` and ``AsyncClient``.
Some dependencies still pass it (older openai-python, ADK, etc.), which raises:
``AsyncClient.__init__() got an unexpected keyword argument 'proxies'``.

Strip ``proxies`` before delegating to the real constructor. Safe no-op when callers
omit ``proxies``. See: https://github.com/openai/openai-python/issues/1902
"""

from __future__ import annotations

import httpx

_applied = False


def apply_httpx_proxies_compat() -> None:
    global _applied
    if _applied:
        return
    _applied = True

    _async_orig = httpx.AsyncClient.__init__

    def _async_init(self, *args, **kwargs):
        kwargs.pop("proxies", None)
        return _async_orig(self, *args, **kwargs)

    httpx.AsyncClient.__init__ = _async_init  # type: ignore[method-assign]

    _sync_orig = httpx.Client.__init__

    def _sync_init(self, *args, **kwargs):
        kwargs.pop("proxies", None)
        return _sync_orig(self, *args, **kwargs)

    httpx.Client.__init__ = _sync_init  # type: ignore[method-assign]
