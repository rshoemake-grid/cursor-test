"""Tests for workflow chat save_workflow functionality"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from unittest.mock import patch, AsyncMock, Mock

from backend.database.models import WorkflowDB, UserDB, SettingsDB
from backend.database.db import get_db
from backend.auth import get_optional_user, create_access_token


@pytest.fixture
async def test_user(db_session: AsyncSession):
    """Create a test user"""
    import bcrypt
    password = "test123"
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    user = UserDB(
        id=str(uuid.uuid4()),
        username="testuser",
        email="test@example.com",
        hashed_password=hashed,
        is_active=True,
        is_admin=False
    )
    db_session.add(user)
    await db_session.commit()
    return user


@pytest.fixture
async def test_workflow(db_session: AsyncSession, test_user: UserDB):
    """Create a test workflow"""
    workflow = WorkflowDB(
        id=str(uuid.uuid4()),
        name="Test Workflow",
        description="A test workflow",
        version="1.0.0",
        definition={
            "nodes": [
                {"id": "start-1", "type": "start"},
                {"id": "end-1", "type": "end"}
            ],
            "edges": [],
            "variables": {}
        },
        owner_id=test_user.id,
        is_public=False
    )
    db_session.add(workflow)
    await db_session.commit()
    return workflow


@pytest.fixture
async def test_settings(db_session: AsyncSession, test_user: UserDB):
    """Create test LLM settings"""
    settings = SettingsDB(
        user_id=test_user.id,
        settings_data={
            "providers": [{
                "id": "test-provider",
                "name": "Test Provider",
                "type": "openai",
                "apiKey": "sk-test-key-123456789012345678901234567890",
                "baseUrl": None,
                "defaultModel": "gpt-4",
                "models": ["gpt-4"],
                "enabled": True
            }],
            "iteration_limit": 10
        }
    )
    db_session.add(settings)
    await db_session.commit()
    return settings


@pytest.mark.asyncio
async def test_chat_save_workflow_with_changes(db_session: AsyncSession, test_user: UserDB, test_workflow: WorkflowDB, test_settings: SettingsDB):
    """Test chat with save_workflow after making changes"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_optional_user] = override_get_user
    
    token = create_access_token(data={"sub": test_user.username})
    
    # Mock OpenAI client - first add node, then save
    mock_tool_call_add = Mock()
    mock_tool_call_add.id = "call_123"
    mock_tool_call_add.function.name = "add_node"
    mock_tool_call_add.function.arguments = '{"node_type": "agent", "name": "New Agent"}'
    
    mock_tool_call_save = Mock()
    mock_tool_call_save.id = "call_456"
    mock_tool_call_save.function.name = "save_workflow"
    mock_tool_call_save.function.arguments = '{"name": "Updated Workflow"}'
    
    mock_message_with_tools1 = Mock()
    mock_message_with_tools1.content = None
    mock_message_with_tools1.tool_calls = [mock_tool_call_add]
    
    mock_message_with_tools2 = Mock()
    mock_message_with_tools2.content = None
    mock_message_with_tools2.tool_calls = [mock_tool_call_save]
    
    mock_message_final = Mock()
    mock_message_final.content = "Workflow saved with changes"
    mock_message_final.tool_calls = None
    
    mock_response1 = AsyncMock()
    mock_response1.choices = [Mock()]
    mock_response1.choices[0].message = mock_message_with_tools1
    
    mock_response2 = AsyncMock()
    mock_response2.choices = [Mock()]
    mock_response2.choices[0].message = mock_message_with_tools2
    
    mock_response3 = AsyncMock()
    mock_response3.choices = [Mock()]
    mock_response3.choices[0].message = mock_message_final
    
    with patch("backend.api.workflow_chat_routes.AsyncOpenAI") as mock_openai_class:
        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(side_effect=[mock_response1, mock_response2, mock_response3])
        mock_openai_class.return_value = mock_client
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.post(
                    "/api/workflow-chat/chat",
                    json={
                        "workflow_id": test_workflow.id,
                        "message": "Add a node and save",
                        "conversation_history": []
                    },
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 200
                data = response.json()
                assert "message" in data
        finally:
            app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_chat_save_workflow_with_description(db_session: AsyncSession, test_user: UserDB, test_workflow: WorkflowDB, test_settings: SettingsDB):
    """Test chat with save_workflow updating description"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_optional_user] = override_get_user
    
    token = create_access_token(data={"sub": test_user.username})
    
    # Mock OpenAI client with save_workflow tool call
    mock_tool_call = Mock()
    mock_tool_call.id = "call_123"
    mock_tool_call.function.name = "save_workflow"
    mock_tool_call.function.arguments = '{"description": "Updated description"}'
    
    mock_message_with_tools = Mock()
    mock_message_with_tools.content = None
    mock_message_with_tools.tool_calls = [mock_tool_call]
    
    mock_message_final = Mock()
    mock_message_final.content = "Description updated"
    mock_message_final.tool_calls = None
    
    mock_response1 = AsyncMock()
    mock_response1.choices = [Mock()]
    mock_response1.choices[0].message = mock_message_with_tools
    
    mock_response2 = AsyncMock()
    mock_response2.choices = [Mock()]
    mock_response2.choices[0].message = mock_message_final
    
    with patch("backend.api.workflow_chat_routes.AsyncOpenAI") as mock_openai_class:
        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(side_effect=[mock_response1, mock_response2])
        mock_openai_class.return_value = mock_client
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.post(
                    "/api/workflow-chat/chat",
                    json={
                        "workflow_id": test_workflow.id,
                        "message": "Update description",
                        "conversation_history": []
                    },
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_chat_save_workflow_workflow_not_found(db_session: AsyncSession, test_user: UserDB, test_settings: SettingsDB):
    """Test chat with save_workflow when workflow doesn't exist"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_optional_user] = override_get_user
    
    token = create_access_token(data={"sub": test_user.username})
    
    # Mock OpenAI client with save_workflow tool call
    mock_tool_call = Mock()
    mock_tool_call.id = "call_123"
    mock_tool_call.function.name = "save_workflow"
    mock_tool_call.function.arguments = '{"name": "New Workflow"}'
    
    mock_message_with_tools = Mock()
    mock_message_with_tools.content = None
    mock_message_with_tools.tool_calls = [mock_tool_call]
    
    mock_message_final = Mock()
    mock_message_final.content = "Workflow not found"
    mock_message_final.tool_calls = None
    
    mock_response1 = AsyncMock()
    mock_response1.choices = [Mock()]
    mock_response1.choices[0].message = mock_message_with_tools
    
    mock_response2 = AsyncMock()
    mock_response2.choices = [Mock()]
    mock_response2.choices[0].message = mock_message_final
    
    with patch("backend.api.workflow_chat_routes.AsyncOpenAI") as mock_openai_class:
        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(side_effect=[mock_response1, mock_response2])
        mock_openai_class.return_value = mock_client
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.post(
                    "/api/workflow-chat/chat",
                    json={
                        "workflow_id": str(uuid.uuid4()),  # Non-existent workflow
                        "message": "Save workflow",
                        "conversation_history": []
                    },
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()

