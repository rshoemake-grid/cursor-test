"""Tests for storage explorer API (GCP bucket browser)."""
from unittest.mock import patch

import pytest
from httpx import ASGITransport, AsyncClient

from backend.database.models import UserDB
from main import app


@pytest.fixture
def mock_user():
    return UserDB(
        id="user-browse-1",
        username="browse_tester",
        email="b@example.com",
        hashed_password="x",
        is_active=True,
    )


@pytest.mark.asyncio
async def test_gcp_list_objects_requires_auth():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/storage/gcp/list-objects",
            json={"bucket_name": "my-bucket"},
        )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_gcp_list_objects_success(mock_user):
    fake_prefixes = ["data/", "incoming/"]
    fake_objects = [
        {
            "name": "data/file.txt",
            "display_name": "file.txt",
            "size": 10,
            "updated": "2024-01-01T00:00:00+00:00",
        }
    ]

    async def override_user():
        return mock_user

    from backend.auth.auth import get_current_active_user

    app.dependency_overrides[get_current_active_user] = override_user
    try:
        with patch(
            "backend.api.storage_explorer_routes.GCPBucketHandler.list_objects",
            return_value=(fake_prefixes, fake_objects),
        ):
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                response = await client.post(
                    "/api/storage/gcp/list-objects",
                    json={
                        "bucket_name": "my-bucket",
                        "prefix": "data/",
                        "credentials": None,
                    },
                )
        assert response.status_code == 200
        data = response.json()
        assert data["bucket_name"] == "my-bucket"
        assert data["prefix"] == "data/"
        assert data["prefixes"] == fake_prefixes
        assert len(data["objects"]) == 1
        assert data["objects"][0]["name"] == "data/file.txt"
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_gcp_list_objects_validation_error(mock_user):
    async def override_user():
        return mock_user

    from backend.auth.auth import get_current_active_user

    app.dependency_overrides[get_current_active_user] = override_user
    try:
        with patch(
            "backend.api.storage_explorer_routes.GCPBucketHandler.list_objects",
            side_effect=ValueError("bucket_name is required for GCP Bucket listing"),
        ):
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                response = await client.post(
                    "/api/storage/gcp/list-objects",
                    json={"bucket_name": "x"},
                )
        assert response.status_code == 400
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_aws_list_objects_success(mock_user):
    fake_prefixes = ["incoming/"]
    fake_objects = [
        {
            "name": "incoming/a.json",
            "display_name": "a.json",
            "size": 5,
            "updated": None,
        }
    ]

    async def override_user():
        return mock_user

    from backend.auth.auth import get_current_active_user

    app.dependency_overrides[get_current_active_user] = override_user
    try:
        with patch(
            "backend.api.storage_explorer_routes.AWSS3Handler.list_objects",
            return_value=(fake_prefixes, fake_objects),
        ):
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                response = await client.post(
                    "/api/storage/aws/list-objects",
                    json={"bucket_name": "s3-bucket", "prefix": ""},
                )
        assert response.status_code == 200
        data = response.json()
        assert data["bucket_name"] == "s3-bucket"
        assert data["prefixes"] == fake_prefixes
        assert len(data["objects"]) == 1
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_local_list_directory_success(mock_user):
    from pathlib import Path as PathLibPath

    fake_current = PathLibPath("/data/proj")
    fake_base = PathLibPath("/data")

    async def override_user():
        return mock_user

    from backend.auth.auth import get_current_active_user

    app.dependency_overrides[get_current_active_user] = override_user
    try:
        with patch(
            "backend.api.storage_explorer_routes.LocalFileSystemHandler.list_directory",
            return_value=(
                fake_current,
                ["/data/proj/sub/"],
                [
                    {
                        "name": "/data/proj/readme.txt",
                        "display_name": "readme.txt",
                        "size": 3,
                        "updated": None,
                    }
                ],
                True,
                fake_base,
            ),
        ):
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as client:
                response = await client.post(
                    "/api/storage/local/list-directory",
                    json={"directory": "/data/proj"},
                )
        assert response.status_code == 200
        data = response.json()
        assert data["directory"] == "/data/proj"
        assert data["can_go_up"] is True
        assert len(data["prefixes"]) == 1
        assert len(data["objects"]) == 1
    finally:
        app.dependency_overrides.clear()
