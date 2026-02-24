"""Tests specifically designed to kill surviving mutants in marketplace_routes.py

These tests target:
- Boolean comparisons (== True, == False)
- ID comparisons (==, !=)
- Sort comparisons (== "popular", == "recent", == "likes")
- Category comparisons (== category)
- Like existence checks (existing_like is not None)
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from datetime import datetime

from backend.database.models import WorkflowDB, UserDB, WorkflowLikeDB
from backend.database.db import get_db
from backend.auth import get_current_active_user, create_access_token


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
async def public_workflow(db_session: AsyncSession, test_user: UserDB):
    """Create a public workflow"""
    workflow = WorkflowDB(
        id=str(uuid.uuid4()),
        name="Public Workflow",
        definition={"nodes": [], "edges": []},
        owner_id=test_user.id,
        is_public=True,
        is_template=False,
        likes_count=5,
        views_count=10,
        uses_count=3
    )
    db_session.add(workflow)
    await db_session.commit()
    return workflow




class TestBooleanComparisons:
    """Test boolean comparison boundaries"""
    
    @pytest.mark.asyncio
    async def test_discover_workflows_is_public_true(self, test_user, db_session):
        """Test discover workflows with is_public == True (boundary: == True)"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        workflow = WorkflowDB(
            id=str(uuid.uuid4()),
            name="Public Workflow",
            definition={"nodes": [], "edges": []},
            owner_id=test_user.id,
            is_public=True,
            is_template=False
        )
        db_session.add(workflow)
        await db_session.commit()
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.get("/api/marketplace/discover")
                assert response.status_code == 200
                data = response.json()
                assert len(data) >= 1
                assert any(w["id"] == workflow.id for w in data)
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_discover_workflows_is_public_false(self, test_user, db_session):
        """Test discover workflows with is_public == False (boundary: == False)"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                workflow = WorkflowDB(
                    id=str(uuid.uuid4()),
                    name="Private Workflow",
                    definition={"nodes": [], "edges": []},
                    owner_id=test_user.id,
                    is_public=False,
                    is_template=False
                )
                db_session.add(workflow)
                await db_session.commit()
                
                response = await client.get("/api/marketplace/discover")
                assert response.status_code == 200
                data = response.json()
                assert not any(w["id"] == workflow.id for w in data)
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_discover_workflows_is_template_true(self, test_user, db_session):
        """Test discover workflows with is_template == True (boundary: == True)"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                workflow = WorkflowDB(
                    id=str(uuid.uuid4()),
                    name="Template Workflow",
                    definition={"nodes": [], "edges": []},
                    owner_id=test_user.id,
                    is_public=False,
                    is_template=True
                )
                db_session.add(workflow)
                await db_session.commit()
                
                response = await client.get("/api/marketplace/discover")
                assert response.status_code == 200
                data = response.json()
                assert len(data) >= 1
                assert any(w["id"] == workflow.id for w in data)
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_discover_workflows_is_template_false(self, test_user, db_session):
        """Test discover workflows with is_template == False (boundary: == False)"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                workflow = WorkflowDB(
                    id=str(uuid.uuid4()),
                    name="Non-Template Workflow",
                    definition={"nodes": [], "edges": []},
                    owner_id=test_user.id,
                    is_public=False,
                    is_template=False
                )
                db_session.add(workflow)
                await db_session.commit()
                
                response = await client.get("/api/marketplace/discover")
                assert response.status_code == 200
                data = response.json()
                assert not any(w["id"] == workflow.id for w in data)
        finally:
            app.dependency_overrides.clear()


class TestSortComparisons:
    """Test sort comparison boundaries"""
    
    @pytest.mark.asyncio
    async def test_discover_workflows_sort_popular(self, test_user, db_session):
        """Test discover workflows with sort_by == 'popular' (boundary: == 'popular')"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                workflow1 = WorkflowDB(
                id=str(uuid.uuid4()),
                name="Popular Workflow",
                definition={"nodes": [], "edges": []},
                owner_id=test_user.id,
                is_public=True,
                uses_count=10
                )
                workflow2 = WorkflowDB(
                id=str(uuid.uuid4()),
                name="Less Popular Workflow",
                definition={"nodes": [], "edges": []},
                owner_id=test_user.id,
                is_public=True,
                uses_count=5
                )
                db_session.add(workflow1)
                db_session.add(workflow2)
                await db_session.commit()
                
                response = await client.get("/api/marketplace/discover", params={"sort_by": "popular"})
                assert response.status_code == 200
                data = response.json()
                assert len(data) >= 2
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_discover_workflows_sort_recent(self, test_user, db_session):
        """Test discover workflows with sort_by == 'recent' (boundary: == 'recent')"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                workflow = WorkflowDB(
                id=str(uuid.uuid4()),
                name="Recent Workflow",
                definition={"nodes": [], "edges": []},
                owner_id=test_user.id,
                is_public=True,
                created_at=datetime.utcnow()
                )
                db_session.add(workflow)
                await db_session.commit()
        
                response = await client.get("/api/marketplace/discover", params={"sort_by": "recent"})
                assert response.status_code == 200
                data = response.json()
                assert len(data) >= 1
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_discover_workflows_sort_likes(self, test_user, db_session):
        """Test discover workflows with sort_by == 'likes' (boundary: == 'likes')"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                workflow1 = WorkflowDB(
                id=str(uuid.uuid4()),
                name="Liked Workflow",
                definition={"nodes": [], "edges": []},
                owner_id=test_user.id,
                is_public=True,
                likes_count=10
                )
                workflow2 = WorkflowDB(
                id=str(uuid.uuid4()),
                name="Less Liked Workflow",
                definition={"nodes": [], "edges": []},
                owner_id=test_user.id,
                is_public=True,
                likes_count=5
                )
                db_session.add(workflow1)
                db_session.add(workflow2)
                await db_session.commit()
        
                response = await client.get("/api/marketplace/discover", params={"sort_by": "likes"})
                assert response.status_code == 200
                data = response.json()
                assert len(data) >= 2
        finally:
            app.dependency_overrides.clear()


