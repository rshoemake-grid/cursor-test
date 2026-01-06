from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, model_validator


class NodeType(str, Enum):
    """Types of nodes in a workflow"""
    AGENT = "agent"
    TOOL = "tool"
    CONDITION = "condition"
    LOOP = "loop"
    START = "start"
    END = "end"
    GCP_BUCKET = "gcp_bucket"
    AWS_S3 = "aws_s3"
    GCP_PUBSUB = "gcp_pubsub"
    LOCAL_FILESYSTEM = "local_filesystem"


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
    condition_type: Optional[str] = "equals"  # equals, contains, greater_than, less_than, custom
    field: Optional[str] = None  # Required only when condition_config is actually used
    value: Optional[str] = None  # Required only when condition_config is actually used
    true_branch: Optional[str] = None
    false_branch: Optional[str] = None
    custom_expression: Optional[str] = None
    
    @model_validator(mode='before')
    @classmethod
    def validate_empty_dict(cls, v):
        """Allow empty dict to be converted to None"""
        if isinstance(v, dict) and len(v) == 0:
            return None
        return v


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
    name: Optional[str] = None  # Optional - can be in data object
    description: Optional[str] = None
    agent_config: Optional[AgentConfig] = None
    condition_config: Optional[ConditionConfig] = None
    loop_config: Optional[LoopConfig] = None
    input_config: Optional[Dict[str, Any]] = None  # Configuration for input source nodes (GCP Bucket, AWS S3, etc.)
    inputs: List[InputMapping] = Field(default_factory=list)
    position: Dict[str, float] = Field(default_factory=dict)
    data: Optional[Dict[str, Any]] = Field(default_factory=dict)  # React Flow data object
    
    @model_validator(mode='before')
    @classmethod
    def validate_configs(cls, v):
        """Convert empty config dicts to None before validation"""
        if isinstance(v, dict):
            # Convert empty config dicts to None
            for config_key in ['agent_config', 'condition_config', 'loop_config', 'input_config']:
                if config_key in v and isinstance(v[config_key], dict) and len(v[config_key]) == 0:
                    v[config_key] = None
        return v


class Edge(BaseModel):
    """An edge connecting two nodes"""
    id: Optional[str] = None  # Optional - will be auto-generated if missing
    source: str
    target: str
    label: Optional[str] = None
    sourceHandle: Optional[str] = None  # Handle ID for source node (e.g., "true", "false" for condition nodes)
    targetHandle: Optional[str] = None  # Handle ID for target node
    source_handle: Optional[str] = None  # Alternative snake_case name (for compatibility)
    target_handle: Optional[str] = None  # Alternative snake_case name (for compatibility)
    
    @model_validator(mode='before')
    @classmethod
    def normalize_handles(cls, v):
        """Normalize handle fields - prefer camelCase, fallback to snake_case"""
        if isinstance(v, dict):
            # If source_handle exists but sourceHandle doesn't, copy it
            if 'source_handle' in v and v['source_handle'] and 'sourceHandle' not in v:
                v['sourceHandle'] = v['source_handle']
            # If target_handle exists but targetHandle doesn't, copy it
            if 'target_handle' in v and v['target_handle'] and 'targetHandle' not in v:
                v['targetHandle'] = v['target_handle']
        return v
    
    def model_post_init(self, __context: Any) -> None:
        """Auto-generate ID if missing"""
        if not self.id:
            self.id = f"e-{self.source}-{self.target}"


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


# ============================================================================
# Phase 4: Authentication & Multi-User Schemas
# ============================================================================

class UserCreate(BaseModel):
    """Schema for creating a new user"""
    username: str
    email: str
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    """Schema for user login"""
    username: str
    password: str


class UserResponse(BaseModel):
    """Response schema for user data"""
    id: str
    username: str
    email: str
    full_name: Optional[str] = None
    is_active: bool
    is_admin: bool
    created_at: datetime


