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
    
    def __init__(self, workflow: WorkflowDefinition, stream_updates: bool = False):
        self.workflow = workflow
        self.execution_id = str(uuid.uuid4())
        self.execution_state: Optional[ExecutionState] = None
        self.loop_states: Dict[str, Dict[str, Any]] = {}
        self.stream_updates = stream_updates
        
    async def execute(self, inputs: Dict[str, Any]) -> ExecutionState:
        """
        Execute the workflow with given inputs
        Broadcasts updates via WebSocket if stream_updates is True
        """
        # Initialize execution state
        self.execution_state = ExecutionState(
            execution_id=self.execution_id,
            workflow_id=self.workflow.id or "unknown",
            status=ExecutionStatus.RUNNING,
            variables={**self.workflow.variables, **inputs},
            started_at=datetime.utcnow()
        )
        
        await self._log("INFO", None, "Workflow execution started (V3 - WebSocket Streaming)")
        await self._broadcast_status("running")
        
        try:
            # Build adjacency map
            adjacency, in_degree = self._build_graph()
            
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
        """Build adjacency map and in-degree map"""
        adjacency: Dict[str, List[str]] = {node.id: [] for node in self.workflow.nodes}
        in_degree: Dict[str, int] = {node.id: 0 for node in self.workflow.nodes}
        
        for edge in self.workflow.edges:
            adjacency[edge.source].append(edge.target)
            in_degree[edge.target] += 1
        
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
        
        queue = start_nodes.copy()
        
        while queue or in_progress:
            # Collect nodes that can be executed in parallel
            parallel_batch = []
            
            for node_id in queue[:]:
                node = node_map[node_id]
                
                # Skip START and END nodes in execution
                if node.type in [NodeType.START, NodeType.END]:
                    queue.remove(node_id)
                    completed.add(node_id)
                    
                    for neighbor_id in adjacency[node_id]:
                        dependencies = [n for n, neighbors in adjacency.items() if neighbor_id in neighbors]
                        if all(dep in completed for dep in dependencies):
                            if neighbor_id not in queue and neighbor_id not in in_progress:
                                queue.append(neighbor_id)
                    continue
                
                # Check if dependencies are met
                dependencies = [n for n, neighbors in adjacency.items() if node_id in neighbors]
                if all(dep in completed for dep in dependencies):
                    parallel_batch.append(node)
                    queue.remove(node_id)
                    in_progress.add(node_id)
            
            if not parallel_batch and not in_progress:
                break
            
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
                    
                    # Handle conditional branching
                    if node.type == NodeType.CONDITION and node_state.output:
                        branch = node_state.output.get("branch", "true")
                        
                        for edge in self.workflow.edges:
                            if edge.source == node.id:
                                edge_condition = getattr(edge, 'condition', 'default')
                                if edge_condition == branch or edge_condition == 'default':
                                    if edge.target not in queue and edge.target not in in_progress:
                                        queue.append(edge.target)
                    else:
                        for neighbor_id in adjacency[node.id]:
                            dependencies = [n for n, neighbors in adjacency.items() if neighbor_id in neighbors]
                            if all(dep in completed for dep in dependencies):
                                if neighbor_id not in queue and neighbor_id not in in_progress:
                                    queue.append(neighbor_id)
            
            await asyncio.sleep(0.01)
    
    async def _execute_node(self, node: Node):
        """Execute a single node with WebSocket updates"""
        await self._log("INFO", node.id, f"Executing node: {node.name}")
        
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
            # Prepare inputs for this node
            node_inputs = self._prepare_node_inputs(node)
            node_state.input = node_inputs
            
            await self._log("INFO", node.id, f"Node inputs: {list(node_inputs.keys())}")
            
            # Execute based on node type
            if node.type in [NodeType.AGENT, NodeType.CONDITION, NodeType.LOOP]:
                agent = AgentRegistry.get_agent(node)
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
            node_state.error = str(e)
            node_state.completed_at = datetime.utcnow()
            await self._log("ERROR", node.id, f"Node failed: {str(e)}")
            
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