class TestCategoryComparisons:
    """Test category comparison boundaries"""
    
    @pytest.mark.asyncio
    async def test_discover_workflows_category_match(self, test_user, db_session):
        """Test discover workflows with matching category (boundary: == category)"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                workflow = WorkflowDB(
                id=str(uuid.uuid4()),
                name="Category Workflow",
                definition={"nodes": [], "edges": []},
                owner_id=test_user.id,
                is_public=True,
                category="automation"
                )
                db_session.add(workflow)
                await db_session.commit()
        
                response = await client.get("/api/marketplace/discover", params={"category": "automation"})
                assert response.status_code == 200
                data = response.json()
                assert len(data) >= 1
                assert any(w["category"] == "automation" for w in data)
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_discover_workflows_category_not_match(self, test_user, db_session):
        """Test discover workflows with non-matching category (boundary: != category)"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                workflow = WorkflowDB(
                id=str(uuid.uuid4()),
                name="Category Workflow",
                definition={"nodes": [], "edges": []},
                owner_id=test_user.id,
                is_public=True,
                category="automation"
                )
                db_session.add(workflow)
                await db_session.commit()
        
                response = await client.get("/api/marketplace/discover", params={"category": "other"})
                assert response.status_code == 200
                data = response.json()
                assert not any(w["category"] == "automation" for w in data)
        finally:
            app.dependency_overrides.clear()


