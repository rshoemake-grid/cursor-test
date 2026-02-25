"""
Additional tests for import_export_routes.py coverage gaps
"""
import pytest
import json
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi import HTTPException, UploadFile
from backend.api.import_export_routes import import_workflow_file, export_all_workflows
from backend.database.models import WorkflowDB


@pytest.mark.asyncio
async def test_import_workflow_file_export_format(db_session):
    """Test import_workflow_file with export format"""
    from uuid import uuid4
    from datetime import datetime
    
    user_id = str(uuid4())
    user = MagicMock()
    user.id = user_id
    
    export_data = {
        "workflow": {
            "name": "Exported",
            "nodes": [{"id": "start-1", "type": "start"}],
            "edges": [],
            "variables": {}
        }
    }
    
    mock_file = AsyncMock(spec=UploadFile)
    mock_file.read = AsyncMock(return_value=json.dumps(export_data).encode())
    
    result = await import_workflow_file(
        file=mock_file,
        current_user=user,
        db=db_session
    )
    
    assert result.name == "Exported"


@pytest.mark.asyncio
async def test_import_workflow_file_invalid_json(db_session):
    """Test import_workflow_file with invalid JSON"""
    user = MagicMock()
    user.id = "user-123"
    
    mock_file = AsyncMock(spec=UploadFile)
    mock_file.read = AsyncMock(return_value=b"invalid json")
    
    with pytest.raises(HTTPException) as exc_info:
        await import_workflow_file(file=mock_file, current_user=user, db=db_session)
    
    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_export_all_workflows_success(db_session):
    """Test export_all_workflows success"""
    from uuid import uuid4
    from datetime import datetime
    
    user_id = str(uuid4())
    user = MagicMock()
    user.id = user_id
    user.username = "testuser"
    
    workflows = [
        WorkflowDB(
            id="wf-1",
            name="Workflow 1",
            definition={"nodes": [], "edges": []},
            owner_id=user_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
    ]
    
    with patch.object(db_session, 'execute', new_callable=AsyncMock) as mock_execute:
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = workflows
        mock_execute.return_value = mock_result
        
        result = await export_all_workflows(current_user=user, db=db_session)
        
        assert hasattr(result, 'body')
