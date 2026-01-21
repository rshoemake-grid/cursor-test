"""Tests for workflow chat API routes"""
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
async def test_chat_with_workflow_no_llm_config(db_session: AsyncSession, test_user: UserDB, test_workflow: WorkflowDB):
    """Test chat without LLM config"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_optional_user] = override_get_user
    
    token = create_access_token(data={"sub": test_user.username})
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/workflow-chat/chat",
                json={
                    "workflow_id": test_workflow.id,
                    "message": "Add a node",
                    "conversation_history": []
                },
                headers={"Authorization": f"Bearer {token}"}
            )
            # Should fail with 400 - no LLM config
            assert response.status_code == 400
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_chat_with_workflow_success(db_session: AsyncSession, test_user: UserDB, test_workflow: WorkflowDB, test_settings: SettingsDB):
    """Test successful chat with workflow"""
    from main import app
    from openai import AsyncOpenAI
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_optional_user] = override_get_user
    
    token = create_access_token(data={"sub": test_user.username})
    
    # Mock OpenAI client
    mock_response = AsyncMock()
    mock_message = Mock()
    mock_message.content = "I'll add a node for you."
    mock_message.tool_calls = None
    mock_response.choices = [Mock()]
    mock_response.choices[0].message = mock_message
    
    # Mock SettingsService and LLMClientFactory dependencies
    from backend.services.settings_service import ISettingsService
    from backend.services.llm_client_factory import ILLMClientFactory
    from backend.dependencies import SettingsServiceDep, LLMClientFactoryDep
    
    mock_settings_service = Mock(spec=ISettingsService)
    mock_settings_service.get_active_llm_config.return_value = {
        "type": "openai",
        "api_key": "sk-test-key-123456789012345678901234567890",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4"
    }
    mock_settings_service.get_user_settings.return_value = Mock(iteration_limit=10)
    
    mock_llm_client_factory = Mock(spec=ILLMClientFactory)
    mock_client = AsyncMock()
    mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
    mock_llm_client_factory.create_client.return_value = mock_client
    
    from backend.dependencies import get_settings_service, get_llm_client_factory
    app.dependency_overrides[get_settings_service] = lambda: mock_settings_service
    app.dependency_overrides[get_llm_client_factory] = lambda: mock_llm_client_factory
    
    # Also need to mock AsyncOpenAI in case it's imported elsewhere
    with patch("backend.api.workflow_chat_routes.AsyncOpenAI") as mock_openai_class:
        mock_openai_class.return_value = mock_client
    
    try:
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/api/workflow-chat/chat",
                json={
                    "workflow_id": test_workflow.id,
                    "message": "Add a node",
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
async def test_chat_with_workflow_tool_calls(db_session: AsyncSession, test_user: UserDB, test_workflow: WorkflowDB, test_settings: SettingsDB):
    """Test chat with tool calls"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_optional_user] = override_get_user
    
    token = create_access_token(data={"sub": test_user.username})
    
    # Mock OpenAI client with tool calls
    mock_tool_call = Mock()
    mock_tool_call.id = "call_123"
    mock_tool_call.function.name = "add_node"
    mock_tool_call.function.arguments = '{"node_type": "agent", "name": "Test Agent"}'
    
    mock_message_with_tools = Mock()
    mock_message_with_tools.content = None
    mock_message_with_tools.tool_calls = [mock_tool_call]
    
    mock_message_final = Mock()
    mock_message_final.content = "Node added successfully"
    mock_message_final.tool_calls = None
    
    mock_response1 = AsyncMock()
    mock_response1.choices = [Mock()]
    mock_response1.choices[0].message = mock_message_with_tools
    
    mock_response2 = AsyncMock()
    mock_response2.choices = [Mock()]
    mock_response2.choices[0].message = mock_message_final
    
    # Mock SettingsService and LLMClientFactory dependencies
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
    mock_client = AsyncMock()
    mock_client.chat.completions.create = AsyncMock(side_effect=[mock_response1, mock_response2])
    mock_llm_client_factory.create_client = Mock(return_value=mock_client)
    
    app.dependency_overrides[get_settings_service] = lambda: mock_settings_service
    app.dependency_overrides[get_llm_client_factory] = lambda: mock_llm_client_factory
    
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
                data = response.json()
                assert "message" in data
                # Should have workflow changes
                if "workflow_changes" in data and data["workflow_changes"]:
                    assert "nodes_to_add" in data["workflow_changes"]
        finally:
            app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_get_workflow_context(db_session: AsyncSession, test_user: UserDB, test_workflow: WorkflowDB):
    """Test getting workflow context"""
    from backend.api.workflow_chat_routes import get_workflow_context
    
    context = await get_workflow_context(db_session, test_workflow.id)
    assert isinstance(context, str)
    assert "Test Workflow" in context


@pytest.mark.asyncio
async def test_get_workflow_context_no_workflow(db_session: AsyncSession):
    """Test getting workflow context for non-existent workflow"""
    from backend.api.workflow_chat_routes import get_workflow_context
    
    context = await get_workflow_context(db_session, None)
    assert isinstance(context, str)
    assert "No workflow" in context or "workflow" in context.lower()


@pytest.mark.asyncio
async def test_chat_with_workflow_max_iterations(db_session: AsyncSession, test_user: UserDB, test_workflow: WorkflowDB, test_settings: SettingsDB):
    """Test chat hitting max iterations"""
    from main import app
    
    async def override_get_db():
        yield db_session
    
    async def override_get_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_optional_user] = override_get_user
    
    token = create_access_token(data={"sub": test_user.username})
    
    # Mock OpenAI client that always returns tool calls (to hit max iterations)
    mock_tool_call = Mock()
    mock_tool_call.id = "call_123"
    mock_tool_call.function.name = "add_node"
    mock_tool_call.function.arguments = '{"node_type": "agent"}'
    
    mock_message = Mock()
    mock_message.content = None
    mock_message.tool_calls = [mock_tool_call]
    
    mock_response = AsyncMock()
    mock_response.choices = [Mock()]
    mock_response.choices[0].message = mock_message
    
    # Mock SettingsService and LLMClientFactory dependencies
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
    mock_settings_service.get_user_settings.return_value = Mock(iteration_limit=2)  # Low limit for max iterations test
    
    mock_llm_client_factory = Mock(spec=ILLMClientFactory)
    mock_client = AsyncMock()
    # Return tool calls repeatedly to hit max iterations
    mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
    mock_llm_client_factory.create_client = Mock(return_value=mock_client)
    
    app.dependency_overrides[get_settings_service] = lambda: mock_settings_service
    app.dependency_overrides[get_llm_client_factory] = lambda: mock_llm_client_factory
    
    with patch("backend.api.workflow_chat_routes.AsyncOpenAI") as mock_openai_class:
        mock_openai_class.return_value = mock_client
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.post(
                    "/api/workflow-chat/chat",
                    json={
                        "workflow_id": test_workflow.id,
                        "message": "Add nodes",
                        "conversation_history": []
                    },
                    headers={"Authorization": f"Bearer {token}"}
                )
                # Should complete but hit max iterations
                assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()

