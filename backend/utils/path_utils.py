"""Path validation utilities (security - path traversal protection)."""
import os
from pathlib import Path
from typing import Optional


def get_local_file_base_path() -> Path:
    """
    Base path for local file system operations.
    Set LOCAL_FILE_BASE_PATH in .env to restrict file access (recommended in production).
    Defaults to current working directory.
    """
    base = os.getenv("LOCAL_FILE_BASE_PATH")
    if base and base.strip():
        return Path(base).expanduser().resolve()
    return Path(os.getcwd()).resolve()


def is_local_file_path_restricted() -> bool:
    """True when LOCAL_FILE_BASE_PATH is set (sandbox active for listing and reads)."""
    return bool(os.getenv("LOCAL_FILE_BASE_PATH", "").strip())


def compute_local_browser_can_go_up(current: Path, base: Path) -> bool:
    """
    Whether the storage browser may offer a parent directory.
    When restricted, stop at base. When unrestricted, allow up to filesystem root.
    """
    if is_local_file_path_restricted():
        return current.resolve() != base.resolve()
    cur = current.resolve()
    return cur.parent != cur


def resolve_local_filesystem_write_path(file_path: str) -> Path:
    """
    Resolve a target path for local filesystem writes.

    When LOCAL_FILE_BASE_PATH is set, returns Path(...).resolve() so containment checks
    match a canonical path under the configured base.

    When unrestricted (no base), returns an absolute path via os.path.normpath only —
    without following symlinks — so a cyclic/broken symlink in a parent directory is
    less likely to block the workflow indefinitely during resolution.
    """
    if not file_path or not str(file_path).strip():
        raise ValueError("file_path is required")
    expanded = os.path.expanduser(str(file_path).strip())
    if is_local_file_path_restricted():
        return Path(expanded).resolve()
    if os.path.isabs(expanded):
        return Path(os.path.normpath(expanded))
    return Path(os.path.normpath(os.path.join(os.getcwd(), expanded)))


def combine_local_write_path_with_pattern(path: Path, file_pattern: str) -> Path:
    """Join a directory path with file_pattern using the same symlink policy as writes."""
    combined = path / file_pattern
    if is_local_file_path_restricted():
        return combined.resolve()
    return Path(os.path.normpath(str(combined)))


def validate_path_within_base(resolved_path: Path, base_path: Optional[Path] = None) -> None:
    """
    Ensure resolved_path is within base_path (prevents path traversal).
    Only validates when LOCAL_FILE_BASE_PATH is set (production). When not set, skips for backward compat.
    Raises ValueError if path escapes base.
    """
    base = base_path or get_local_file_base_path()
    if not is_local_file_path_restricted():
        return
    resolved = resolved_path.resolve()
    try:
        resolved.relative_to(base)
    except ValueError:
        raise ValueError(
            f"Path '{resolved}' is outside allowed base directory '{base}'. "
            "Set LOCAL_FILE_BASE_PATH in .env to configure allowed paths."
        )
