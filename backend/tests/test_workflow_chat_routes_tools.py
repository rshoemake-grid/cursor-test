"""Tests for workflow chat tool calling scenarios"""
import pytest
import json
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from unittest.mock import patch, AsyncMock, Mock

from backend.database.models import WorkflowDB, UserDB, SettingsDB
from backend.database.db import get_db
from backend.auth import get_optional_user, create_access_token


def setup_dependency_mocks(app, mock_client):
    """Helper function to set up dependency injection mocks"""
    from backend.services.settings_service import ISettingsService
    from backend.services.llm_client_factory import ILLMClientFactory
    from backend.dependencies import get_settings_service, get_llm_client_factory
    
    mock_settings_service = Mock(spec=ISettingsService)
    mock_settings_service.get_active_llm_config.return_value = {
        "type": "openai",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    mock_settings_service.get_user_settings.return_value = Mock(iteration_limit=10)
    
    mock_llm_client_factory = Mock(spec=ILLMClientFactory)
    mock_llm_client_factory.create_client = Mock(return_value=mock_client)
    
    app.dependency_overrides[get_settings_service] = lambda: mock_settings_service
    app.dependency_overrides[get_llm_client_factory] = lambda: mock_llm_client_factory
    
    return mock_settings_service, mock_llm_client_factory


@pytest.fixture
async def test_user(db_session: AsyncSession):
    """Create a test user"""
    user = UserDB(
        id=str(uuid.uuid4()),
        username="testuser",
        email="test@example.com",
        hashed_password="hashed_password",
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
async def test_chat_connect_nodes(db_session: AsyncSession, test_user: UserDB, test_workflow: WorkflowDB, test_settings: SettingsDB):
    """Test chat with connect_nodes tool call"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_optional_user] = override_get_user
    
    token = create_access_token(data={"sub": test_user.username})
    
    # Mock OpenAI client with connect_nodes tool call
    mock_tool_call = Mock()
    mock_tool_call.id = "call_123"
    mock_tool_call.function.name = "connect_nodes"
    mock_tool_call.function.arguments = '{"source_node_id": "start-1", "target_node_id": "end-1"}'
    
    mock_message_with_tools = Mock()
    mock_message_with_tools.content = None
    mock_message_with_tools.tool_calls = [mock_tool_call]
    
    mock_message_final = Mock()
    mock_message_final.content = "Nodes connected"
    mock_message_final.tool_calls = None
    
    mock_response1 = AsyncMock()
    mock_response1.choices = [Mock()]
    mock_response1.choices[0].message = mock_message_with_tools
    
    mock_response2 = AsyncMock()
    mock_response2.choices = [Mock()]
    mock_response2.choices[0].message = mock_message_final
    
    mock_client = AsyncMock()
    mock_client.chat.completions.create = AsyncMock(side_effect=[mock_response1, mock_response2])
    setup_dependency_mocks(app, mock_client)
    
    with patch("backend.api.workflow_chat_routes.AsyncOpenAI") as mock_openai_class:
        mock_openai_class.return_value = mock_client
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.post(
                    "/api/workflow-chat/chat",
                    json={
                        "workflow_id": test_workflow.id,
                        "message": "Connect start to end",
                        "conversation_history": []
                    },
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_chat_disconnect_nodes(db_session: AsyncSession, test_user: UserDB, test_workflow: WorkflowDB, test_settings: SettingsDB):
    """Test chat with disconnect_nodes tool call"""
    from main import app
    
    # Add an edge first
    test_workflow.definition["edges"] = [{"id": "e1", "source": "start-1", "target": "end-1"}]
    await db_session.commit()
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_optional_user] = override_get_user
    
    token = create_access_token(data={"sub": test_user.username})
    
    # Mock OpenAI client with disconnect_nodes tool call
    mock_tool_call = Mock()
    mock_tool_call.id = "call_123"
    mock_tool_call.function.name = "disconnect_nodes"
    mock_tool_call.function.arguments = '{"source_node_id": "start-1", "target_node_id": "end-1"}'
    
    mock_message_with_tools = Mock()
    mock_message_with_tools.content = None
    mock_message_with_tools.tool_calls = [mock_tool_call]
    
    mock_message_final = Mock()
    mock_message_final.content = "Nodes disconnected"
    mock_message_final.tool_calls = None
    
    mock_response1 = AsyncMock()
    mock_response1.choices = [Mock()]
    mock_response1.choices[0].message = mock_message_with_tools
    
    mock_response2 = AsyncMock()
    mock_response2.choices = [Mock()]
    mock_response2.choices[0].message = mock_message_final
    
    mock_client = AsyncMock()
    mock_client.chat.completions.create = AsyncMock(side_effect=[mock_response1, mock_response2])
    setup_dependency_mocks(app, mock_client)
    
    with patch("backend.api.workflow_chat_routes.AsyncOpenAI") as mock_openai_class:
        mock_openai_class.return_value = mock_client
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.post(
                    "/api/workflow-chat/chat",
                    json={
                        "workflow_id": test_workflow.id,
                        "message": "Disconnect start from end",
                        "conversation_history": []
                    },
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_chat_get_workflow_info(db_session: AsyncSession, test_user: UserDB, test_workflow: WorkflowDB, test_settings: SettingsDB):
    """Test chat with get_workflow_info tool call"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_optional_user] = override_get_user
    
    token = create_access_token(data={"sub": test_user.username})
    
    # Mock OpenAI client with get_workflow_info tool call
    mock_tool_call = Mock()
    mock_tool_call.id = "call_123"
    mock_tool_call.function.name = "get_workflow_info"
    mock_tool_call.function.arguments = '{}'
    
    mock_message_with_tools = Mock()
    mock_message_with_tools.content = None
    mock_message_with_tools.tool_calls = [mock_tool_call]
    
    mock_message_final = Mock()
    mock_message_final.content = "Here's the workflow info"
    mock_message_final.tool_calls = None
    
    mock_response1 = AsyncMock()
    mock_response1.choices = [Mock()]
    mock_response1.choices[0].message = mock_message_with_tools
    
    mock_response2 = AsyncMock()
    mock_response2.choices = [Mock()]
    mock_response2.choices[0].message = mock_message_final
    
    mock_client = AsyncMock()
    mock_client.chat.completions.create = AsyncMock(side_effect=[mock_response1, mock_response2])
    setup_dependency_mocks(app, mock_client)
    
    with patch("backend.api.workflow_chat_routes.AsyncOpenAI") as mock_openai_class:
        mock_openai_class.return_value = mock_client
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.post(
                    "/api/workflow-chat/chat",
                    json={
                        "workflow_id": test_workflow.id,
                        "message": "What's in this workflow?",
                        "conversation_history": []
                    },
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_chat_add_node_with_config(db_session: AsyncSession, test_user: UserDB, test_workflow: WorkflowDB, test_settings: SettingsDB):
    """Test chat with add_node tool call including config"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_optional_user] = override_get_user
    
    token = create_access_token(data={"sub": test_user.username})
    
    # Mock OpenAI client with add_node tool call with agent config
    mock_tool_call = Mock()
    mock_tool_call.id = "call_123"
    mock_tool_call.function.name = "add_node"
    mock_tool_call.function.arguments = json.dumps({
        "node_type": "agent",
        "name": "Test Agent",
        "config": {
            "model": "gpt-4",
            "temperature": 0.7,
            "system_prompt": "You are helpful"
        }
    })
    
    mock_message_with_tools = Mock()
    mock_message_with_tools.content = None
    mock_message_with_tools.tool_calls = [mock_tool_call]
    
    mock_message_final = Mock()
    mock_message_final.content = "Agent node added"
    mock_message_final.tool_calls = None
    
    mock_response1 = AsyncMock()
    mock_response1.choices = [Mock()]
    mock_response1.choices[0].message = mock_message_with_tools
    
    mock_response2 = AsyncMock()
    mock_response2.choices = [Mock()]
    mock_response2.choices[0].message = mock_message_final
    
    mock_client = AsyncMock()
    mock_client.chat.completions.create = AsyncMock(side_effect=[mock_response1, mock_response2])
    setup_dependency_mocks(app, mock_client)
    
    with patch("backend.api.workflow_chat_routes.AsyncOpenAI") as mock_openai_class:
        mock_openai_class.return_value = mock_client
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.post(
                    "/api/workflow-chat/chat",
                    json={
                        "workflow_id": test_workflow.id,
                        "message": "Add an agent node",
                        "conversation_history": []
                    },
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()

