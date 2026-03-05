"""Log serialization utilities - DRY helper for execution log serialization."""


def serialize_log_for_json(log: object) -> dict:
    """Serialize a log entry to a JSON-serializable dict."""
    return log.model_dump(mode="json") if hasattr(log, "model_dump") else log
