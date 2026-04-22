"""
Node executor implementations (OCP). Registered in NodeExecutorRegistry.
"""
from typing import Any, Dict

from ...agents import AgentRegistry
from ...models.schemas import Node, NodeType
from ...utils.node_input_config_utils import get_node_input_config
from ...utils.config_utils import resolve_config_variables
from ...utils.node_input_utils import (
    prepare_node_inputs,
    get_previous_node_output,
    wrap_previous_output_to_inputs,
    extract_data_to_write,
)

from .storage_node_executor import execute_storage_node


async def execute_storage(executor: Any, node: Node, node_inputs: Dict[str, Any] | None = None) -> Any:
    """Execute storage node (GCP, AWS, PubSub, Local). node_inputs unused - storage prepares its own."""
    input_config = get_node_input_config(node)
    input_config = resolve_config_variables(input_config, executor.execution_state.variables)
    mode = input_config.get("mode", "read")

    node_has_inputs = len(node.inputs) > 0
    incoming_edges = [e for e in executor.workflow.edges if e.target == node.id]
    data_producing_edges = [
        e for e in incoming_edges
        if e.source
        not in [n.id for n in executor.workflow.nodes if n.type in [NodeType.START, NodeType.END]]
    ]
    has_data_producing_inputs = len(data_producing_edges) > 0

    node_inputs: Dict[str, Any] = {}
    data_to_write = None
    if mode == "write" or node_has_inputs or has_data_producing_inputs:
        node_inputs = prepare_node_inputs(
            node,
            executor.execution_state.node_states,
            executor.execution_state.variables,
            strict_variables=False,
        )
        if not node_inputs:
            previous_node_output = get_previous_node_output(
                node, executor.workflow.edges, executor.execution_state.node_states
            )
            if previous_node_output is not None:
                node_inputs = wrap_previous_output_to_inputs(previous_node_output)
        data_to_write = extract_data_to_write(node_inputs)

    # Set node_state.input for storage (write mode or when has inputs)
    node_state = executor.execution_state.node_states.get(node.id)
    if node_state:
        node_state.input = node_inputs if (mode == "write" or node_has_inputs or has_data_producing_inputs) else {}

    return await execute_storage_node(
        node.id,
        node.type,
        input_config,
        mode,
        node_has_inputs,
        has_data_producing_inputs,
        node_inputs,
        data_to_write,
        executor._broadcaster.log,
    )


async def execute_agent(executor: Any, node: Node, node_inputs: Dict[str, Any]) -> Any:
    """Execute agent/condition/loop node."""
    agent = AgentRegistry.get_agent(
        node,
        llm_config=executor.llm_config,
        user_id=executor.user_id,
        log_callback=executor._broadcaster.log,
        provider_resolver=executor.provider_resolver,
        settings_service=executor.settings_service,
    )

    await executor._broadcaster.log("DEBUG", node.id, f"Agent received inputs: {list(node_inputs.keys())}")
    for key, value in node_inputs.items():
        if isinstance(value, str):
            preview = value[:200] + "..." if len(value) > 200 else value
            await executor._broadcaster.log("DEBUG", node.id, f"   {key}: (str, length={len(value)}) {preview}")
        elif isinstance(value, dict):
            await executor._broadcaster.log(
                "DEBUG", node.id, f"   {key}: (dict, keys={list(value.keys())}, size={len(str(value))} chars)"
            )
        else:
            value_str = str(value)
            preview = value_str[:200] + "..." if len(value_str) > 200 else value_str
            await executor._broadcaster.log("DEBUG", node.id, f"   {key}: ({type(value).__name__}) {preview}")

    if hasattr(agent, "config"):
        agent_config = agent.config
        if hasattr(agent_config, "system_prompt") and agent_config.system_prompt:
            await executor._broadcaster.log(
                "INFO", node.id, f"Agent system prompt: {agent_config.system_prompt[:200]}..."
            )
        else:
            await executor._broadcaster.log("INFO", node.id, "Agent has no system prompt configured")
        if hasattr(agent_config, "model"):
            await executor._broadcaster.log("INFO", node.id, f"Agent model: {agent_config.model}")

    output = await agent.execute(node_inputs)

    if output == "":
        await executor._broadcaster.log(
            "WARNING", node.id,
            f"Agent returned empty string - this may cause downstream nodes to fail. Input keys: {list(node_inputs.keys())}",
        )
    elif output is None:
        await executor._broadcaster.log(
            "WARNING", node.id,
            f"Agent returned None, converting to empty string. Inputs were: {list(node_inputs.keys())}",
        )
        output = ""
    else:
        output_type = type(output).__name__
        output_length = len(str(output)) if output else 0
        await executor._broadcaster.log("DEBUG", node.id, f"Agent returned {output_type} with length {output_length}")

    return output


async def execute_tool(executor: Any, node: Node, node_inputs: Dict[str, Any]) -> Any:
    """Execute tool node - pass through inputs as output."""
    return node_inputs


async def execute_passthrough(executor: Any, node: Node, node_inputs: Dict[str, Any]) -> Any:
    """Execute start/end/default nodes - pass through inputs."""
    return node_inputs
