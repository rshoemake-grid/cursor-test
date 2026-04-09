"""
Authenticated helpers to browse cloud and local storage from the workflow builder UI.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from backend.auth.auth import get_current_active_user
from backend.database.models import UserDB
from backend.inputs.input_sources import (
    AWSS3Handler,
    GCPBucketHandler,
    GCPPubSubHandler,
    LocalFileSystemHandler,
)
from backend.inputs.gcp_auth import resolve_gcp_default_project_id
from backend.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/storage", tags=["storage"])


class StorageObjectInfo(BaseModel):
    name: str
    display_name: str
    size: Optional[int] = None
    updated: Optional[str] = None


class GcpListObjectsRequest(BaseModel):
    bucket_name: str = Field(..., min_length=1)
    credentials: Optional[str] = None
    project_id: Optional[str] = None
    prefix: str = ""
    delimiter: Optional[str] = "/"
    max_results: int = Field(default=2000, ge=1, le=10000)


class GcpListObjectsResponse(BaseModel):
    prefixes: List[str]
    objects: List[StorageObjectInfo]
    bucket_name: str
    prefix: str


class AwsListObjectsRequest(BaseModel):
    bucket_name: str = Field(..., min_length=1)
    prefix: str = ""
    delimiter: Optional[str] = "/"
    max_results: int = Field(default=2000, ge=1, le=10000)
    access_key_id: Optional[str] = None
    secret_access_key: Optional[str] = None
    region: str = "us-east-1"


class AwsListObjectsResponse(BaseModel):
    prefixes: List[str]
    objects: List[StorageObjectInfo]
    bucket_name: str
    prefix: str


class LocalListDirectoryRequest(BaseModel):
    directory: str = ""


class LocalListDirectoryResponse(BaseModel):
    prefixes: List[str]
    objects: List[StorageObjectInfo]
    directory: str
    base_path: str
    can_go_up: bool


class GcpDefaultProjectRequest(BaseModel):
    credentials: Optional[str] = None


class GcpDefaultProjectResponse(BaseModel):
    project_id: Optional[str] = None


class GcpListBucketsRequest(BaseModel):
    credentials: Optional[str] = None
    project_id: Optional[str] = None
    max_results: int = Field(default=1000, ge=1, le=10000)


class GcpListProjectsRequest(BaseModel):
    credentials: Optional[str] = None
    max_results: int = Field(default=500, ge=1, le=2000)


class GcpPubsubListTopicsRequest(BaseModel):
    credentials: Optional[str] = None
    project_id: str = Field(..., min_length=1)
    max_results: int = Field(default=500, ge=1, le=2000)


class GcpPubsubListSubscriptionsRequest(BaseModel):
    credentials: Optional[str] = None
    project_id: str = Field(..., min_length=1)
    topic_name: str = ""
    max_results: int = Field(default=500, ge=1, le=2000)


class AwsListRegionsRequest(BaseModel):
    access_key_id: Optional[str] = None
    secret_access_key: Optional[str] = None


class AwsListBucketsRequest(BaseModel):
    access_key_id: Optional[str] = None
    secret_access_key: Optional[str] = None
    region: str = "us-east-1"
    max_results: int = Field(default=1000, ge=1, le=10000)


class ListBucketsResponse(BaseModel):
    """Flat list of buckets (same item shape as object rows for shared pickers)."""

    objects: List[StorageObjectInfo]


@router.post("/gcp/list-objects", response_model=GcpListObjectsResponse)
async def gcp_list_objects(
    body: GcpListObjectsRequest,
    _user: UserDB = Depends(get_current_active_user),
) -> GcpListObjectsResponse:
    """
    List GCS prefixes and objects under a path for the bucket file picker.
    Uses the same credentials / ADC rules as workflow GCP bucket nodes.
    """
    config = {
        "bucket_name": body.bucket_name.strip(),
        "credentials": body.credentials,
        "project_id": body.project_id.strip() if body.project_id else None,
    }
    try:
        prefixes, objects = GCPBucketHandler.list_objects(
            config,
            prefix=body.prefix,
            delimiter=body.delimiter,
            max_results=body.max_results,
        )
    except ImportError as e:
        logger.warning("GCP list-objects: %s", e)
        raise HTTPException(status_code=503, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.exception("GCP list-objects failed for bucket=%s", body.bucket_name)
        raise HTTPException(
            status_code=502,
            detail=f"Could not list bucket objects: {e!s}",
        ) from e

    return GcpListObjectsResponse(
        prefixes=prefixes,
        objects=[StorageObjectInfo(**o) for o in objects],
        bucket_name=config["bucket_name"],
        prefix=body.prefix,
    )


@router.post("/gcp/default-project", response_model=GcpDefaultProjectResponse)
async def gcp_default_project(
    body: GcpDefaultProjectRequest,
    _user: UserDB = Depends(get_current_active_user),
) -> GcpDefaultProjectResponse:
    """
    Resolve the default GCP project for the GCP Bucket editor (service account JSON,
    env vars, or Application Default Credentials).
    """
    pid = resolve_gcp_default_project_id(credentials_inline=body.credentials)
    return GcpDefaultProjectResponse(project_id=pid)


@router.post("/gcp/list-buckets", response_model=ListBucketsResponse)
async def gcp_list_buckets(
    body: GcpListBucketsRequest,
    _user: UserDB = Depends(get_current_active_user),
) -> ListBucketsResponse:
    """List GCS buckets for the authenticated credentials / ADC."""
    config: dict = {
        "credentials": body.credentials,
        "project_id": body.project_id.strip() if body.project_id else None,
    }
    try:
        rows = GCPBucketHandler.list_buckets(config, max_results=body.max_results)
    except ImportError as e:
        logger.warning("GCP list-buckets: %s", e)
        raise HTTPException(status_code=503, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.exception("GCP list-buckets failed")
        raise HTTPException(
            status_code=502,
            detail=f"Could not list buckets: {e!s}",
        ) from e
    return ListBucketsResponse(objects=[StorageObjectInfo(**o) for o in rows])


@router.post("/gcp/list-projects", response_model=ListBucketsResponse)
async def gcp_list_projects(
    body: GcpListProjectsRequest,
    _user: UserDB = Depends(get_current_active_user),
) -> ListBucketsResponse:
    """List GCP projects the caller can access (Resource Manager)."""
    config: dict = {"credentials": body.credentials}
    try:
        rows = GCPBucketHandler.list_projects(config, max_results=body.max_results)
    except ImportError as e:
        logger.warning("GCP list-projects: %s", e)
        raise HTTPException(status_code=503, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.exception("GCP list-projects failed")
        raise HTTPException(
            status_code=502,
            detail=f"Could not list projects: {e!s}",
        ) from e
    return ListBucketsResponse(objects=[StorageObjectInfo(**o) for o in rows])


@router.post("/gcp/pubsub/list-topics", response_model=ListBucketsResponse)
async def gcp_pubsub_list_topics(
    body: GcpPubsubListTopicsRequest,
    _user: UserDB = Depends(get_current_active_user),
) -> ListBucketsResponse:
    """List Pub/Sub topics in a project for the Pub/Sub node picker."""
    config: dict = {
        "credentials": body.credentials,
        "project_id": body.project_id.strip(),
    }
    try:
        rows = GCPPubSubHandler.list_topics(config, max_results=body.max_results)
    except ImportError as e:
        logger.warning("GCP Pub/Sub list-topics: %s", e)
        raise HTTPException(status_code=503, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.exception("GCP Pub/Sub list-topics failed")
        raise HTTPException(
            status_code=502,
            detail=f"Could not list Pub/Sub topics: {e!s}",
        ) from e
    return ListBucketsResponse(objects=[StorageObjectInfo(**o) for o in rows])


@router.post("/gcp/pubsub/list-subscriptions", response_model=ListBucketsResponse)
async def gcp_pubsub_list_subscriptions(
    body: GcpPubsubListSubscriptionsRequest,
    _user: UserDB = Depends(get_current_active_user),
) -> ListBucketsResponse:
    """
    List Pub/Sub subscriptions. When topic_name is set, only subscriptions on that topic;
    otherwise all subscriptions in the project (capped).
    """
    config: dict = {
        "credentials": body.credentials,
        "project_id": body.project_id.strip(),
    }
    topic = body.topic_name.strip() if body.topic_name else ""
    try:
        rows = GCPPubSubHandler.list_subscriptions(
            config,
            topic_name=topic or None,
            max_results=body.max_results,
        )
    except ImportError as e:
        logger.warning("GCP Pub/Sub list-subscriptions: %s", e)
        raise HTTPException(status_code=503, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.exception("GCP Pub/Sub list-subscriptions failed")
        raise HTTPException(
            status_code=502,
            detail=f"Could not list Pub/Sub subscriptions: {e!s}",
        ) from e
    return ListBucketsResponse(objects=[StorageObjectInfo(**o) for o in rows])


@router.post("/aws/list-objects", response_model=AwsListObjectsResponse)
async def aws_list_objects(
    body: AwsListObjectsRequest,
    _user: UserDB = Depends(get_current_active_user),
) -> AwsListObjectsResponse:
    """List S3 common prefixes and keys for the bucket file picker."""
    config = {
        "bucket_name": body.bucket_name.strip(),
        "access_key_id": body.access_key_id,
        "secret_access_key": body.secret_access_key,
        "region": body.region or "us-east-1",
    }
    try:
        prefixes, objects = AWSS3Handler.list_objects(
            config,
            prefix=body.prefix,
            delimiter=body.delimiter,
            max_results=body.max_results,
        )
    except ImportError as e:
        logger.warning("AWS list-objects: %s", e)
        raise HTTPException(status_code=503, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.exception("AWS list-objects failed for bucket=%s", body.bucket_name)
        raise HTTPException(
            status_code=502,
            detail=f"Could not list bucket objects: {e!s}",
        ) from e

    return AwsListObjectsResponse(
        prefixes=prefixes,
        objects=[StorageObjectInfo(**o) for o in objects],
        bucket_name=config["bucket_name"],
        prefix=body.prefix,
    )


@router.post("/aws/list-buckets", response_model=ListBucketsResponse)
async def aws_list_buckets(
    body: AwsListBucketsRequest,
    _user: UserDB = Depends(get_current_active_user),
) -> ListBucketsResponse:
    """List S3 buckets for the configured or default AWS credential chain."""
    config = {
        "access_key_id": body.access_key_id,
        "secret_access_key": body.secret_access_key,
        "region": body.region or "us-east-1",
    }
    try:
        rows = AWSS3Handler.list_buckets(config, max_results=body.max_results)
    except ImportError as e:
        logger.warning("AWS list-buckets: %s", e)
        raise HTTPException(status_code=503, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.exception("AWS list-buckets failed")
        raise HTTPException(
            status_code=502,
            detail=f"Could not list buckets: {e!s}",
        ) from e
    return ListBucketsResponse(objects=[StorageObjectInfo(**o) for o in rows])


@router.post("/aws/list-regions", response_model=ListBucketsResponse)
async def aws_list_regions(
    body: AwsListRegionsRequest,
    _user: UserDB = Depends(get_current_active_user),
) -> ListBucketsResponse:
    """List AWS regions enabled for this account (EC2 DescribeRegions)."""
    config = {
        "access_key_id": body.access_key_id,
        "secret_access_key": body.secret_access_key,
    }
    try:
        rows = AWSS3Handler.list_regions(config)
    except ImportError as e:
        logger.warning("AWS list-regions: %s", e)
        raise HTTPException(status_code=503, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.exception("AWS list-regions failed")
        raise HTTPException(
            status_code=502,
            detail=f"Could not list regions: {e!s}",
        ) from e
    return ListBucketsResponse(objects=[StorageObjectInfo(**o) for o in rows])


@router.post("/local/list-directory", response_model=LocalListDirectoryResponse)
async def local_list_directory(
    body: LocalListDirectoryRequest,
    _user: UserDB = Depends(get_current_active_user),
) -> LocalListDirectoryResponse:
    """
    List directories and files on the server for the local path picker.
    Respects LOCAL_FILE_BASE_PATH when set (same as workflow execution).
    """
    try:
        current, prefixes, objects, can_go_up, base = LocalFileSystemHandler.list_directory(
            body.directory,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        logger.exception("local list-directory failed")
        raise HTTPException(
            status_code=502,
            detail=f"Could not list directory: {e!s}",
        ) from e

    return LocalListDirectoryResponse(
        prefixes=prefixes,
        objects=[StorageObjectInfo(**o) for o in objects],
        directory=str(current),
        base_path=str(base),
        can_go_up=can_go_up,
    )
