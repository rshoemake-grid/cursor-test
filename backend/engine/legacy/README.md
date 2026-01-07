# Legacy Executors

This directory contains older versions of the workflow executor that have been superseded by `executor_v3.py`.

## Files

- `executor.py` - Original sequential executor (v1)
- `executor_v2.py` - Enhanced executor with parallel execution (v2)

## Current Version

The current executor is `executor_v3.py` in the parent directory, which includes:
- WebSocket streaming support
- Real-time execution updates
- Enhanced error handling
- All features from v1 and v2

## Migration

If you need to reference old executor code, it's preserved here for historical reference. The current codebase uses `WorkflowExecutorV3` (exported as `WorkflowExecutor` from `backend.engine`).

