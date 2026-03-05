"""Storage node execution (read/write to GCP, AWS, local filesystem)"""
import asyncio
from typing import Any, Callable, Awaitable, Dict, List, Optional

from ...inputs import read_from_input_source, write_to_input_source
from ...utils.logger import get_logger

logger = get_logger(__name__)


def _read_mode_output(
    items: List[Any],
    read_mode: str,
    total: int,
    raw_output: Dict[str, Any],
    node_type: str,
    total_lines: Optional[int] = None,
) -> Dict[str, Any]:
    """Build output dict for lines/batch read modes (DRY)."""
    result: Dict[str, Any] = {
        "data": items,
        "items": items,
        "file_path": raw_output.get("file_path"),
        "read_mode": read_mode,
        "source": node_type,
    }
    if read_mode == "lines":
        result["lines"] = items
        result["total_lines"] = total
    else:
        result["batches"] = items
        result["total_batches"] = total
        result["total_lines"] = total_lines or 0
        result["batch_size"] = raw_output.get("batch_size")
    return result


def _extract_read_mode_data(raw_output: Dict[str, Any], read_mode: str) -> tuple[List[Any], int, Optional[int]]:
    """Extract items, total, and total_lines from raw_output for lines/batch modes (DRY)."""
    if read_mode == "lines":
        items = raw_output.get("lines", [])
        total = raw_output.get("total_lines", len(items))
        return items, total, None
    items = raw_output.get("batches", [])
    total = raw_output.get("total_batches", len(items))
    total_lines = raw_output.get("total_lines", 0)
    return items, total, total_lines


async def execute_storage_node(
    node_id: str,
    node_type: str,
    input_config: Dict[str, Any],
    mode: str,
    node_has_inputs: bool,
    has_data_producing_inputs: bool,
    node_inputs: Dict[str, Any],
    data_to_write: Optional[Any],
    log_fn: Callable[[str, Optional[str], str], Awaitable[None]],
) -> Any:
    """
    Execute storage node (read or write). Caller prepares node_inputs and data_to_write.
    Returns output dict with 'data' and 'source' keys.
    """
    if mode == "write" or node_has_inputs or has_data_producing_inputs:
        if data_to_write is None or data_to_write == {} or data_to_write == "":
            await log_fn("ERROR", node_id, "Cannot write - data_to_write is empty")
            raise ValueError(
                "Write node has no data to write. Please ensure the previous node produces output data."
            )

        await log_fn("INFO", node_id, f"Writing to {node_type} storage (mode: {mode})")
        loop = asyncio.get_event_loop()
        write_result = await loop.run_in_executor(
            None,
            write_to_input_source,
            node_type,
            input_config,
            data_to_write,
        )
        await log_fn("INFO", node_id, f"Wrote data to {node_type}: {write_result.get('status', 'success')}")
        return write_result

    # Read mode
    await log_fn("INFO", node_id, f"Reading from {node_type} storage")
    loop = asyncio.get_event_loop()
    raw_output = await loop.run_in_executor(
        None,
        read_from_input_source,
        node_type,
        input_config,
    )

    await log_fn(
        "DEBUG",
        node_id,
        f"Raw read output type: {type(raw_output)}, value preview: {str(raw_output)[:200] if raw_output else 'None'}",
    )

    if isinstance(raw_output, dict) and "read_mode" in raw_output:
        read_mode = raw_output.get("read_mode")
        if read_mode in ("lines", "batch"):
            items, total, total_lines = _extract_read_mode_data(raw_output, read_mode)
            log_msg = (
                f"Read {total} lines from file (read_mode: lines)"
                if read_mode == "lines"
                else f"Read {total_lines or 0} lines in {total} batches (read_mode: batch)"
            )
            await log_fn("INFO", node_id, log_msg)
            return _read_mode_output(items, read_mode, total, raw_output, node_type, total_lines=total_lines)
        return {"data": raw_output, "source": node_type}

    if isinstance(raw_output, dict):
        if raw_output == {}:
            await log_fn("WARNING", node_id, "Read operation returned empty dict")
            return {"data": "", "source": node_type}
        return {"data": raw_output, "source": node_type}

    if raw_output is None:
        await log_fn("WARNING", node_id, "Read operation returned None")
        return {"data": None, "source": node_type}

    return {"data": raw_output, "source": node_type}
