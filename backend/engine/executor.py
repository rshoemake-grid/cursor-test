import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
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


class WorkflowExecutor:
    """Executes workflows sequentially"""
    
    def __init__(self, workflow: WorkflowDefinition):
        self.workflow = workflow
        self.execution_id = str(uuid.uuid4())
        self.execution_state: Optional[ExecutionState] = None
        
    async def execute(self, inputs: Dict[str, Any]) -> ExecutionState:
        """
        Execute the workflow with given inputs
        
        Args:
            inputs: Initial workflow inputs
            
        Returns:
            Final execution state
        """
        # Initialize execution state
        self.execution_state = ExecutionState(
            execution_id=self.execution_id,
            workflow_id=self.workflow.id or "unknown",
            status=ExecutionStatus.RUNNING,
            variables={**self.workflow.variables, **inputs},
            started_at=datetime.utcnow()
        )
        
        self._log("INFO", None, "Workflow execution started")
        
        try:
            # Get execution order
            execution_order = self._get_execution_order()
            
            self._log("INFO", None, f"Execution order: {[n.name for n in execution_order]}")
            
            # Execute nodes in order
            for node in execution_order:
                await self._execute_node(node)
                
                # Check if execution failed
                node_state = self.execution_state.node_states[node.id]
                if node_state.status == ExecutionStatus.FAILED:
                    self.execution_state.status = ExecutionStatus.FAILED
                    self.execution_state.error = node_state.error
                    break
            
            # If no failures, mark as completed
            if self.execution_state.status == ExecutionStatus.RUNNING:
                self.execution_state.status = ExecutionStatus.COMPLETED
                # Set result to the output of the last node
                if execution_order:
                    last_node = execution_order[-1]
                    last_state = self.execution_state.node_states.get(last_node.id)
                    if last_state:
                        self.execution_state.result = last_state.output
            
            self.execution_state.completed_at = datetime.utcnow()
            self._log("INFO", None, f"Workflow execution {self.execution_state.status.value}")
            
        except Exception as e:
            self.execution_state.status = ExecutionStatus.FAILED
            self.execution_state.error = str(e)
            self.execution_state.completed_at = datetime.utcnow()
            self._log("ERROR", None, f"Workflow execution failed: {str(e)}")
        
        return self.execution_state
    
    def _get_execution_order(self) -> List[Node]:
        """
        Determine the order of node execution based on edges.
        For Phase 1, this implements simple sequential execution.
        """
        # Build adjacency map, filtering out edges to deleted nodes
        # Create set of valid node IDs for quick lookup
        valid_node_ids = {node.id for node in self.workflow.nodes}
        
        adjacency: Dict[str, List[str]] = {node.id: [] for node in self.workflow.nodes}
        in_degree: Dict[str, int] = {node.id: 0 for node in self.workflow.nodes}
        
        # Only process edges that connect existing nodes
        for edge in self.workflow.edges:
            # Skip edges that reference deleted nodes
            if edge.source not in valid_node_ids or edge.target not in valid_node_ids:
                continue
            
            # Only add edge if both nodes exist
            if edge.source in adjacency and edge.target in in_degree:
                adjacency[edge.source].append(edge.target)
                in_degree[edge.target] += 1
        
        # Find start nodes (nodes with no incoming edges)
        start_nodes = [node_id for node_id, degree in in_degree.items() if degree == 0]
        
        if not start_nodes:
            # If no clear start, just use the first START type or first node
            start_node = next((n for n in self.workflow.nodes if n.type == NodeType.START), None)
            if start_node:
                start_nodes = [start_node.id]
            elif self.workflow.nodes:
                start_nodes = [self.workflow.nodes[0].id]
        
        # Topological sort (Kahn's algorithm)
        execution_order = []
        queue = start_nodes.copy()
        node_map = {node.id: node for node in self.workflow.nodes}
        
        while queue:
            current_id = queue.pop(0)
            current_node = node_map[current_id]
            
            # Skip START and END nodes in execution
            if current_node.type not in [NodeType.START, NodeType.END]:
                execution_order.append(current_node)
            
            # Add children to queue
            for neighbor_id in adjacency[current_id]:
                in_degree[neighbor_id] -= 1
                if in_degree[neighbor_id] == 0:
                    queue.append(neighbor_id)
        
        return execution_order
    
    async def _execute_node(self, node: Node):
        """Execute a single node"""
        self._log("INFO", node.id, f"Executing node: {node.name}")
        
        # Initialize node state
        node_state = NodeState(
            node_id=node.id,
            status=ExecutionStatus.RUNNING,
            started_at=datetime.utcnow()
        )
        self.execution_state.node_states[node.id] = node_state
        self.execution_state.current_node = node.id
        
        try:
            # Prepare inputs for this node
            node_inputs = self._prepare_node_inputs(node)
            node_state.input = node_inputs
            
            self._log("INFO", node.id, f"Node inputs: {node_inputs}")
            
            # Execute based on node type
            if node.type == NodeType.AGENT:
                agent = AgentRegistry.get_agent(node)
                output = await agent.execute(node_inputs)
            elif node.type == NodeType.TOOL:
                # Tool execution would go here (Phase 2+)
                output = node_inputs
            else:
                output = node_inputs
            
            # Update node state
            node_state.status = ExecutionStatus.COMPLETED
            node_state.output = output
            node_state.completed_at = datetime.utcnow()
            
            self._log("INFO", node.id, f"Node completed with output: {str(output)[:100]}")
            
        except Exception as e:
            node_state.status = ExecutionStatus.FAILED
            node_state.error = str(e)
            node_state.completed_at = datetime.utcnow()
            self._log("ERROR", node.id, f"Node failed: {str(e)}")
    
    def _prepare_node_inputs(self, node: Node) -> Dict[str, Any]:
        """Prepare inputs for a node from previous nodes or workflow variables"""
        inputs = {}
        
        for input_mapping in node.inputs:
            if input_mapping.source_node:
                # Get from previous node output
                source_state = self.execution_state.node_states.get(input_mapping.source_node)
                if source_state and source_state.output is not None:
                    inputs[input_mapping.name] = source_state.output
                else:
                    raise ValueError(
                        f"Node {node.id} requires input '{input_mapping.name}' "
                        f"from node '{input_mapping.source_node}' but it's not available"
                    )
            else:
                # Get from workflow variables
                if input_mapping.source_field in self.execution_state.variables:
                    inputs[input_mapping.name] = self.execution_state.variables[input_mapping.source_field]
                else:
                    raise ValueError(
                        f"Node {node.id} requires input '{input_mapping.name}' "
                        f"from workflow variable '{input_mapping.source_field}' but it's not available"
                    )
        
        return inputs
    
    def _log(self, level: str, node_id: Optional[str], message: str):
        """Add a log entry"""
        if self.execution_state:
            log_entry = ExecutionLogEntry(
                timestamp=datetime.utcnow(),
                level=level,
                node_id=node_id,
                message=message
            )
            self.execution_state.logs.append(log_entry)

