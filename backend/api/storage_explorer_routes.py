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
    LocalFileSystemHandler,
)
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