class TestLikeExistenceComparisons:
    """Test like existence comparison boundaries"""
    
    @pytest.mark.asyncio
    async def test_like_workflow_existing_like(self, test_user, public_workflow, db_session):
        """Test like workflow with existing like (boundary: existing_like is not None)"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        from backend.auth import get_current_active_user
        
        async def override_get_user():
            return test_user
        
        app.dependency_overrides[get_current_active_user] = override_get_user
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                # Create existing like
                like = WorkflowLikeDB(
                    id=str(uuid.uuid4()),
                    workflow_id=public_workflow.id,
                    user_id=test_user.id
                )
                db_session.add(like)
                await db_session.commit()
                
                from backend.auth.auth import create_access_token
                token = create_access_token(data={"sub": test_user.username})
                response = await client.post(
                    "/api/marketplace/like",
                    json={"workflow_id": public_workflow.id},
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 201
                data = response.json()
                assert "Already liked" in data["message"]
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_like_workflow_no_existing_like(self, test_user, public_workflow, db_session):
        """Test like workflow with no existing like (boundary: existing_like is None)"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        from backend.auth import get_current_active_user
        
        async def override_get_user():
            return test_user
        
        app.dependency_overrides[get_current_active_user] = override_get_user
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                from backend.auth.auth import create_access_token
                token = create_access_token(data={"sub": test_user.username})
                response = await client.post(
                    "/api/marketplace/like",
                    json={"workflow_id": public_workflow.id},
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 201
                data = response.json()
                assert "Liked successfully" in data["message"]
        finally:
            app.dependency_overrides.clear()


class TestWorkflowIDComparisons:
    """Test workflow ID comparison boundaries"""
    
    @pytest.mark.asyncio
    async def test_like_workflow_workflow_id_match(self, test_user, public_workflow, db_session):
        """Test like workflow with matching workflow_id (boundary: ==)"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        from backend.auth import get_current_active_user
        
        async def override_get_user():
            return test_user
        
        app.dependency_overrides[get_current_active_user] = override_get_user
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                from backend.auth.auth import create_access_token
                token = create_access_token(data={"sub": test_user.username})
                response = await client.post(
                    "/api/marketplace/like",
                    json={"workflow_id": public_workflow.id},
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 201
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_like_workflow_workflow_id_not_match(self, test_user, db_session):
        """Test like workflow with non-matching workflow_id (boundary: !=)"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        from backend.auth import get_current_active_user
        
        async def override_get_user():
            return test_user
        
        app.dependency_overrides[get_current_active_user] = override_get_user
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                from backend.auth.auth import create_access_token
                token = create_access_token(data={"sub": test_user.username})
                response = await client.post(
                    "/api/marketplace/like",
                    json={"workflow_id": str(uuid.uuid4())},  # Non-existent workflow
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 404
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_unlike_workflow_workflow_id_match(self, test_user, public_workflow, db_session):
        """Test unlike workflow with matching workflow_id (boundary: ==)"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        from backend.auth import get_current_active_user
        
        async def override_get_user():
            return test_user
        
        app.dependency_overrides[get_current_active_user] = override_get_user
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                # Create like
                like = WorkflowLikeDB(
                    id=str(uuid.uuid4()),
                    workflow_id=public_workflow.id,
                    user_id=test_user.id
                )
                db_session.add(like)
                await db_session.commit()
                
                from backend.auth.auth import create_access_token
                token = create_access_token(data={"sub": test_user.username})
                response = await client.delete(
                    f"/api/marketplace/like/{public_workflow.id}",
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 204
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_unlike_workflow_workflow_id_not_match(self, test_user, db_session):
        """Test unlike workflow with non-matching workflow_id (boundary: !=)"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        from backend.auth import get_current_active_user
        
        async def override_get_user():
            return test_user
        
        app.dependency_overrides[get_current_active_user] = override_get_user
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                from backend.auth.auth import create_access_token
                token = create_access_token(data={"sub": test_user.username})
                response = await client.delete(
                    f"/api/marketplace/like/{str(uuid.uuid4())}",  # Non-existent workflow
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 404
        finally:
            app.dependency_overrides.clear()


class TestUserIDComparisons:
    """Test user ID comparison boundaries"""
    
    @pytest.mark.asyncio
    async def test_like_workflow_user_id_match(self, test_user, public_workflow, db_session):
        """Test like workflow with matching user_id (boundary: ==)"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        from backend.auth import get_current_active_user
        
        async def override_get_user():
            return test_user
        
        app.dependency_overrides[get_current_active_user] = override_get_user
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                from backend.auth.auth import create_access_token
                token = create_access_token(data={"sub": test_user.username})
                response = await client.post(
                    "/api/marketplace/like",
                    json={"workflow_id": public_workflow.id},
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 201
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_get_my_likes_user_id_match(self, test_user, public_workflow, db_session):
        """Test get my likes with matching user_id (boundary: ==)"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        from backend.auth import get_current_active_user
        
        async def override_get_user():
            return test_user
        
        app.dependency_overrides[get_current_active_user] = override_get_user
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                # Create like
                like = WorkflowLikeDB(
                    id=str(uuid.uuid4()),
                    workflow_id=public_workflow.id,
                    user_id=test_user.id
                )
                db_session.add(like)
                await db_session.commit()
                
                from backend.auth.auth import create_access_token
                token = create_access_token(data={"sub": test_user.username})
                response = await client.get(
                    "/api/marketplace/my-likes",
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 200
                data = response.json()
                assert len(data) >= 1
        finally:
            app.dependency_overrides.clear()


class TestWorkflowExistenceComparisons:
    """Test workflow existence comparison boundaries"""
    
    @pytest.mark.asyncio
    async def test_like_workflow_workflow_exists(self, test_user, public_workflow, db_session):
        """Test like workflow with existing workflow (boundary: workflow is not None)"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        from backend.auth import get_current_active_user
        
        async def override_get_user():
            return test_user
        
        app.dependency_overrides[get_current_active_user] = override_get_user
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                from backend.auth.auth import create_access_token
                token = create_access_token(data={"sub": test_user.username})
                response = await client.post(
                    "/api/marketplace/like",
                    json={"workflow_id": public_workflow.id},
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 201
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_like_workflow_workflow_not_exists(self, test_user, db_session):
        """Test like workflow with non-existent workflow (boundary: workflow is None)"""
        from main import app
        from backend.database.db import get_db as get_db_func
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db_func] = override_get_db
        
        from backend.auth import get_current_active_user
        
        async def override_get_user():
            return test_user
        
        app.dependency_overrides[get_current_active_user] = override_get_user
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                from backend.auth.auth import create_access_token
                token = create_access_token(data={"sub": test_user.username})
                response = await client.post(
                    "/api/marketplace/like",
                    json={"workflow_id": str(uuid.uuid4())},  # Non-existent workflow
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 404
        finally:
            app.dependency_overrides.clear()

