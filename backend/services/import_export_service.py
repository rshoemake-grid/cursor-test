"""
Import/Export service - SRP: business logic for workflow import and export.
"""
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database.models import WorkflowDB


class ImportExportService:
    """Service for workflow import and export operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def import_workflow(
        self,
        definition: Dict[str, Any],
        name: Optional[str] = None,
        description: Optional[str] = None,
        owner_id: Optional[str] = None,
    ) -> WorkflowDB:
        """Import a workflow from definition. Returns created WorkflowDB."""
        workflow_id = str(uuid.uuid4())
        workflow = WorkflowDB(
            id=workflow_id,
            name=name or f"Imported Workflow {workflow_id[:8]}",
            description=description,
            version="1.0.0",
            definition=definition,
            owner_id=owner_id,
            is_public=False,
            is_template=False,
            category=definition.get("category"),
            tags=definition.get("tags") or []
        )
        self.db.add(workflow)
        await self.db.commit()
        await self.db.refresh(workflow)
        return workflow

    async def import_workflow_from_file_data(
        self,
        data: Dict[str, Any],
        owner_id: Optional[str] = None,
    ) -> WorkflowDB:
        """Import workflow from parsed file data (export format or direct definition)."""
        if "workflow" in data:
            workflow_data = data["workflow"]
            definition = {
                "nodes": workflow_data.get("nodes", []),
                "edges": workflow_data.get("edges", []),
                "variables": workflow_data.get("variables", {})
            }
            name = workflow_data.get("name")
            description = workflow_data.get("description")
            category = workflow_data.get("category")
            tags = workflow_data.get("tags") or []
        else:
            definition = data
            name = data.get("name")
            description = data.get("description")
            category = data.get("category")
            tags = data.get("tags") or []

        if "nodes" not in definition or "edges" not in definition:
            raise ValueError("Invalid workflow: must contain 'nodes' and 'edges'")

        workflow_id = str(uuid.uuid4())
        workflow = WorkflowDB(
            id=workflow_id,
            name=name or f"Imported Workflow {workflow_id[:8]}",
            description=description,
            version="1.0.0",
            definition=definition,
            owner_id=owner_id,
            is_public=False,
            is_template=False,
            category=category,
            tags=tags or []
        )
        self.db.add(workflow)
        await self.db.commit()
        await self.db.refresh(workflow)
        return workflow

    async def export_all_workflows(
        self,
        user_id: str,
        username: str,
    ) -> Dict[str, Any]:
        """Export all workflows owned by user. Returns dict for JSONResponse."""
        result = await self.db.execute(
            select(WorkflowDB).where(WorkflowDB.owner_id == user_id)
        )
        workflows = result.scalars().all()
        exports: List[Dict[str, Any]] = []
        for workflow in workflows:
            exports.append({
                "id": workflow.id,
                "name": workflow.name,
                "description": workflow.description,
                "version": workflow.version,
                "definition": workflow.definition,
                "created_at": workflow.created_at.isoformat(),
                "updated_at": workflow.updated_at.isoformat()
            })
        return {
            "export_version": "1.0",
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "exported_by": username,
            "workflows": exports
        }