class Token(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ============================================================================
# Phase 4: Workflow Templates
# ============================================================================

class TemplateCategory(str, Enum):
    """Template categories"""
    CONTENT_CREATION = "content_creation"
    DATA_ANALYSIS = "data_analysis"
    CUSTOMER_SERVICE = "customer_service"
    RESEARCH = "research"
    AUTOMATION = "automation"
    EDUCATION = "education"
    MARKETING = "marketing"
    OTHER = "other"


class TemplateDifficulty(str, Enum):
    """Template difficulty levels"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class WorkflowTemplateCreate(BaseModel):
    """Schema for creating a workflow template"""
    name: str
    description: Optional[str] = None
    category: TemplateCategory
    tags: List[str] = Field(default_factory=list)
    definition: Dict[str, Any]
    difficulty: TemplateDifficulty = TemplateDifficulty.BEGINNER
    estimated_time: Optional[str] = None
    is_official: bool = False


class WorkflowTemplateResponse(BaseModel):
    """Response schema for workflow template"""
    id: str
    name: str
    description: Optional[str] = None
    category: str
    tags: List[str]
    difficulty: str
    estimated_time: Optional[str] = None
    is_official: bool
    uses_count: int
    likes_count: int
    rating: int
    author_id: Optional[str] = None
    thumbnail_url: Optional[str] = None
    preview_image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ============================================================================
# Phase 4: Workflow Sharing & Permissions
# ============================================================================

class SharePermission(str, Enum):
    """Permission levels for shared workflows"""
    VIEW = "view"
    EXECUTE = "execute"
    EDIT = "edit"


class WorkflowShareCreate(BaseModel):
    """Schema for sharing a workflow"""
    workflow_id: str
    shared_with_username: str
    permission: SharePermission


class WorkflowShareResponse(BaseModel):
    """Response schema for workflow share"""
    id: str
    workflow_id: str
    shared_with_user_id: str
    permission: str
    shared_by: str
    created_at: datetime


# ============================================================================
# Phase 4: Workflow Versioning
# ============================================================================

class WorkflowVersionCreate(BaseModel):
    """Schema for creating a workflow version"""
    workflow_id: str
    change_notes: Optional[str] = None


class WorkflowVersionResponse(BaseModel):
    """Response schema for workflow version"""
    id: str
    workflow_id: str
    version_number: int
    change_notes: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime


# ============================================================================
# Phase 4: Enhanced Workflow Schemas
# ============================================================================

class WorkflowCreateV2(BaseModel):
    """Enhanced workflow creation schema with Phase 4 features"""
    name: str
    description: Optional[str] = None
    nodes: List[Node]
    edges: List[Edge]
    variables: Dict[str, Any] = Field(default_factory=dict)
    is_public: bool = False
    is_template: bool = False
    category: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class WorkflowResponseV2(BaseModel):
    """Enhanced workflow response with Phase 4 features"""
    id: str
    name: str
    description: Optional[str] = None
    version: str
    nodes: List[Node]
    edges: List[Edge]
    variables: Dict[str, Any]
    
    # Phase 4 fields
    owner_id: Optional[str] = None
    is_public: bool
    is_template: bool
    category: Optional[str] = None
    tags: List[str]
    likes_count: int
    views_count: int
    uses_count: int
    
    created_at: datetime
    updated_at: datetime


# ============================================================================
# Phase 4: Marketplace
# ============================================================================

class WorkflowLike(BaseModel):
    """Schema for liking a workflow"""
    workflow_id: str


class MarketplaceFilters(BaseModel):
    """Filters for marketplace search"""
    category: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    difficulty: Optional[str] = None
    min_rating: Optional[int] = None
    search_query: Optional[str] = None
    sort_by: str = "popular"  # popular, recent, rating


class MarketplaceResponse(BaseModel):
    """Response for marketplace listing"""
    templates: List[WorkflowTemplateResponse]
    total: int
    page: int
    page_size: int


# ============================================================================
# Phase 4: Import/Export
# ============================================================================

class WorkflowExport(BaseModel):
    """Schema for exporting a workflow"""
    workflow: WorkflowResponseV2
    version: str = "1.0"
    exported_at: datetime
    exported_by: Optional[str] = None


class WorkflowImport(BaseModel):
    """Schema for importing a workflow"""
    name: Optional[str] = None
    description: Optional[str] = None
    definition: Dict[str, Any]

