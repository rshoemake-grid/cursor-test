"""Unit tests for storage list-bucket API routes (handler wiring)."""
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from backend.api import storage_explorer_routes as ser
from backend.api.storage_explorer_routes import (
    AwsListBucketsRequest,
    GcpDefaultProjectRequest,
    GcpListBucketsRequest,
    GcpPubsubListSubscriptionsRequest,
    GcpPubsubListTopicsRequest,
)


@pytest.mark.asyncio
async def test_gcp_pubsub_list_topics_returns_objects():
    fake = [
        {"name": "t1", "display_name": "t1", "size": None, "updated": None},
    ]
    with patch.object(ser.GCPPubSubHandler, "list_topics", return_value=fake):
        out = await ser.gcp_pubsub_list_topics(
            GcpPubsubListTopicsRequest(project_id="p1"),
            _user=MagicMock(),
        )
    assert len(out.objects) == 1
    assert out.objects[0].name == "t1"


@pytest.mark.asyncio
async def test_gcp_pubsub_list_subscriptions_returns_objects():
    fake = [
        {"name": "s1", "display_name": "s1", "size": None, "updated": None},
    ]
    with patch.object(ser.GCPPubSubHandler, "list_subscriptions", return_value=fake):
        out = await ser.gcp_pubsub_list_subscriptions(
            GcpPubsubListSubscriptionsRequest(project_id="p1", topic_name="my-topic"),
            _user=MagicMock(),
        )
    assert len(out.objects) == 1
    assert out.objects[0].name == "s1"


@pytest.mark.asyncio
async def test_gcp_default_project_returns_project_id():
    with patch.object(ser, "resolve_gcp_default_project_id", return_value="my-proj"):
        out = await ser.gcp_default_project(
            GcpDefaultProjectRequest(),
            _user=MagicMock(),
        )
    assert out.project_id == "my-proj"


@pytest.mark.asyncio
async def test_gcp_list_buckets_returns_objects():
    fake = [
        {
            "name": "b1",
            "display_name": "b1",
            "size": None,
            "updated": None,
        },
    ]
    with patch.object(ser.GCPBucketHandler, "list_buckets", return_value=fake):
        out = await ser.gcp_list_buckets(
            GcpListBucketsRequest(),
            _user=MagicMock(),
        )
    assert len(out.objects) == 1
    assert out.objects[0].name == "b1"


@pytest.mark.asyncio
async def test_gcp_list_buckets_value_error_is_400():
    with patch.object(
        ser.GCPBucketHandler,
        "list_buckets",
        side_effect=ValueError("invalid credentials JSON"),
    ):
        with pytest.raises(HTTPException) as exc_info:
            await ser.gcp_list_buckets(
                GcpListBucketsRequest(),
                _user=MagicMock(),
            )
    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_gcp_list_projects_returns_objects():
    fake = [
        {
            "name": "my-proj",
            "display_name": "my-proj — My Project [123]",
            "size": None,
            "updated": None,
        },
    ]
    with patch.object(ser.GCPBucketHandler, "list_projects", return_value=fake):
        out = await ser.gcp_list_projects(
            ser.GcpListProjectsRequest(),
            _user=MagicMock(),
        )
    assert len(out.objects) == 1
    assert out.objects[0].name == "my-proj"


@pytest.mark.asyncio
async def test_aws_list_regions_returns_objects():
    fake = [
        {"name": "us-east-1", "display_name": "us-east-1", "size": None, "updated": None},
    ]
    with patch.object(ser.AWSS3Handler, "list_regions", return_value=fake):
        out = await ser.aws_list_regions(
            ser.AwsListRegionsRequest(),
            _user=MagicMock(),
        )
    assert len(out.objects) == 1
    assert out.objects[0].name == "us-east-1"


@pytest.mark.asyncio
async def test_aws_list_buckets_returns_objects():
    fake = [
        {
            "name": "my-s3-bucket",
            "display_name": "my-s3-bucket",
            "size": None,
            "updated": None,
        },
    ]
    with patch.object(ser.AWSS3Handler, "list_buckets", return_value=fake):
        out = await ser.aws_list_buckets(
            AwsListBucketsRequest(),
            _user=MagicMock(),
        )
    assert len(out.objects) == 1
    assert out.objects[0].name == "my-s3-bucket"
