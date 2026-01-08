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
    ExecutionLogEntry
)
from ..agents import AgentRegistry
from ..websocket.manager import manager as ws_manager
from ..inputs import read_from_input_source, write_to_input_source
from ..utils.logger import get_logger

logger = get_logger(__name__)


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
    
    def __init__(self, workflow: WorkflowDefinition, stream_updates: bool = False, llm_config: Optional[Dict[str, Any]] = None, user_id: Optional[str] = None):
        self.workflow = workflow
        self.execution_id = str(uuid.uuid4())
        self.execution_state: Optional[ExecutionState] = None
        self.loop_states: Dict[str, Dict[str, Any]] = {}
        self.stream_updates = stream_updates
        self.llm_config = llm_config
        self.user_id = user_id
        
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
        
        await self._log("INFO", None, "Workflow execution started (V3 - WebSocket Streaming)")
        await self._broadcast_status("running")
        
        try:
            # Build adjacency map
            adjacency, in_degree = self._build_graph()
            
            # Debug logging
            await self._log("INFO", None, f"Workflow has {len(self.workflow.nodes)} nodes and {len(self.workflow.edges)} edges")
            
            # Log if any edges were filtered out due to deleted nodes
            valid_node_ids = {node.id for node in self.workflow.nodes}
            invalid_edges = [e for e in self.workflow.edges if e.source not in valid_node_ids or e.target not in valid_node_ids]
            if invalid_edges:
                await self._log("WARNING", None, f"Filtered out {len(invalid_edges)} edges referencing deleted nodes: {[(e.source, e.target) for e in invalid_edges]}")
            if self.workflow.nodes:
                await self._log("INFO", None, f"Nodes: {[f'{n.id}:{n.type.value}' for n in self.workflow.nodes]}")
            else:
                await self._log("ERROR", None, "No nodes found in workflow!")
                self.execution_state.status = ExecutionStatus.FAILED
                self.execution_state.error = "Workflow contains no nodes"
                self.execution_state.completed_at = datetime.utcnow()
                await self._broadcast_error("Workflow contains no nodes")
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
            await self._log("INFO", None, f"Workflow execution {self.execution_state.status.value}")
            
            # Broadcast completion
            await self._broadcast_completion()
            
        except Exception as e:
            self.execution_state.status = ExecutionStatus.FAILED
            self.execution_state.error = str(e)
            self.execution_state.completed_at = datetime.utcnow()
            await self._log("ERROR", None, f"Workflow execution failed: {str(e)}")
            await self._broadcast_error(str(e))
        
        return self.execution_state
    
    def _build_graph(self):
        """Build adjacency map and in-degree map, filtering out edges to deleted nodes and invalid nodes"""
        # Filter out nodes that don't have required configuration
        valid_nodes = []
        for node in self.workflow.nodes:
            # Skip condition nodes without field configuration
            if node.type == NodeType.CONDITION:
                if not node.condition_config or not node.condition_config.field:
                    logger.warning(f"Skipping condition node {node.id} - missing required field configuration")
                    continue
            valid_nodes.append(node)
        
        # Update workflow nodes to only include valid nodes
        self.workflow.nodes = valid_nodes
        
        # Create set of valid node IDs for quick lookup
        valid_node_ids = {node.id for node in self.workflow.nodes}
        
        # Initialize adjacency and in-degree maps only for existing nodes
        adjacency: Dict[str, List[str]] = {node.id: [] for node in self.workflow.nodes}
        in_degree: Dict[str, int] = {node.id: 0 for node in self.workflow.nodes}
        
        # Filter edges to only include those between valid nodes
        valid_edges = []
        for edge in self.workflow.edges:
            # Skip edges that reference invalid nodes
            if edge.source not in valid_node_ids:
                logger.warning(f"Skipping edge {edge.id} - source node {edge.source} is invalid or missing")
                continue
            if edge.target not in valid_node_ids:
                logger.warning(f"Skipping edge {edge.id} - target node {edge.target} is invalid or missing")
                continue
            
            # Only add edge if both nodes exist
            if edge.source in adjacency and edge.target in in_degree:
                adjacency[edge.source].append(edge.target)
                in_degree[edge.target] += 1
                valid_edges.append(edge)
        
        # Update workflow edges to only include valid edges
        self.workflow.edges = valid_edges
        
        # Debug logging
        print(f"🔍 Built adjacency map:")
        for source_id, targets in adjacency.items():
            if targets:
                print(f"   {source_id} -> {targets}")
        print(f"🔍 In-degree map: {in_degree}")
        
        return adjacency, in_degree
    
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
        
        await self._log("INFO", None, f"Start nodes: {start_nodes}")
        await self._log("INFO", None, f"In-degree map: {in_degree}")
        
        queue = start_nodes.copy()
        
        while queue or in_progress:
            await self._log("INFO", None, f"Queue: {queue}, In Progress: {in_progress}, Completed: {completed}")
            
            # Collect nodes that can be executed in parallel
            parallel_batch = []
            
            for node_id in queue[:]:
                node = node_map[node_id]
                
                # Skip START and END nodes in execution
                if node.type in [NodeType.START, NodeType.END]:
                    await self._log("INFO", None, f"Skipping {node.type.value} node: {node_id}")
                    queue.remove(node_id)
                    completed.add(node_id)
                    
                    for neighbor_id in adjacency[node_id]:
                        dependencies = [n for n, neighbors in adjacency.items() if neighbor_id in neighbors]
                        if all(dep in completed for dep in dependencies):
                            if neighbor_id not in queue and neighbor_id not in in_progress:
                                await self._log("INFO", None, f"Adding neighbor {neighbor_id} to queue")
                                queue.append(neighbor_id)
                    continue
                
                # Check if dependencies are met
                dependencies = [n for n, neighbors in adjacency.items() if node_id in neighbors]
                await self._log("INFO", None, f"Node {node_id} dependencies: {dependencies}, all met: {all(dep in completed for dep in dependencies)}")
                if all(dep in completed for dep in dependencies):
                    await self._log("INFO", None, f"Adding node {node_id} to parallel batch")
                    parallel_batch.append(node)
                    queue.remove(node_id)
                    in_progress.add(node_id)
            
            await self._log("INFO", None, f"Parallel batch: {[n.id for n in parallel_batch]}, Queue after: {queue}, In progress: {in_progress}")
            
            # Only break if there's nothing to do
            if not parallel_batch and not in_progress and not queue:
                await self._log("INFO", None, f"Breaking: no parallel batch, no in progress, and queue is empty")
                break
            
            # If queue still has items but parallel_batch is empty, continue to next iteration
            if not parallel_batch and queue:
                await self._log("INFO", None, f"Queue has items but parallel batch empty - continuing to next iteration")
                continue
            
            # Execute parallel batch
            if parallel_batch:
                await self._log("INFO", None, f"Executing {len(parallel_batch)} node(s) in parallel")
                
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
                    await self._log("INFO", None, f"Node {node.id} completed, checking neighbors in adjacency[{node.id}]: {adjacency.get(node.id, [])}")
                    
                    # Handle conditional branching
                    if node.type == NodeType.CONDITION and node_state.output:
                        branch = node_state.output.get("branch", "true")
                        
                        for edge in self.workflow.edges:
                            if edge.source == node.id:
                                edge_condition = getattr(edge, 'condition', 'default')
                                if edge_condition == branch or edge_condition == 'default':
                                    if edge.target not in queue and edge.target not in in_progress:
                                        await self._log("INFO", None, f"Adding conditional neighbor {edge.target} to queue")
                                        queue.append(edge.target)
                    else:
                        neighbors = adjacency.get(node.id, [])
                        await self._log("INFO", None, f"Node {node.id} has {len(neighbors)} neighbors: {neighbors}")
                        for neighbor_id in neighbors:
                            dependencies = [n for n, neighbors_list in adjacency.items() if neighbor_id in neighbors_list]
                            await self._log("INFO", None, f"Neighbor {neighbor_id} dependencies: {dependencies}, completed: {completed}, all met: {all(dep in completed for dep in dependencies)}")
                            if all(dep in completed for dep in dependencies):
                                if neighbor_id not in queue and neighbor_id not in in_progress:
                                    await self._log("INFO", None, f"Adding neighbor {neighbor_id} to queue")
                                    queue.append(neighbor_id)
                            else:
                                missing_deps = [dep for dep in dependencies if dep not in completed]
                                await self._log("INFO", None, f"Neighbor {neighbor_id} not ready - missing dependencies: {missing_deps}")
            
            await asyncio.sleep(0.01)
    
    async def _execute_node(self, node: Node):
        """Execute a single node with WebSocket updates"""
        await self._log("INFO", node.id, f"Executing node: {node.name} (type: {node.type})")
        
        # Initialize node state
        node_state = NodeState(
            node_id=node.id,
            status=ExecutionStatus.RUNNING,
            started_at=datetime.utcnow()
        )
        self.execution_state.node_states[node.id] = node_state
        self.execution_state.current_node = node.id
        
        # Broadcast node started
        await self._broadcast_node_update(node.id, node_state)
        
        try:
            # Execute based on node type
            if node.type in ['gcp_bucket', 'aws_s3', 'gcp_pubsub', 'local_filesystem']:
                # Handle storage nodes - can read or write based on mode and inputs
                # Get input_config from node data - prioritize data.input_config, fallback to top-level
                input_config = {}
                
                # First check node.data.input_config (UI stores it here)
                if hasattr(node, 'data') and node.data and isinstance(node.data, dict):
                    data_input_config = node.data.get('input_config')
                    if data_input_config and isinstance(data_input_config, dict):
                        input_config = data_input_config.copy()
                
                # Then check top-level input_config (may be set during reconstruction)
                if hasattr(node, 'input_config') and node.input_config:
                    top_input_config = node.input_config if isinstance(node.input_config, dict) else {}
                    # Merge: top-level values override data values, but only if they're not empty
                    for key, value in top_input_config.items():
                        if value and (not isinstance(value, str) or value.strip()):
                            input_config[key] = value
                        elif key not in input_config:
                            input_config[key] = value
                
                # Ensure input_config is a dict
                if not isinstance(input_config, dict):
                    input_config = {}
                
                # Resolve variables in input_config (e.g., ${file_path} -> actual value)
                input_config = self._resolve_config_variables(input_config)
                
                # Debug logging
                await self._log("DEBUG", node.id, f"Resolved input_config for {node.type}: {input_config}")
                
                mode = input_config.get('mode', 'read')
                await self._log("DEBUG", node.id, f"Mode: {mode}, node.inputs count: {len(node.inputs)}")
                
                # Check if node has inputs (connected from other nodes) - if so, it's a write operation
                node_has_inputs = len(node.inputs) > 0
                
                # Check if there are incoming edges from data-producing nodes (not START/END)
                incoming_edges = [e for e in self.workflow.edges if e.target == node.id]
                # Filter out edges from START/END nodes - they don't produce data
                data_producing_edges = [
                    e for e in incoming_edges 
                    if e.source not in [n.id for n in self.workflow.nodes if n.type in [NodeType.START, NodeType.END]]
                ]
                has_data_producing_inputs = len(data_producing_edges) > 0
                await self._log("DEBUG", node.id, f"Incoming edges: {len(incoming_edges)} (from data-producing nodes: {len(data_producing_edges)}), node_has_inputs: {node_has_inputs}, will_write: {mode == 'write' or node_has_inputs or has_data_producing_inputs}")
                
                if mode == 'write' or node_has_inputs or has_data_producing_inputs:
                    # Write mode: get data from inputs
                    node_inputs = self._prepare_node_inputs(node)
                    
                    # If no explicit inputs, try to get from previous node (for write nodes)
                    if not node_inputs:
                        previous_node_output = self._get_previous_node_output(node)
                        await self._log("DEBUG", node.id, f"Previous node output: {type(previous_node_output)}, value: {str(previous_node_output)[:100] if previous_node_output else 'None'}")
                        if previous_node_output is not None:
                            # Auto-populate inputs with previous node's output
                            if isinstance(previous_node_output, dict):
                                node_inputs = previous_node_output
                            else:
                                # Wrap single value in dict - handle base64 image strings
                                # Check if it's a base64 data URL (image from agent)
                                if isinstance(previous_node_output, str) and previous_node_output.startswith('data:image/'):
                                    node_inputs = {
                                        'data': previous_node_output,
                                        'output': previous_node_output,
                                        'image': previous_node_output  # Also add as 'image' key for clarity
                                    }
                                else:
                                    node_inputs = {
                                        'data': previous_node_output,
                                        'output': previous_node_output
                                    }
                        else:
                            await self._log("WARNING", node.id, "No previous node output found - write node has no inputs configured")
                    
                    node_state.input = node_inputs
                    
                    # Extract data to write
                    data_to_write = None
                    # Check if node_inputs is not empty (empty dict {} is falsy, but we want to check for actual content)
                    has_content = False
                    if node_inputs:
                        if isinstance(node_inputs, dict):
                            # Check if dict has any non-empty values
                            has_content = any(
                                v is not None and v != '' and v != {} 
                                for v in node_inputs.values()
                            )
                        else:
                            has_content = True
                    
                    if has_content:
                        await self._log("DEBUG", node.id, f"Node inputs keys: {list(node_inputs.keys()) if isinstance(node_inputs, dict) else 'not a dict'}")
                        
                        # If node_inputs came from a read node, it might be wrapped in {'data': ..., 'source': ...}
                        # Extract the actual data if it's wrapped
                        if isinstance(node_inputs, dict) and 'data' in node_inputs:
                            # Check if this looks like a wrapped read node output
                            # Read nodes wrap output as {'data': actual_content, 'source': node_type}
                            if len(node_inputs) == 2 and 'source' in node_inputs:
                                # This is a wrapped read node output - extract the 'data' field
                                data_to_write = node_inputs['data']
                                await self._log("DEBUG", node.id, f"Extracted 'data' field from wrapped read node output (type: {type(data_to_write)}, length: {len(str(data_to_write)) if data_to_write else 0})")
                            elif len(node_inputs) == 1 and 'data' in node_inputs:
                                # Single 'data' key - use it
                                data_to_write = node_inputs['data']
                                await self._log("DEBUG", node.id, f"Using 'data' field from single-key dict (type: {type(data_to_write)}, length: {len(str(data_to_write)) if data_to_write else 0})")
                            else:
                                # Multiple keys but not a wrapped output - check if 'data' has content
                                if 'data' in node_inputs and node_inputs['data'] not in (None, '', {}):
                                    data_to_write = node_inputs['data']
                                    await self._log("DEBUG", node.id, f"Extracted 'data' from multi-key dict (type: {type(data_to_write)})")
                                else:
                                    # Use entire dict but filter out empty values
                                    filtered_dict = {k: v for k, v in node_inputs.items() if v not in (None, '', {})}
                                    if filtered_dict:
                                        data_to_write = filtered_dict
                                        await self._log("DEBUG", node.id, f"Using filtered dict as data (keys: {list(filtered_dict.keys())})")
                                    else:
                                        data_to_write = None
                                        await self._log("WARNING", node.id, "All values in node_inputs are empty")
                        else:
                            # If there's a single input value, use it directly
                            if isinstance(node_inputs, dict):
                                # Filter out empty values, but keep base64 image strings
                                input_values = []
                                for v in node_inputs.values():
                                    # Keep non-empty values, including base64 image strings
                                    if v not in (None, '', {}) or (isinstance(v, str) and v.startswith('data:image/')):
                                        input_values.append(v)
                                
                                if len(input_values) == 1:
                                    data_to_write = input_values[0]
                                    await self._log("DEBUG", node.id, f"Using single non-empty input value (type: {type(data_to_write)}, is_image: {isinstance(data_to_write, str) and data_to_write.startswith('data:image/')})")
                                elif len(input_values) > 1:
                                    # Multiple non-empty inputs - check if one is an image
                                    # Prefer image data if present
                                    image_value = next((v for v in input_values if isinstance(v, str) and v.startswith('data:image/')), None)
                                    if image_value:
                                        data_to_write = image_value
                                        await self._log("DEBUG", node.id, f"Found image in multiple inputs, using image data")
                                    else:
                                        # Use the entire dict but filter out empty values
                                        data_to_write = {k: v for k, v in node_inputs.items() if v not in (None, '', {}) or (isinstance(v, str) and v.startswith('data:image/'))}
                                        await self._log("DEBUG", node.id, f"Using filtered dict with multiple values (keys: {list(data_to_write.keys()) if isinstance(data_to_write, dict) else 'not dict'})")
                                else:
                                    data_to_write = None
                                    await self._log("WARNING", node.id, "All input values are empty")
                            else:
                                # Not a dict - use directly (could be a base64 image string)
                                data_to_write = node_inputs
                                await self._log("DEBUG", node.id, f"Using non-dict input directly (type: {type(data_to_write)}, is_image: {isinstance(data_to_write, str) and data_to_write.startswith('data:image/')})")
                    else:
                        # No inputs or all inputs are empty
                        data_to_write = None
                        await self._log("WARNING", node.id, "No data to write - write node has no inputs or all inputs are empty")
                    
                    # Don't write if data_to_write is None or empty
                    if data_to_write is None or data_to_write == {} or data_to_write == '':
                        await self._log("ERROR", node.id, f"Cannot write - data_to_write is empty (value: {data_to_write})")
                        raise ValueError(f"Write node {node.id} has no data to write. Please ensure the previous node produces output data.")
                    
                    await self._log("DEBUG", node.id, f"Final data_to_write type: {type(data_to_write)}, length: {len(str(data_to_write)) if data_to_write else 0}")
                    
                    await self._log("INFO", node.id, f"Writing to {node.type} storage (mode: {mode})")
                    
                    # Write to storage (synchronous operation wrapped in executor)
                    loop = asyncio.get_event_loop()
                    write_result = await loop.run_in_executor(
                        None,
                        write_to_input_source,
                        node.type,
                        input_config,
                        data_to_write
                    )
                    
                    output = write_result
                    await self._log("INFO", node.id, f"Wrote data to {node.type}: {write_result.get('status', 'success')}")
                else:
                    # Read mode: read from storage
                    await self._log("INFO", node.id, f"Reading from {node.type} storage")
                    
                    # Read from input source (synchronous operation wrapped in executor)
                    loop = asyncio.get_event_loop()
                    raw_output = await loop.run_in_executor(
                        None,
                        read_from_input_source,
                        node.type,
                        input_config
                    )
                    
                    await self._log("DEBUG", node.id, f"Raw read output type: {type(raw_output)}, value preview: {str(raw_output)[:200] if raw_output else 'None'}")
                    
                    # Handle structured output from lines/batch read modes
                    if isinstance(raw_output, dict) and 'read_mode' in raw_output:
                        read_mode = raw_output.get('read_mode')
                        if read_mode == 'lines':
                            # Lines mode: extract lines array for Loop node
                            lines = raw_output.get('lines', [])
                            total_lines = raw_output.get('total_lines', len(lines))
                            await self._log("INFO", node.id, f"Read {total_lines} lines from file (read_mode: lines)")
                            # Return structured output with lines accessible for Loop node
                            output = {
                                'data': lines,  # For Loop node to iterate over
                                'lines': lines,  # Alternative key
                                'items': lines,  # Another alternative for Loop
                                'total_lines': total_lines,
                                'file_path': raw_output.get('file_path'),
                                'read_mode': 'lines',
                                'source': node.type
                            }
                        elif read_mode == 'batch':
                            # Batch mode: return batches for batch processing
                            batches = raw_output.get('batches', [])
                            total_batches = raw_output.get('total_batches', len(batches))
                            total_lines = raw_output.get('total_lines', 0)
                            await self._log("INFO", node.id, f"Read {total_lines} lines in {total_batches} batches (read_mode: batch)")
                            output = {
                                'data': batches,  # For Loop node to iterate over batches
                                'batches': batches,
                                'items': batches,  # Alternative for Loop
                                'total_batches': total_batches,
                                'total_lines': total_lines,
                                'batch_size': raw_output.get('batch_size'),
                                'file_path': raw_output.get('file_path'),
                                'read_mode': 'batch',
                                'source': node.type
                            }
                        else:
                            # Unknown read mode, wrap as-is
                            output = {'data': raw_output, 'source': node.type}
                    elif isinstance(raw_output, dict):
                        # If it's already a dict, check if it's empty
                        if raw_output == {}:
                            await self._log("WARNING", node.id, "Read operation returned empty dict")
                            output = {'data': '', 'source': node.type}
                        else:
                            # Wrap existing dict in our standard format
                            output = {'data': raw_output, 'source': node.type}
                    elif raw_output is None:
                        await self._log("WARNING", node.id, "Read operation returned None")
                        output = {'data': None, 'source': node.type}
                    else:
                        # Wrap non-dict output
                        output = {'data': raw_output, 'source': node.type}
                    
                    node_state.input = {}  # Read operations don't have inputs
                    output_preview = str(output.get('data', ''))[:100] if isinstance(output, dict) else str(output)[:100]
                    
                    # Enhanced logging for lines/batch modes
                    if isinstance(output, dict) and 'read_mode' in output:
                        read_mode = output.get('read_mode')
                        if read_mode == 'lines':
                            line_count = output.get('total_lines', 0)
                            await self._log("INFO", node.id, f"Read {line_count} lines from {output.get('file_path', 'file')}, ready for Loop node iteration")
                        elif read_mode == 'batch':
                            batch_count = output.get('total_batches', 0)
                            line_count = output.get('total_lines', 0)
                            await self._log("INFO", node.id, f"Read {line_count} lines in {batch_count} batches, ready for batch processing")
                    else:
                        await self._log("INFO", node.id, f"Read {len(str(output.get('data', ''))) if isinstance(output, dict) and output.get('data') else 0} bytes from {node.type}, wrapped output keys: {list(output.keys()) if isinstance(output, dict) else 'not a dict'}")
                    
                    await self._log("DEBUG", node.id, f"Wrapped output preview: {output_preview}")
            else:
                # Prepare inputs for this node (not needed for input sources)
                node_inputs = self._prepare_node_inputs(node)
                
                # For loop, condition, and agent nodes, if no explicit inputs, try to get from previous node
                if node.type in [NodeType.LOOP, NodeType.CONDITION, NodeType.AGENT] and not node_inputs:
                    # Find the previous node in the execution graph
                    previous_node_output = self._get_previous_node_output(node)
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
                        await self._log("DEBUG", node.id, f"Auto-populated inputs from previous node: {list(node_inputs.keys())}")
                
                node_state.input = node_inputs
                
                await self._log("INFO", node.id, f"Node inputs: {list(node_inputs.keys())}")
                
                # Execute based on node type
                if node.type in [NodeType.AGENT, NodeType.CONDITION, NodeType.LOOP]:
                    agent = AgentRegistry.get_agent(node, llm_config=self.llm_config, user_id=self.user_id)
                    output = await agent.execute(node_inputs)
                elif node.type == NodeType.TOOL:
                    output = node_inputs
                else:
                    output = node_inputs
            
            # Update node state
            node_state.status = ExecutionStatus.COMPLETED
            node_state.output = output
            node_state.completed_at = datetime.utcnow()
            
            output_summary = str(output)[:100] + "..." if len(str(output)) > 100 else str(output)
            await self._log("INFO", node.id, f"Node completed with output: {output_summary}")
            
            # Broadcast node completed
            await self._broadcast_node_update(node.id, node_state)
            
        except Exception as e:
            node_state.status = ExecutionStatus.FAILED
            node_state.completed_at = datetime.utcnow()
            
            # Get error message, handling empty or None cases
            error_msg = str(e) if e else "Unknown error"
            if not error_msg or error_msg.strip() == "":
                error_msg = f"{type(e).__name__}: {repr(e)}"
            node_state.error = error_msg
            
            await self._log("ERROR", node.id, f"Node failed: {error_msg}")
            
            # Also log the exception type and full traceback for debugging
            import traceback
            traceback_str = traceback.format_exc()
            await self._log("DEBUG", node.id, f"Exception type: {type(e).__name__}, Full traceback:\n{traceback_str}")
            
            # Broadcast node failed
            await self._broadcast_node_update(node.id, node_state)
    
    def _prepare_node_inputs(self, node: Node) -> Dict[str, Any]:
        """Prepare inputs for a node from previous nodes or workflow variables"""
        inputs = {}
        
        for input_mapping in node.inputs:
            if input_mapping.source_node:
                source_state = self.execution_state.node_states.get(input_mapping.source_node)
                if source_state and source_state.output is not None:
                    if isinstance(source_state.output, dict):
                        inputs[input_mapping.name] = source_state.output.get(
                            input_mapping.source_field,
                            source_state.output
                        )
                    else:
                        inputs[input_mapping.name] = source_state.output
                else:
                    raise ValueError(
                        f"Node {node.id} requires input '{input_mapping.name}' "
                        f"from node '{input_mapping.source_node}' but it's not available"
                    )
            else:
                if input_mapping.source_field in self.execution_state.variables:
                    inputs[input_mapping.name] = self.execution_state.variables[input_mapping.source_field]
                else:
                    raise ValueError(
                        f"Node {node.id} requires input '{input_mapping.name}' "
                        f"from workflow variable '{input_mapping.source_field}' but it's not available"
                    )
        
        return inputs
    
    def _get_previous_node_output(self, node: Node) -> Any:
        """Get output from the previous node in the execution graph"""
        # Find edges that point to this node
        incoming_edges = [e for e in self.workflow.edges if e.target == node.id]
        
        if not incoming_edges:
            return None
        
        # Get the first source node's output
        source_node_id = incoming_edges[0].source
        source_state = self.execution_state.node_states.get(source_node_id)
        
        if source_state and source_state.output is not None:
            return source_state.output
        
        return None
    
    def _resolve_config_variables(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Resolve variable references in config (e.g., ${variable_name})"""
        import re
        resolved_config = {}
        
        for key, value in config.items():
            # Handle None or empty values
            if value is None or (isinstance(value, str) and (not value or value.strip() == '')):
                # If value is empty/None, check if there's a workflow variable with the same name
                # But ignore empty {} from execution inputs
                if key in self.execution_state.variables:
                    resolved_value = self.execution_state.variables[key]
                    # Ignore empty dicts from execution inputs
                    if resolved_value == {}:
                        resolved_config[key] = value if value is not None else ''
                    else:
                        resolved_config[key] = str(resolved_value) if resolved_value is not None else ''
                else:
                    resolved_config[key] = value if value is not None else ''
            elif isinstance(value, str):
                # Check for variable references like ${variable_name}
                pattern = r'\$\{([^}]+)\}'
                matches = re.findall(pattern, value)
                
                if matches:
                    # Replace variables
                    resolved_value = value
                    for var_name in matches:
                        if var_name in self.execution_state.variables:
                            var_value = str(self.execution_state.variables[var_name])
                            resolved_value = resolved_value.replace(f"${{{var_name}}}", var_value)
                        # If variable not found, keep the placeholder (will fail validation with better error)
                    resolved_config[key] = resolved_value
                else:
                    resolved_config[key] = value
            else:
                resolved_config[key] = value
        
        return resolved_config
    
    async def _log(self, level: str, node_id: Optional[str], message: str):
        """Add a log entry and broadcast it"""
        if self.execution_state:
            log_entry = ExecutionLogEntry(
                timestamp=datetime.utcnow(),
                level=level,
                node_id=node_id,
                message=message
            )
            self.execution_state.logs.append(log_entry)
            
            # Broadcast log
            if self.stream_updates:
                await ws_manager.broadcast_log(
                    self.execution_id,
                    log_entry.model_dump(mode='json')
                )
    
    async def _broadcast_status(self, status: str):
        """Broadcast execution status update"""
        if self.stream_updates:
            await ws_manager.broadcast_status(
                self.execution_id,
                status,
                {
                    "workflow_id": self.execution_state.workflow_id,
                    "started_at": str(self.execution_state.started_at)
                }
            )
    
    async def _broadcast_node_update(self, node_id: str, node_state: NodeState):
        """Broadcast node execution update"""
        if self.stream_updates:
            await ws_manager.broadcast_node_update(
                self.execution_id,
                node_id,
                node_state.model_dump(mode='json')
            )
    
    async def _broadcast_completion(self):
        """Broadcast execution completion"""
        if self.stream_updates:
            await ws_manager.broadcast_completion(
                self.execution_id,
                {
                    "status": self.execution_state.status.value,
                    "result": self.execution_state.result,
                    "completed_at": str(self.execution_state.completed_at)
                }
            )
    
    async def _broadcast_error(self, error: str):
        """Broadcast execution error"""
        if self.stream_updates:
            await ws_manager.broadcast_error(self.execution_id, error)
