"""
Node executor registry (OCP) - add new node types without editing executor_v3.
"""
from typing import Any, Awaitable, Callable, Dict, Set

from ...models.schemas import NodeType

# Type alias: async (executor_instance, node, node_inputs?) -> output
NodeExecutor = Callable[..., Awaitable[Any]]


class NodeExecutorRegistry:
    """Registry mapping node types to executor functions."""

    _executors: Dict[NodeType, NodeExecutor] = {}
    _storage_types: Set[NodeType] = set()

    @classmethod
    def register(cls, node_type: NodeType, executor: NodeExecutor) -> None:
        """Register an executor for a node type."""
        cls._executors[node_type] = executor

    @classmethod
    def register_storage(cls, node_type: NodeType, executor: NodeExecutor) -> None:
        """Register a storage node executor (read/write). Storage prepares its own inputs."""
        cls._executors[node_type] = executor
        cls._storage_types.add(node_type)

    @classmethod
    def get(cls, node_type: NodeType) -> NodeExecutor | None:
        """Get executor for node type, or None if not registered."""
        return cls._executors.get(node_type)

    @classmethod
    def is_storage(cls, node_type: NodeType) -> bool:
        """Check if node type is a storage node."""
        return node_type in cls._storage_types


def _bootstrap_registry() -> None:
    """Register default executors. Called on module import."""
    from . import executors

    for nt in [NodeType.GCP_BUCKET, NodeType.AWS_S3, NodeType.GCP_PUBSUB, NodeType.LOCAL_FILESYSTEM]:
        NodeExecutorRegistry.register_storage(nt, executors.execute_storage)

    NodeExecutorRegistry.register(NodeType.AGENT, executors.execute_agent)
    NodeExecutorRegistry.register(NodeType.CONDITION, executors.execute_agent)
    NodeExecutorRegistry.register(NodeType.LOOP, executors.execute_agent)
    NodeExecutorRegistry.register(NodeType.TOOL, executors.execute_tool)
    NodeExecutorRegistry.register(NodeType.START, executors.execute_passthrough)
    NodeExecutorRegistry.register(NodeType.END, executors.execute_passthrough)


_bootstrap_registry()
