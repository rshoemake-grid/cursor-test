"""
Service layer for workflow business logic.
Handles workflow CRUD operations and business rules.
"""
from typing import Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4

from ..models.schemas import WorkflowCreate, WorkflowDefinition, Edge
from ..database.models import WorkflowDB
from ..repositories.workflow_repository import WorkflowRepository
from ..exceptions import WorkflowNotFoundError, WorkflowValidationError
from ..utils.logger import get_logger

logger = get_logger(__name__)


class WorkflowService:
    """Service for workflow operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = WorkflowRepository(db)
    
    async def create_workflow(
        self, 
        workflow_data: WorkflowCreate, 
        user_id: Optional[str] = None
    ) -> WorkflowDB:
        """
        Create a new workflow
        
        Args:
            workflow_data: Workflow creation data
            user_id: Optional user ID for ownership
        
        Returns:
            Created workflow database entity
        
        Raises:
            WorkflowValidationError: If workflow data is invalid
        """
        try:
            workflow_id = str(uuid4())
            now = datetime.utcnow()
            
            # Validate and process edges - ensure all have IDs
            processed_edges = []
            for i, edge in enumerate(workflow_data.edges):
                if not hasattr(edge, 'id') or not edge.id:
                    edge_id = f"e-{edge.source}-{edge.target}-{i}"
                    edge_dict = edge.model_dump() if hasattr(edge, 'model_dump') else dict(edge)
                    edge_dict['id'] = edge_id
                    processed_edges.append(edge_dict)
                else:
                    processed_edges.append(edge.model_dump() if hasattr(edge, 'model_dump') else dict(edge))
            
            # Create workflow definition
            workflow_def = WorkflowDefinition(
                id=workflow_id,
                name=workflow_data.name,
                description=workflow_data.description,
                nodes=workflow_data.nodes,
                edges=workflow_data.edges,
                variables=workflow_data.variables,
                created_at=now,
                updated_at=now
            )
            
            # Create database entity
            db_workflow = WorkflowDB(
                id=workflow_id,
                name=workflow_data.name,
                description=workflow_data.description,
                definition={
                    "nodes": [node.model_dump() for node in workflow_data.nodes],
                    "edges": processed_edges,
                    "variables": workflow_data.variables
                },
                owner_id=user_id,
                is_public=False,
                is_template=False,
                category=None,
                tags=[],
                created_at=now,
                updated_at=now
            )
            
            workflow = await self.repository.create(db_workflow)
            logger.info(f"Created workflow {workflow_id} for user {user_id or 'anonymous'}")
            return workflow
            
        except Exception as e:
            logger.error(f"Error creating workflow: {e}", exc_info=True)
            raise WorkflowValidationError(f"Failed to create workflow: {str(e)}")
    
    async def get_workflow(self, workflow_id: str) -> WorkflowDB:
        """
        Get workflow by ID
        
        Args:
            workflow_id: Workflow ID
        
        Returns:
            Workflow database entity
        
        Raises:
            WorkflowNotFoundError: If workflow not found
        """
        workflow = await self.repository.get_by_id(workflow_id)
        if not workflow:
            raise WorkflowNotFoundError(workflow_id)
        return workflow
    
    async def list_workflows(
        self, 
        user_id: Optional[str] = None,
        include_public: bool = True,
        limit: Optional[int] = None
    ) -> List[WorkflowDB]:
        """
        List workflows
        
        Args:
            user_id: Optional user ID to filter by owner
            include_public: Whether to include public workflows
            limit: Optional limit on number of results
        
        Returns:
            List of workflows
        """
        if user_id:
            # Authenticated user: return their workflows
            return await self.repository.get_by_owner(user_id, limit=limit)
        else:
            # Unauthenticated user: only return anonymous workflows (owner_id = None)
            return await self.repository.get_anonymous_workflows(limit=limit)
    
    async def update_workflow(
        self,
        workflow_id: str,
        workflow_data: WorkflowCreate,
        user_id: Optional[str] = None
    ) -> WorkflowDB:
        """
        Update an existing workflow
        
        Args:
            workflow_id: Workflow ID to update
            workflow_data: Updated workflow data
            user_id: Optional user ID for authorization check
        
        Returns:
            Updated workflow database entity
        
        Raises:
            WorkflowNotFoundError: If workflow not found
            WorkflowValidationError: If update data is invalid
        """
        workflow = await self.get_workflow(workflow_id)
        
        # TODO: Add authorization check (user_id must match owner_id)
        
        try:
            # Process nodes and edges similar to create
            processed_nodes = []
            for i, node in enumerate(workflow_data.nodes):
                try:
                    node_dict = node.model_dump() if hasattr(node, 'model_dump') else dict(node)
                    processed_nodes.append(node_dict)
                except Exception as node_error:
                    logger.error(f"Error serializing node {i}: {node_error}", exc_info=True)
                    raise WorkflowValidationError(f"Invalid node at index {i}: {str(node_error)}")
            
            processed_edges = []
            for i, edge in enumerate(workflow_data.edges):
                edge_dict = edge.model_dump() if hasattr(edge, 'model_dump') else dict(edge)
                if not edge_dict.get('id'):
                    edge_dict['id'] = f"e-{edge.source}-{edge.target}-{i}"
                processed_edges.append(edge_dict)
            
            # Update workflow
            updated_workflow = await self.repository.update(
                workflow_id,
                name=workflow_data.name,
                description=workflow_data.description,
                definition={
                    "nodes": processed_nodes,
                    "edges": processed_edges,
                    "variables": workflow_data.variables
                },
                updated_at=datetime.utcnow()
            )
            
            logger.info(f"Updated workflow {workflow_id}")
            return updated_workflow
            
        except WorkflowNotFoundError:
            raise
        except Exception as e:
            logger.error(f"Error updating workflow {workflow_id}: {e}", exc_info=True)
            raise WorkflowValidationError(f"Failed to update workflow: {str(e)}")
    
    async def delete_workflow(self, workflow_id: str, user_id: Optional[str] = None) -> bool:
        """
        Delete a workflow
        
        Args:
            workflow_id: Workflow ID to delete
            user_id: Optional user ID for authorization check
        
        Returns:
            True if deleted, False if not found
        
        Raises:
            WorkflowNotFoundError: If workflow not found
        """
        workflow = await self.get_workflow(workflow_id)
        
        # TODO: Add authorization check
        
        deleted = await self.repository.delete(workflow_id)
        if deleted:
            logger.info(f"Deleted workflow {workflow_id}")
        return deleted

