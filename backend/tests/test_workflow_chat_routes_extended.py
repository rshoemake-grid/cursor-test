"""Extended tests for workflow chat routes - tool calling scenarios"""
import pytest
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
async def test_chat_update_node(db_session: AsyncSession, test_user: UserDB, test_workflow: WorkflowDB, test_settings: SettingsDB):
    """Test chat with update_node tool call"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_optional_user] = override_get_user
    
    token = create_access_token(data={"sub": test_user.username})
    
    # Mock OpenAI client with update_node tool call
    mock_tool_call = Mock()
    mock_tool_call.id = "call_123"
    mock_tool_call.function.name = "update_node"
    mock_tool_call.function.arguments = '{"node_id": "start-1", "updates": {"name": "Updated Start"}}'
    
    mock_message_with_tools = Mock()
    mock_message_with_tools.content = None
    mock_message_with_tools.tool_calls = [mock_tool_call]
    
    mock_message_final = Mock()
    mock_message_final.content = "Node updated successfully"
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
                        "message": "Update the start node",
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
async def test_chat_delete_node(db_session: AsyncSession, test_user: UserDB, test_workflow: WorkflowDB, test_settings: SettingsDB):
    """Test chat with delete_node tool call"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_optional_user] = override_get_user
    
    token = create_access_token(data={"sub": test_user.username})
    
    # Mock OpenAI client with delete_node tool call
    mock_tool_call = Mock()
    mock_tool_call.id = "call_123"
    mock_tool_call.function.name = "delete_node"
    mock_tool_call.function.arguments = '{"node_id": "start-1"}'
    
    mock_message_with_tools = Mock()
    mock_message_with_tools.content = None
    mock_message_with_tools.tool_calls = [mock_tool_call]
    
    mock_message_final = Mock()
    mock_message_final.content = "Node deleted"
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
                        "message": "Delete the start node",
                        "conversation_history": []
                    },
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_chat_add_edge(db_session: AsyncSession, test_user: UserDB, test_workflow: WorkflowDB, test_settings: SettingsDB):
    """Test chat with add_edge tool call"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_optional_user] = override_get_user
    
    token = create_access_token(data={"sub": test_user.username})
    
    # Mock OpenAI client with add_edge tool call
    mock_tool_call = Mock()
    mock_tool_call.id = "call_123"
    mock_tool_call.function.name = "add_edge"
    mock_tool_call.function.arguments = '{"source": "start-1", "target": "end-1"}'
    
    mock_message_with_tools = Mock()
    mock_message_with_tools.content = None
    mock_message_with_tools.tool_calls = [mock_tool_call]
    
    mock_message_final = Mock()
    mock_message_final.content = "Edge added"
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
async def test_chat_save_workflow(db_session: AsyncSession, test_user: UserDB, test_workflow: WorkflowDB, test_settings: SettingsDB):
    """Test chat with save_workflow tool call"""
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
    mock_tool_call.function.arguments = '{"name": "Updated Workflow"}'
    
    mock_message_with_tools = Mock()
    mock_message_with_tools.content = None
    mock_message_with_tools.tool_calls = [mock_tool_call]
    
    mock_message_final = Mock()
    mock_message_final.content = "Workflow saved"
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
                        "message": "Save the workflow",
                        "conversation_history": []
                    },
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_chat_invalid_tool_call(db_session: AsyncSession, test_user: UserDB, test_workflow: WorkflowDB, test_settings: SettingsDB):
    """Test chat with invalid tool call"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_optional_user] = override_get_user
    
    token = create_access_token(data={"sub": test_user.username})
    
    # Mock OpenAI client with invalid tool call
    mock_tool_call = Mock()
    mock_tool_call.id = "call_123"
    mock_tool_call.function.name = "invalid_tool"
    mock_tool_call.function.arguments = '{}'
    
    mock_message_with_tools = Mock()
    mock_message_with_tools.content = None
    mock_message_with_tools.tool_calls = [mock_tool_call]
    
    mock_message_final = Mock()
    mock_message_final.content = "Unknown tool"
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
                        "message": "Do something",
                        "conversation_history": []
                    },
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()

