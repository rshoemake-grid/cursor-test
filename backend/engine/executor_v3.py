import uuid
import asyncio
from datetime import datetime
from typing import Any, Dict, List, Optional, Set

from ..models.schemas import (
    WorkflowDefinition,
    ExecutionState,
    ExecutionStatus,
    NodeState,
    Node,
    NodeType,
)
from ..agents import AgentRegistry
from ..utils.logger import get_logger
from ..utils.node_input_config_utils import get_node_input_config
from ..utils.config_utils import resolve_config_variables
from ..utils.node_input_utils import (
    prepare_node_inputs,
    get_previous_node_output,
    wrap_previous_output_to_inputs,
    extract_data_to_write,
)
from .graph.workflow_graph_builder import build_graph
from .execution.execution_broadcaster import ExecutionBroadcaster
from .nodes.storage_node_executor import execute_storage_node

logger = get_logger(__name__)

STORAGE_NODE_TYPES = {NodeType.GCP_BUCKET, NodeType.AWS_S3, NodeType.GCP_PUBSUB, NodeType.LOCAL_FILESYSTEM}


class WorkflowExecutorV3:
    """
    Enhanced workflow executor with WebSocket streaming support
    Supports:
    - Real-time execution updates via WebSocket
    - Conditional branching
    - Loops
    - Parallel execution
    - Agent memory
    - Tool calling
    """
    
    def __init__(
        self,
        workflow: WorkflowDefinition,
        stream_updates: bool = False,
        llm_config: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
        provider_resolver: Optional[Any] = None,
        settings_service: Optional[Any] = None,
    ):
        self.workflow = workflow
        self.execution_id = str(uuid.uuid4())
        self.execution_state: Optional[ExecutionState] = None
        self.loop_states: Dict[str, Dict[str, Any]] = {}
        self.stream_updates = stream_updates
        self.llm_config = llm_config
        self.user_id = user_id
        self.provider_resolver = provider_resolver
        self.settings_service = settings_service
        
    async def execute(self, inputs: Dict[str, Any]) -> ExecutionState:
        """
        Execute the workflow with given inputs
        Broadcasts updates via WebSocket if stream_updates is True
        """
        # Filter out empty execution inputs - ignore empty {} or empty values
        filtered_inputs = {}
        if inputs:
            for key, value in inputs.items():
                # Only include non-empty values
                if value is not None and value != '' and value != {}:
                    # If it's a dict, only include if it has at least one non-empty value
                    if isinstance(value, dict):
                        if any(v is not None and v != '' and v != {} for v in value.values()):
                            filtered_inputs[key] = value
                    else:
                        filtered_inputs[key] = value
        
        # Initialize execution state
        self.execution_state = ExecutionState(
            execution_id=self.execution_id,
            workflow_id=self.workflow.id or "unknown",
            status=ExecutionStatus.RUNNING,
            variables={**self.workflow.variables, **filtered_inputs},
            started_at=datetime.utcnow()
        )
        
        self._broadcaster = ExecutionBroadcaster(
            self.execution_id, self.execution_state, self.stream_updates
        )
        await self._broadcaster.log("INFO", None, "Workflow execution started (V3 - WebSocket Streaming)")
        await self._broadcaster.broadcast_status("running")

        try:
            # Build adjacency map
            adjacency, in_degree = build_graph(self.workflow)
            
            # Debug logging
            await self._broadcaster.log("INFO", None, f"Workflow has {len(self.workflow.nodes)} nodes and {len(self.workflow.edges)} edges")
            
            # Log if any edges were filtered out due to deleted nodes
            valid_node_ids = {node.id for node in self.workflow.nodes}
            invalid_edges = [e for e in self.workflow.edges if e.source not in valid_node_ids or e.target not in valid_node_ids]
            if invalid_edges:
                await self._broadcaster.log("WARNING", None, f"Filtered out {len(invalid_edges)} edges referencing deleted nodes: {[(e.source, e.target) for e in invalid_edges]}")
            if self.workflow.nodes:
                await self._broadcaster.log("INFO", None, f"Nodes: {[f'{n.id}:{n.type.value}' for n in self.workflow.nodes]}")
            else:
                await self._broadcaster.log("ERROR", None, "No nodes found in workflow!")
                self.execution_state.status = ExecutionStatus.FAILED
                self.execution_state.error = "Workflow contains no nodes"
                self.execution_state.completed_at = datetime.utcnow()
                await self._broadcaster.broadcast_error("Workflow contains no nodes")
                return self.execution_state
            
            # Execute with parallel support
            await self._execute_graph(adjacency, in_degree)
            
            # If no failures, mark as completed
            if self.execution_state.status == ExecutionStatus.RUNNING:
                self.execution_state.status = ExecutionStatus.COMPLETED
                if self.execution_state.node_states:
                    last_node_state = list(self.execution_state.node_states.values())[-1]
                    self.execution_state.result = last_node_state.output
            
            self.execution_state.completed_at = datetime.utcnow()
            await self._broadcaster.log("INFO", None, f"Workflow execution {self.execution_state.status.value}")
            
            # Broadcast completion
            await self._broadcaster.broadcast_completion()
            
        except Exception as e:
            self.execution_state.status = ExecutionStatus.FAILED
            self.execution_state.error = str(e)
            self.execution_state.completed_at = datetime.utcnow()
            await self._broadcaster.log("ERROR", None, f"Workflow execution failed: {str(e)}")
            await self._broadcaster.broadcast_error(str(e))
        
        return self.execution_state
    
    async def _execute_graph(self, adjacency: Dict[str, List[str]], in_degree: Dict[str, int]):
        """Execute graph with parallel execution support"""
        node_map = {node.id: node for node in self.workflow.nodes}
        completed: Set[str] = set()
        in_progress: Set[str] = set()
        
        # Find start nodes
        start_nodes = [node_id for node_id, degree in in_degree.items() if degree == 0]
        
        if not start_nodes:
            start_node = next((n for n in self.workflow.nodes if n.type == NodeType.START), None)
            if start_node:
                start_nodes = [start_node.id]
            elif self.workflow.nodes:
                start_nodes = [self.workflow.nodes[0].id]
        
        await self._broadcaster.log("INFO", None, f"Start nodes: {start_nodes}")
        await self._broadcaster.log("INFO", None, f"In-degree map: {in_degree}")
        
        queue = start_nodes.copy()
        
        while queue or in_progress:
            await self._broadcaster.log("INFO", None, f"Queue: {queue}, In Progress: {in_progress}, Completed: {completed}")
            
            # Collect nodes that can be executed in parallel
            parallel_batch = []
            
            for node_id in queue[:]:
                node = node_map[node_id]
                
                # Skip START and END nodes in execution
                if node.type in [NodeType.START, NodeType.END]:
                    await self._broadcaster.log("INFO", None, f"Skipping {node.type.value} node: {node_id}")
                    queue.remove(node_id)
                    completed.add(node_id)
                    
                    for neighbor_id in adjacency[node_id]:
                        dependencies = [n for n, neighbors in adjacency.items() if neighbor_id in neighbors]
                        if all(dep in completed for dep in dependencies):
                            if neighbor_id not in queue and neighbor_id not in in_progress:
                                await self._broadcaster.log("INFO", None, f"Adding neighbor {neighbor_id} to queue")
                                queue.append(neighbor_id)
                    continue
                
                # Check if dependencies are met
                dependencies = [n for n, neighbors in adjacency.items() if node_id in neighbors]
                await self._broadcaster.log("INFO", None, f"Node {node_id} dependencies: {dependencies}, all met: {all(dep in completed for dep in dependencies)}")
                if all(dep in completed for dep in dependencies):
                    await self._broadcaster.log("INFO", None, f"Adding node {node_id} to parallel batch")
                    parallel_batch.append(node)
                    queue.remove(node_id)
                    in_progress.add(node_id)
            
            await self._broadcaster.log("INFO", None, f"Parallel batch: {[n.id for n in parallel_batch]}, Queue after: {queue}, In progress: {in_progress}")
            
            # Only break if there's nothing to do
            if not parallel_batch and not in_progress and not queue:
                await self._broadcaster.log("INFO", None, f"Breaking: no parallel batch, no in progress, and queue is empty")
                break
            
            # If queue still has items but parallel_batch is empty, continue to next iteration
            if not parallel_batch and queue:
                await self._broadcaster.log("INFO", None, f"Queue has items but parallel batch empty - continuing to next iteration")
                continue
            
            # Execute parallel batch
            if parallel_batch:
                await self._broadcaster.log("INFO", None, f"Executing {len(parallel_batch)} node(s) in parallel")
                
                tasks = [self._execute_node(node) for node in parallel_batch]
                await asyncio.gather(*tasks)
                
                # Mark as completed and add children
                for node in parallel_batch:
                    node_state = self.execution_state.node_states[node.id]
                    in_progress.remove(node.id)
                    
                    if node_state.status == ExecutionStatus.FAILED:
                        self.execution_state.status = ExecutionStatus.FAILED
                        self.execution_state.error = node_state.error
                        return
                    
                    completed.add(node.id)
                    await self._broadcaster.log("INFO", None, f"Node {node.id} completed, checking neighbors in adjacency[{node.id}]: {adjacency.get(node.id, [])}")
                    
                    # Handle conditional branching
                    if node.type == NodeType.CONDITION and node_state.output:
                        branch = node_state.output.get("branch", "true")
                        
                        for edge in self.workflow.edges:
                            if edge.source == node.id:
                                edge_condition = getattr(edge, 'condition', 'default')
                                if edge_condition == branch or edge_condition == 'default':
                                    if edge.target not in queue and edge.target not in in_progress:
                                        await self._broadcaster.log("INFO", None, f"Adding conditional neighbor {edge.target} to queue")
                                        queue.append(edge.target)
                    else:
                        neighbors = adjacency.get(node.id, [])
                        await self._broadcaster.log("INFO", None, f"Node {node.id} has {len(neighbors)} neighbors: {neighbors}")
                        for neighbor_id in neighbors:
                            dependencies = [n for n, neighbors_list in adjacency.items() if neighbor_id in neighbors_list]
                            await self._broadcaster.log("INFO", None, f"Neighbor {neighbor_id} dependencies: {dependencies}, completed: {completed}, all met: {all(dep in completed for dep in dependencies)}")
                            if all(dep in completed for dep in dependencies):
                                if neighbor_id not in queue and neighbor_id not in in_progress:
                                    await self._broadcaster.log("INFO", None, f"Adding neighbor {neighbor_id} to queue")
                                    queue.append(neighbor_id)
                            else:
                                missing_deps = [dep for dep in dependencies if dep not in completed]
                                await self._broadcaster.log("INFO", None, f"Neighbor {neighbor_id} not ready - missing dependencies: {missing_deps}")
            
            await asyncio.sleep(0.01)
    
    async def _execute_node(self, node: Node):
        """Execute a single node with WebSocket updates"""
        await self._broadcaster.log("INFO", node.id, f"Executing node: {node.name} (type: {node.type})")
        
        # Initialize node state
        node_state = NodeState(
            node_id=node.id,
            status=ExecutionStatus.RUNNING,
            started_at=datetime.utcnow()
        )
        self.execution_state.node_states[node.id] = node_state
        self.execution_state.current_node = node.id
        
        # Broadcast node started
        await self._broadcaster.broadcast_node_update(node.id, node_state)
        
        try:
            # Execute based on node type
            if node.type in STORAGE_NODE_TYPES:
                input_config = get_node_input_config(node)
                input_config = resolve_config_variables(input_config, self.execution_state.variables)
                mode = input_config.get('mode', 'read')

                node_has_inputs = len(node.inputs) > 0
                incoming_edges = [e for e in self.workflow.edges if e.target == node.id]
                data_producing_edges = [
                    e for e in incoming_edges
                    if e.source not in [n.id for n in self.workflow.nodes if n.type in [NodeType.START, NodeType.END]]
                ]
                has_data_producing_inputs = len(data_producing_edges) > 0

                node_inputs = {}
                data_to_write = None
                if mode == 'write' or node_has_inputs or has_data_producing_inputs:
                    node_inputs = prepare_node_inputs(
                        node,
                        self.execution_state.node_states,
                        self.execution_state.variables,
                        strict_variables=False,
                    )
                    if not node_inputs:
                        previous_node_output = get_previous_node_output(
                            node, self.workflow.edges, self.execution_state.node_states
                        )
                        if previous_node_output is not None:
                            node_inputs = wrap_previous_output_to_inputs(previous_node_output)
                    data_to_write = extract_data_to_write(node_inputs)

                node_state.input = node_inputs if (mode == 'write' or node_has_inputs or has_data_producing_inputs) else {}
                output = await execute_storage_node(
                    node.id,
                    node.type,
                    input_config,
                    mode,
                    node_has_inputs,
                    has_data_producing_inputs,
                    node_inputs,
                    data_to_write,
                    self._broadcaster.log,
                )
            else:
                # Prepare inputs for this node (not needed for input sources)
                node_inputs = prepare_node_inputs(
                    node,
                    self.execution_state.node_states,
                    self.execution_state.variables,
                    strict_variables=False,
                )
                
                # For loop, condition, and agent nodes, if no explicit inputs, try to get from previous node
                if node.type in [NodeType.LOOP, NodeType.CONDITION, NodeType.AGENT] and not node_inputs:
                    previous_node_output = get_previous_node_output(
                        node, self.workflow.edges, self.execution_state.node_states
                    )
                    if previous_node_output is not None:
                        # Auto-populate inputs with previous node's output
                        if isinstance(previous_node_output, dict):
                            # For loop nodes, check if output has 'items' field and extract it
                            if node.type == NodeType.LOOP and 'items' in previous_node_output:
                                node_inputs = {'data': previous_node_output.get('items'), 'items': previous_node_output.get('items')}
                            # For agent nodes after loop, extract 'items' array from loop output
                            elif node.type == NodeType.AGENT and 'items' in previous_node_output:
                                # Loop outputs {'items': [...]}, agent needs the items array
                                items = previous_node_output.get('items', [])
                                # Pass first item or all items depending on context
                                if items and len(items) > 0:
                                    # For now, pass first item as 'data' and all items as 'items'
                                    node_inputs = {
                                        'data': items[0] if len(items) == 1 else items,
                                        'items': items,
                                        'item': items[0] if items else None,
                                    }
                                else:
                                    node_inputs = previous_node_output
                            else:
                                node_inputs = previous_node_output
                        else:
                            # Wrap single value in dict with common keys
                            node_inputs = {
                                'data': previous_node_output,
                                'output': previous_node_output,
                                'items': previous_node_output if isinstance(previous_node_output, (list, tuple)) else [previous_node_output]
                            }
                        await self._broadcaster.log("DEBUG", node.id, f"Auto-populated inputs from previous node: {list(node_inputs.keys())}")
                
                node_state.input = node_inputs
                
                await self._broadcaster.log("INFO", node.id, f"Node inputs: {list(node_inputs.keys())}")
                
                # Execute based on node type
                if node.type in [NodeType.AGENT, NodeType.CONDITION, NodeType.LOOP]:
                    # Temporarily disable log callback to prevent hanging - use regular logger instead
                    # TODO: Re-enable callback once we can ensure it doesn't block
                    agent = AgentRegistry.get_agent(
                        node,
                        llm_config=self.llm_config,
                        user_id=self.user_id,
                        log_callback=None,
                        provider_resolver=self.provider_resolver,
                        settings_service=self.settings_service,
                    )
                    
                    # Log input data for debugging
                    await self._broadcaster.log("DEBUG", node.id, f"Agent received inputs: {list(node_inputs.keys())}")
                    for key, value in node_inputs.items():
                        if isinstance(value, str):
                            preview = value[:200] + "..." if len(value) > 200 else value
                            await self._broadcaster.log("DEBUG", node.id, f"   {key}: (str, length={len(value)}) {preview}")
                        elif isinstance(value, dict):
                            await self._broadcaster.log("DEBUG", node.id, f"   {key}: (dict, keys={list(value.keys())}, size={len(str(value))} chars)")
                        else:
                            value_str = str(value)
                            preview = value_str[:200] + "..." if len(value_str) > 200 else value_str
                            await self._broadcaster.log("DEBUG", node.id, f"   {key}: ({type(value).__name__}) {preview}")
                    
                    # Log agent configuration for debugging
                    if hasattr(agent, 'config'):
                        agent_config = agent.config
                        if hasattr(agent_config, 'system_prompt') and agent_config.system_prompt:
                            await self._broadcaster.log("INFO", node.id, f"Agent system prompt: {agent_config.system_prompt[:200]}...")
                        else:
                            await self._broadcaster.log("INFO", node.id, "Agent has no system prompt configured")
                        if hasattr(agent_config, 'model'):
                            await self._broadcaster.log("INFO", node.id, f"Agent model: {agent_config.model}")
                    
                    try:
                        output = await agent.execute(node_inputs)
                        
                        # Log output details for debugging
                        if output == "":
                            await self._broadcaster.log("WARNING", node.id, f"Agent returned empty string - this may cause downstream nodes to fail. Input keys: {list(node_inputs.keys())}")
                            # Try to get more info from agent if available
                            if hasattr(agent, 'config'):
                                await self._broadcaster.log("DEBUG", node.id, f"Agent model: {agent.config.model if hasattr(agent.config, 'model') else 'unknown'}")
                                await self._broadcaster.log("DEBUG", node.id, f"Agent system prompt length: {len(agent.config.system_prompt) if hasattr(agent.config, 'system_prompt') and agent.config.system_prompt else 0}")
                        elif output is None:
                            await self._broadcaster.log("WARNING", node.id, f"Agent returned None, converting to empty string. Inputs were: {list(node_inputs.keys())}")
                            output = ""
                        else:
                            output_type = type(output).__name__
                            output_length = len(str(output)) if output else 0
                            await self._broadcaster.log("DEBUG", node.id, f"Agent returned {output_type} with length {output_length}")
                    except Exception as agent_error:
                        import traceback
                        await self._broadcaster.log("ERROR", node.id, f"Agent execution raised exception: {type(agent_error).__name__}: {str(agent_error)}")
                        await self._broadcaster.log("DEBUG", node.id, f"Exception traceback: {traceback.format_exc()}")
                        raise
                elif node.type == NodeType.TOOL:
                    output = node_inputs
                else:
                    output = node_inputs
            
            # Update node state
            node_state.status = ExecutionStatus.COMPLETED
            node_state.output = output
            node_state.completed_at = datetime.utcnow()
            
            output_summary = str(output)[:100] + "..." if len(str(output)) > 100 else str(output)
            await self._broadcaster.log("INFO", node.id, f"Node completed with output: {output_summary}")
            
            # Broadcast node completed
            await self._broadcaster.broadcast_node_update(node.id, node_state)
            
        except Exception as e:
            node_state.status = ExecutionStatus.FAILED
            node_state.completed_at = datetime.utcnow()
            
            # Get error message, handling empty or None cases
            error_msg = str(e) if e else "Unknown error"
            if not error_msg or error_msg.strip() == "":
                error_msg = f"{type(e).__name__}: {repr(e)}"
            node_state.error = error_msg
            
            await self._broadcaster.log("ERROR", node.id, f"Node failed: {error_msg}")
            
            # Also log the exception type and full traceback for debugging
            import traceback
            traceback_str = traceback.format_exc()
            await self._broadcaster.log("DEBUG", node.id, f"Exception type: {type(e).__name__}, Full traceback:\n{traceback_str}")
            
            # Broadcast node failed
            await self._broadcaster.broadcast_node_update(node.id, node_state)
    
    def _resolve_config_variables(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Resolve variable references in config (e.g., ${variable_name}). Delegates to config_utils."""
        return resolve_config_variables(config, self.execution_state.variables)
    
