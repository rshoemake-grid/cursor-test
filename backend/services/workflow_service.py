"""
Service layer for workflow business logic.
Handles workflow CRUD operations and business rules.
"""
from typing import Optional, List, Any, Dict
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4

from ..models.schemas import WorkflowCreate, WorkflowDefinition, Edge
from ..database.models import WorkflowDB
from ..repositories.workflow_repository import WorkflowRepository
from ..exceptions import WorkflowNotFoundError, WorkflowValidationError
from ..utils.logger import get_logger

logger = get_logger(__name__)


def _apply_chat_changes_merge(
    current_nodes: List[dict],
    current_edges: List[dict],
    nodes_to_add: List[dict],
    nodes_to_update: List[Dict[str, Any]],
    nodes_to_delete: List[str],
    edges_to_add: List[dict],
    edges_to_delete: List[Dict[str, str]],
) -> tuple[List[dict], List[dict]]:
    """Apply chat changes to nodes and edges (pure merge logic, no DB)."""
    final_nodes = list(current_nodes)
    final_edges = list(current_edges)
    final_nodes.extend(nodes_to_add)

    for update in nodes_to_update:
        nid = update["node_id"]
        updates = update["updates"]
        for i, node in enumerate(final_nodes):
            if node.get("id") == nid:
                final_nodes[i] = {**node, **updates}
                if "data" in node:
                    final_nodes[i]["data"] = {**node.get("data", {}), **updates}
                break

    nodes_to_delete_set = set(nodes_to_delete)
    final_nodes = [n for n in final_nodes if n.get("id") not in nodes_to_delete_set]
    final_edges.extend(edges_to_add)

    final_edges = [
        e for e in final_edges
        if not any(
            del_edge.get("source") == e.get("source") and del_edge.get("target") == e.get("target")
            for del_edge in edges_to_delete
        )
    ]
    return final_nodes, final_edges


def _to_dict(obj: Any) -> dict:
    """Serialize Pydantic model or dict-like to dict (DRY)."""
    return obj.model_dump() if hasattr(obj, "model_dump") else dict(obj)


def _process_edges(edges: List[Any], start_index: int = 0) -> List[dict]:
    """Process edges - ensure all have IDs (DRY: shared by create and update)."""
    processed = []
    for i, edge in enumerate(edges):
        edge_dict = _to_dict(edge)
        if not edge_dict.get("id"):
            source = edge_dict.get("source", getattr(edge, "source", ""))
            target = edge_dict.get("target", getattr(edge, "target", ""))
            edge_dict["id"] = f"e-{source}-{target}-{start_index + i}"
        processed.append(edge_dict)
    return processed


def _serialize_node(node: Any) -> dict:
    """Serialize node to dict (DRY)."""
    return _to_dict(node)


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
            
            processed_edges = _process_edges(workflow_data.edges)
            
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
                    "nodes": [_serialize_node(node) for node in workflow_data.nodes],
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
            # Unauthenticated user: return anonymous workflows (owner_id = None) and public workflows
            return await self.repository.get_anonymous_and_public_workflows(limit=limit)
    
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
            processed_nodes = []
            for i, node in enumerate(workflow_data.nodes):
                try:
                    processed_nodes.append(_serialize_node(node))
                except Exception as node_error:
                    logger.error(f"Error serializing node {i}: {node_error}", exc_info=True)
                    raise WorkflowValidationError(f"Invalid node at index {i}: {str(node_error)}")

            processed_edges = _process_edges(workflow_data.edges)
            
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

    async def apply_chat_changes(
        self,
        workflow_id: str,
        nodes_to_add: List[dict],
        nodes_to_update: List[Dict[str, Any]],
        nodes_to_delete: List[str],
        edges_to_add: List[dict],
        edges_to_delete: List[Dict[str, str]],
        name: Optional[str] = None,
        description: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Apply workflow chat changes (add/update/delete nodes and edges).
        Used by workflow chat route to persist LLM-suggested changes.

        Returns:
            Dict with nodes_count, edges_count, final_nodes, final_edges.
        """
        workflow = await self.get_workflow(workflow_id)
        current_definition = workflow.definition or {}
        current_nodes = current_definition.get("nodes", [])
        current_edges = current_definition.get("edges", [])

        final_nodes, final_edges = _apply_chat_changes_merge(
            current_nodes,
            current_edges,
            nodes_to_add,
            nodes_to_update,
            nodes_to_delete,
            edges_to_add,
            edges_to_delete,
        )

        update_kwargs: Dict[str, Any] = {
            "definition": {
                "nodes": final_nodes,
                "edges": final_edges,
                "variables": current_definition.get("variables", {}),
            },
            "updated_at": datetime.utcnow(),
        }
        if name is not None:
            update_kwargs["name"] = name
        if description is not None:
            update_kwargs["description"] = description

        await self.repository.update(workflow_id, **update_kwargs)
        logger.info(f"Applied chat changes to workflow {workflow_id}")
        return {
            "nodes_count": len(final_nodes),
            "edges_count": len(final_edges),
            "final_nodes": final_nodes,
            "final_edges": final_edges,
        }
    
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

