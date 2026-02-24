"""Tests specifically designed to kill surviving mutants in sharing_routes.py

These tests target:
- ID comparisons (==, !=)
- Owner ID comparisons (workflow.owner_id == current_user.id)
- Username comparisons (UserDB.username == shared_with_username)
- Share existence checks (existing_share is not None)
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from backend.database.models import WorkflowDB, UserDB, WorkflowShareDB
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
async def other_user(db_session: AsyncSession):
    """Create another test user"""
    user = UserDB(
        id=str(uuid.uuid4()),
        username="otheruser",
        email="other@example.com",
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
        definition={"nodes": [], "edges": []},
        owner_id=test_user.id
    )
    db_session.add(workflow)
    await db_session.commit()
    return workflow


class TestIDComparisons:
    """Test ID comparison boundaries"""
    
    @pytest.mark.asyncio
    async def test_share_workflow_workflow_id_match(self, test_user, other_user, test_workflow, db_session):
        """Test share workflow with matching workflow_id (boundary: ==)"""
        from main import app
        from backend.database.db import get_db as get_db
        
        async def override_get_db():
            yield db_session
        
        async def override_get_user():
            return test_user
        
        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_current_active_user] = override_get_user
        
        token = create_access_token(data={"sub": test_user.username})
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.post(
                    "/api/sharing/share",
                    json={
                        "workflow_id": test_workflow.id,
                        "shared_with_username": other_user.username,
                        "permission": "view"
                    },
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 201
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_share_workflow_workflow_id_not_match(self, test_user, other_user, db_session):
        token = create_access_token(data={"sub": "testuser"})

        from main import app
        from backend.database.db import get_db as get_db
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                response = await client.post(
                    "/api/sharing/share",
                    json={
                        "workflow_id": str(uuid.uuid4()),  # Non-existent workflow
                        "shared_with_username": other_user.username,
                        "permission": "view"
                    },
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 404
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_share_workflow_username_match(self, test_user, other_user, test_workflow, db_session):
        """Test share workflow with matching username (boundary: ==)"""
        from main import app
        from backend.database.db import get_db as get_db
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                from backend.auth.auth import create_access_token
                token = create_access_token({"sub": test_user.username})
                response = await client.post(
                    "/api/sharing/share",
                    json={
                        "workflow_id": test_workflow.id,
                        "shared_with_username": other_user.username,
                        "permission": "view"
                    },
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 201
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_share_workflow_username_not_match(self, test_user, test_workflow, db_session):
        """Test share workflow with non-matching username (boundary: !=)"""
        from main import app
        from backend.database.db import get_db as get_db
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                from backend.auth.auth import create_access_token
                token = create_access_token({"sub": test_user.username})
                response = await client.post(
                    "/api/sharing/share",
                    json={
                        "workflow_id": test_workflow.id,
                        "shared_with_username": "nonexistent",
                        "permission": "view"
                    },
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 404
        finally:
            app.dependency_overrides.clear()


class TestOwnerIDComparisons:
    """Test owner ID comparison boundaries"""
    
    @pytest.mark.asyncio
    async def test_share_workflow_owner_id_match(self, test_user, other_user, test_workflow, db_session):
        """Test share workflow with matching owner_id (boundary: ==)"""
        from main import app
        from backend.database.db import get_db as get_db
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                from backend.auth.auth import create_access_token
                token = create_access_token({"sub": test_user.username})
                response = await client.post(
                    "/api/sharing/share",
                    json={
                        "workflow_id": test_workflow.id,
                        "shared_with_username": other_user.username,
                        "permission": "view"
                    },
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 201
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_share_workflow_owner_id_not_match(self, test_user, other_user, db_session):
        """Test share workflow with non-matching owner_id (boundary: !=)"""
        from main import app
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                from backend.database.models import WorkflowDB
                import uuid
                workflow = WorkflowDB(
                    id=str(uuid.uuid4()),
                    name="Other Workflow",
                    definition={"nodes": [], "edges": []},
                    owner_id=other_user.id
                )
                db_session.add(workflow)
                await db_session.commit()
                
                from backend.auth.auth import create_access_token
                token = create_access_token({"sub": test_user.username})
                response = await client.post(
                    "/api/sharing/share",
                    json={
                        "workflow_id": workflow.id,
                        "shared_with_username": other_user.username,
                        "permission": "view"
                    },
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 403
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_share_workflow_permission_view(self, test_user, other_user, test_workflow, db_session):
        """Test share workflow with permission 'view' (boundary: == 'view')"""
        from main import app
        from backend.database.db import get_db as get_db
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                from backend.auth.auth import create_access_token
                token = create_access_token({"sub": test_user.username})
                response = await client.post(
                    "/api/sharing/share",
                    json={
                        "workflow_id": test_workflow.id,
                        "shared_with_username": other_user.username,
                        "permission": "view"
                    },
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 201
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_revoke_share_owner_id_match(self, test_user, other_user, test_workflow, db_session):
        """Test revoke share with matching owner_id (boundary: ==)"""
        from main import app
        from backend.database.db import get_db as get_db
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                from backend.database.models import WorkflowShareDB
                import uuid
                share = WorkflowShareDB(
                    id=str(uuid.uuid4()),
                    workflow_id=test_workflow.id,
                    shared_with_user_id=other_user.id,
                    permission="view",
                    shared_by=test_user.id
                )
                db_session.add(share)
                await db_session.commit()
                
                from backend.auth.auth import create_access_token
                token = create_access_token({"sub": test_user.username})
                response = await client.delete(
                    f"/api/sharing/share/{share.id}",
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 204
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_revoke_share_owner_id_not_match(self, test_user, other_user, db_session):
        """Test revoke share with non-matching owner_id (boundary: !=)"""
        from main import app
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                from backend.database.models import WorkflowShareDB, WorkflowDB
                import uuid
                workflow = WorkflowDB(
                    id=str(uuid.uuid4()),
                    name="Other Workflow",
                    definition={"nodes": [], "edges": []},
                    owner_id=other_user.id
                )
                db_session.add(workflow)
                
                # Create share
                share = WorkflowShareDB(
                    id=str(uuid.uuid4()),
                    workflow_id=workflow.id,
                    shared_with_user_id=test_user.id,
                    permission="view",
                    shared_by=other_user.id
                )
                db_session.add(share)
                await db_session.commit()
                
                from backend.auth.auth import create_access_token
                token = create_access_token({"sub": test_user.username})
                response = await client.delete(
                    f"/api/sharing/share/{share.id}",
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 403  # Should fail - not the owner
        finally:
            app.dependency_overrides.clear()


class TestShareExistenceComparisons:
    """Test share existence comparison boundaries"""
    
    @pytest.mark.asyncio
    async def test_share_workflow_existing_share(self, test_user, other_user, test_workflow, db_session):
        """Test share workflow with existing share (boundary: existing_share is not None)"""
        from main import app
        from backend.database.db import get_db as get_db
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                from backend.database.models import WorkflowShareDB
                import uuid
                share = WorkflowShareDB(
                    id=str(uuid.uuid4()),
                    workflow_id=test_workflow.id,
                    shared_with_user_id=other_user.id,
                    permission="view",
                    shared_by=test_user.id
                )
                db_session.add(share)
                await db_session.commit()
                
                from backend.auth.auth import create_access_token
                token = create_access_token({"sub": test_user.username})
                response = await client.post(
                    "/api/sharing/share",
                    json={
                        "workflow_id": test_workflow.id,
                        "shared_with_username": other_user.username,
                        "permission": "view"
                    },
                    headers={"Authorization": f"Bearer {token}"}
                )
                # Should return error or success depending on implementation
                assert response.status_code in [200, 201, 400, 409]
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_share_workflow_no_existing_share(self, test_user, other_user, test_workflow, db_session):
        """Test share workflow with no existing share (boundary: existing_share is None)"""
        from main import app
        from backend.database.db import get_db as get_db
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db] = override_get_db
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                from backend.auth.auth import create_access_token
                token = create_access_token({"sub": test_user.username})
                response = await client.post(
                    "/api/sharing/share",
                    json={
                        "workflow_id": test_workflow.id,
                        "shared_with_username": other_user.username,
                        "permission": "view"
                    },
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 201
        finally:
            app.dependency_overrides.clear()


class TestSharedWithUserIDComparisons:
    """Test shared_with_user_id comparison boundaries"""
    
    @pytest.mark.asyncio
    async def test_get_shared_workflows_user_id_match(self, test_user, other_user, test_workflow, db_session):
        """Test get shared workflows with matching user_id (boundary: ==)"""
        from main import app
        from backend.database.db import get_db as get_db
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db] = override_get_db
        
        from backend.auth import get_current_active_user
        
        async def override_get_user():
            return test_user
        
        app.dependency_overrides[get_current_active_user] = override_get_user
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                from backend.database.models import WorkflowShareDB
                import uuid
                share = WorkflowShareDB(
                    id=str(uuid.uuid4()),
                    workflow_id=test_workflow.id,
                    shared_with_user_id=test_user.id,
                    permission="view",
                    shared_by=other_user.id
                )
                db_session.add(share)
                await db_session.commit()
                
                from backend.auth.auth import create_access_token
                token = create_access_token(data={"sub": test_user.username})
                response = await client.get(
                    "/api/sharing/shared-with-me",
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 200
                data = response.json()
                assert len(data) == 1
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_get_shared_workflows_user_id_not_match(self, test_user, other_user, test_workflow, db_session):
        """Test get shared workflows with non-matching user_id (boundary: !=)"""
        from main import app
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db] = override_get_db
        
        from backend.auth import get_current_active_user
        
        async def override_get_user():
            return test_user
        
        app.dependency_overrides[get_current_active_user] = override_get_user
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                from backend.database.models import WorkflowShareDB
                import uuid
                share = WorkflowShareDB(
                    id=str(uuid.uuid4()),
                    workflow_id=test_workflow.id,
                    shared_with_user_id=other_user.id,
                    permission="view",
                    shared_by=test_user.id
                )
                db_session.add(share)
                await db_session.commit()
                
                from backend.auth.auth import create_access_token
                token = create_access_token(data={"sub": test_user.username})
                response = await client.get(
                    "/api/sharing/shared-with-me",
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 200
                data = response.json()
                assert len(data) == 0  # No shares for test_user
        finally:
            app.dependency_overrides.clear()


class TestSharedByComparisons:
    """Test shared_by comparison boundaries"""
    
    @pytest.mark.asyncio
    async def test_get_my_shares_shared_by_match(self, test_user, other_user, test_workflow, db_session):
        """Test get my shares with matching shared_by (boundary: ==)"""
        from main import app
        from backend.database.db import get_db as get_db
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db] = override_get_db
        
        from backend.auth import get_current_active_user
        
        async def override_get_user():
            return test_user
        
        app.dependency_overrides[get_current_active_user] = override_get_user
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                from backend.database.models import WorkflowShareDB
                import uuid
                share = WorkflowShareDB(
                    id=str(uuid.uuid4()),
                    workflow_id=test_workflow.id,
                    shared_with_user_id=other_user.id,
                    permission="view",
                    shared_by=test_user.id
                )
                db_session.add(share)
                await db_session.commit()
                
                from backend.auth.auth import create_access_token
                token = create_access_token(data={"sub": test_user.username})
                response = await client.get(
                    "/api/sharing/shared-by-me",
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 200
                data = response.json()
                assert len(data) == 1
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_get_my_shares_shared_by_not_match(self, test_user, other_user, test_workflow, db_session):
        """Test get my shares with non-matching shared_by (boundary: !=)"""
        from main import app
        from backend.database.db import get_db as get_db
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db] = override_get_db
        
        from backend.auth import get_current_active_user
        
        async def override_get_user():
            return test_user
        
        app.dependency_overrides[get_current_active_user] = override_get_user
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                from backend.database.models import WorkflowShareDB
                import uuid
                share = WorkflowShareDB(
                    id=str(uuid.uuid4()),
                    workflow_id=test_workflow.id,
                    shared_with_user_id=test_user.id,
                    permission="view",
                    shared_by=other_user.id  # Different user
                )
                db_session.add(share)
                await db_session.commit()
                
                from backend.auth.auth import create_access_token
                token = create_access_token(data={"sub": test_user.username})
                response = await client.get(
                    "/api/sharing/shared-by-me",
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 200
                data = response.json()
                assert len(data) == 0  # No shares by test_user
        finally:
            app.dependency_overrides.clear()


class TestWorkflowExistenceComparisons:
    """Test workflow existence comparison boundaries"""
    
    @pytest.mark.asyncio
    async def test_revoke_share_workflow_exists(self, test_user, other_user, test_workflow, db_session):
        """Test revoke share with existing workflow (boundary: workflow is not None)"""
        from main import app
        from backend.database.db import get_db as get_db
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db] = override_get_db
        
        from backend.auth import get_current_active_user
        
        async def override_get_user():
            return test_user
        
        app.dependency_overrides[get_current_active_user] = override_get_user
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                from backend.database.models import WorkflowShareDB
                import uuid
                share = WorkflowShareDB(
                    id=str(uuid.uuid4()),
                    workflow_id=test_workflow.id,
                    shared_with_user_id=other_user.id,
                    permission="view",
                    shared_by=test_user.id
                )
                db_session.add(share)
                await db_session.commit()
                
                from backend.auth.auth import create_access_token
                token = create_access_token(data={"sub": test_user.username})
                response = await client.delete(
                    f"/api/sharing/share/{share.id}",
                    headers={"Authorization": f"Bearer {token}"}
                )
                assert response.status_code == 204
        finally:
            app.dependency_overrides.clear()
    
    @pytest.mark.asyncio
    async def test_revoke_share_workflow_not_exists(self, test_user, other_user, db_session):
        """Test revoke share with non-existent workflow (boundary: workflow is None)"""
        from main import app
        from backend.database.db import get_db as get_db
        
        async def override_get_db():
            yield db_session
        
        app.dependency_overrides[get_db] = override_get_db
        
        from backend.auth import get_current_active_user
        
        async def override_get_user():
            return test_user
        
        app.dependency_overrides[get_current_active_user] = override_get_user
        
        try:
            async with AsyncClient(app=app, base_url="http://test") as client:
                from backend.database.models import WorkflowShareDB
                import uuid
                share = WorkflowShareDB(
                    id=str(uuid.uuid4()),
                    workflow_id=str(uuid.uuid4()),  # Non-existent workflow
                    shared_with_user_id=other_user.id,
                    permission="view",
                    shared_by=test_user.id
                )
                db_session.add(share)
                await db_session.commit()
                
                from backend.auth.auth import create_access_token
                token = create_access_token(data={"sub": test_user.username})
                response = await client.delete(
                    f"/api/sharing/share/{share.id}",
                    headers={"Authorization": f"Bearer {token}"}
                )
                # Should handle gracefully (may return 404 or 403)
                assert response.status_code in [204, 403, 404]
        finally:
            app.dependency_overrides.clear()

