from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class NodeType(str, Enum):
    """Types of nodes in a workflow"""
    AGENT = "agent"
    TOOL = "tool"
    CONDITION = "condition"
    LOOP = "loop"
    START = "start"
    END = "end"


class ExecutionStatus(str, Enum):
    """Execution status enum"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"


class AgentConfig(BaseModel):
    """Configuration for an agent node"""
    model: str = "gpt-4o-mini"
    system_prompt: Optional[str] = None
    temperature: float = 0.7
    max_tokens: Optional[int] = None
    tools: List[str] = Field(default_factory=list)


class InputMapping(BaseModel):
    """Maps input from previous nodes or workflow variables"""
    name: str
    source_node: Optional[str] = None  # None means workflow input
    source_field: str = "output"


class ConditionConfig(BaseModel):
    """Configuration for a condition node"""
    condition_type: str = "equals"  # equals, contains, greater_than, less_than, custom
    field: str
    value: str
    true_branch: Optional[str] = None
    false_branch: Optional[str] = None
    custom_expression: Optional[str] = None


class LoopConfig(BaseModel):
    """Configuration for a loop node"""
    loop_type: str = "for_each"  # for_each, while, until
    items_source: Optional[str] = None
    condition: Optional[str] = None
    max_iterations: int = 10


class Node(BaseModel):
    """A node in the workflow graph"""
    id: str
    type: NodeType
    name: str
    description: Optional[str] = None
    agent_config: Optional[AgentConfig] = None
    condition_config: Optional[ConditionConfig] = None
    loop_config: Optional[LoopConfig] = None
    inputs: List[InputMapping] = Field(default_factory=list)
    position: Dict[str, float] = Field(default_factory=dict)


class Edge(BaseModel):
    """An edge connecting two nodes"""
    id: str
    source: str
    target: str
    label: Optional[str] = None


class WorkflowDefinition(BaseModel):
    """Complete workflow definition"""
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    version: str = "1.0.0"
    nodes: List[Node]
    edges: List[Edge]
    variables: Dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class NodeState(BaseModel):
    """State of a node during execution"""
    node_id: str
    status: ExecutionStatus
    input: Optional[Dict[str, Any]] = None
    output: Optional[Any] = None
    error: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class ExecutionLogEntry(BaseModel):
    """A log entry during execution"""
    timestamp: datetime
    level: str  # INFO, WARNING, ERROR
    node_id: Optional[str] = None
    message: str


class ExecutionState(BaseModel):
    """State of a workflow execution"""
    execution_id: str
    workflow_id: str
    status: ExecutionStatus
    current_node: Optional[str] = None
    node_states: Dict[str, NodeState] = Field(default_factory=dict)
    variables: Dict[str, Any] = Field(default_factory=dict)
    result: Optional[Any] = None
    error: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    logs: List[ExecutionLogEntry] = Field(default_factory=list)


# API Request/Response Models
class WorkflowCreate(BaseModel):
    """Request model for creating a workflow"""
    name: str
    description: Optional[str] = None
    nodes: List[Node]
    edges: List[Edge]
    variables: Dict[str, Any] = Field(default_factory=dict)


class WorkflowResponse(BaseModel):
    """Response model for workflow"""
    id: str
    name: str
    description: Optional[str] = None
    version: str
    nodes: List[Node]
    edges: List[Edge]
    variables: Dict[str, Any]
    created_at: datetime
    updated_at: datetime


class ExecutionRequest(BaseModel):
    """Request to execute a workflow"""
    workflow_id: str
    inputs: Dict[str, Any] = Field(default_factory=dict)


class ExecutionResponse(BaseModel):
    """Response model for execution"""
    execution_id: str
    workflow_id: str
    status: ExecutionStatus
    current_node: Optional[str] = None
    result: Optional[Any] = None
    error: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    logs: List[ExecutionLogEntry] = Field(default_factory=list)

